import { AESEncrypt, AESEncryptHex, customError, KeyGen, makeTx, metaTxTargets } from './Utils'
import * as ethers from 'ethers'
import { Wallet } from 'ethers'
import axios from 'axios'
import { split } from 'shamir'
import { encrypt } from 'eciesjs'

import { randomBytes } from 'crypto-browserify'

import { wrapInstance } from './sentry'
import { requiresAllDecorators } from './decorators'
import type { UploadParams } from './types'
import type { StateContainer } from './state'

function convertByteCounterToAESCounter (value: number) {
  if (value === 0) {
    return new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  }
  let counterValue = value / 16
  const counter = new Uint8Array(16)
  for (let index = 15; index >= 0; --index) {
    counter[index] = counterValue % 256
    counterValue = Math.floor(counterValue / 256)
  }
  return counter
}

export class Uploader {
  private readonly state: StateContainer

  constructor (state: StateContainer, debug: boolean) {
    this.state = state

    if (debug) {
      wrapInstance(this)
    }
  }

  onSuccess = () => {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onProgress = (bytesUploaded: number, bytesTotal: number): void => {}

  onError = (err) => {
    console.log('Error', err)
  }

  @requiresAllDecorators
  async upload (fileRaw: File, params: UploadParams = { chunkSize: 10 * 2 ** 20, publicFile: false }) {
    const file: File = fileRaw
    const chunkSize = params.chunkSize ? params.chunkSize : 10 * 2 ** 20
    /* if (!(file instanceof Blob)) {
      throw customError('TRANSACTION', 'File must be a Blob or a descendant of a Blob such as a File.')
    } */

    const hasher = new KeyGen(file, chunkSize)
    const hash = await hasher.getHash()
    // 0x01 -> Public File
    // 0x02 -> Private File (default)
    const didPrefix = Uint8Array.from([params.publicFile ? 0x01 : 0x02])
    const did = ethers.utils.hexlify(Buffer.concat([didPrefix, ethers.utils.randomBytes(31)]))

    let key
    let JWTToken
    let nodeResp
    if (this.state.appID) {
      nodeResp = (
        await this.state.api.get('/api/v1/get-node-address/', {
          params: {
            appid: this.state.appID
          }
        })
      ).data
    } else {
      nodeResp = (
        await this.state.api.get('/api/v1/get-node-address/', {
          params: {
            address: this.state.appAddr
          }
        })
      ).data
    }
    const host = nodeResp.host
    let name, gatewayName: string

    // If it's a private file, generate a key and store the shares in the DKG
    if (!params.publicFile) {
      key = await window.crypto.subtle.generateKey(
        {
          name: 'AES-CTR',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      )
      const aesRaw = await crypto.subtle.exportKey('raw', key)
      try {
        let nameHex = ethers.utils.formatBytes32String(file.name)
        if (nameHex[65] !== '0') throw Error()
        nameHex = '0' + nameHex.substring(2, 65)
        name = '0x' + (await AESEncryptHex(key, nameHex))
      } catch (e) {
        gatewayName = await AESEncrypt(key, file.name)
        name = ethers.utils.id(gatewayName)
      }

      const ephemeralWallet = await ethers.Wallet.createRandom()
      const res = await makeTx(this.state, metaTxTargets.APPLICATION, 'uploadInit', [
        did,
        ethers.BigNumber.from(file.size),
        name,
        '0x' + (await AESEncryptHex(key, hash)),
        nodeResp.address,
        ephemeralWallet.address
      ])
      JWTToken = res.token
      const txHash = res.txHash
      // Fetch DKG Node Details from dkg contract
      const nodes = await this.state.dkgContract.getCurrentEpochDetails()
      // Doing shamir secrete sharing
      const parts = nodes.length
      // At least 2/3rd nodes is required for share recovery
      const quorum = nodes.length - Math.floor(nodes.length / 3)
      const shares = split(randomBytes, parts, quorum, new Uint8Array(aesRaw))
      for (let i = 0; i < parts; i++) {
        const publicKey =
          nodes[i].pubKx._hex.replace('0x', '').padStart(64, '0') +
          nodes[i].pubKy._hex.replace('0x', '').padStart(64, '0')
        if (publicKey.length < 128) {
          console.log('public key is too short')
          continue
        }
        const ciphertextRaw = encrypt(publicKey, shares[i + 1])
        const ciphertext = ciphertextRaw.toString('hex')
        const url = 'https://' + nodes[i].declaredIp + '/rpc'
        await axios.post(url, {
          jsonrpc: '2.0',
          method: 'StoreKeyShare',
          id: 10,
          params: {
            tx_hash: txHash,
            encrypted_share: ciphertext,
            signature: await ephemeralWallet.signMessage(
              ethers.utils.id(JSON.stringify({ tx_hash: txHash, encrypted_share: ciphertext }))
            )
          }
        })
      }
    } else {
      // Otherwise, generate a random address and create the uploadInit transaction
      const ephemeralWallet = Wallet.createRandom()

      try {
        let nameHex = ethers.utils.formatBytes32String(file.name)
        if (nameHex[65] !== '0') throw Error()
        nameHex = '0' + nameHex.substring(2, 65)
        name = '0x' + nameHex
      } catch (e) {
        gatewayName = file.name
        name = ethers.utils.id(gatewayName)
      }

      const res = await makeTx(this.state, metaTxTargets.APPLICATION, 'uploadInit', [
        did,
        ethers.BigNumber.from(file.size),
        name,
        '0x' + hash,
        nodeResp.address,
        ephemeralWallet.address
      ])
      JWTToken = res.token
    }

    let completeResp

    try {
      const endpoint = new URL(host)
      endpoint.pathname = '/api/v2/file/' + did
      const headers = {
        Authorization: 'Bearer ' + JWTToken
      }

      // 1. Create a file
      await axios({
        method: 'POST',
        url: endpoint.href,
        headers
      })

      const parts = Math.ceil(file.size / chunkSize)
      let uploadedParts = 0
      let counter = 0
      endpoint.pathname = `/api/v2/file/${did}`
      while (uploadedParts < parts) {
        const slicedChunk = await file.slice(counter, Math.min(counter + chunkSize, file.size))
        let chunk = await slicedChunk.arrayBuffer()

        if (!params.publicFile) {
          chunk = await window.crypto.subtle.encrypt(
            {
              counter: convertByteCounterToAESCounter(counter),
              length: 64,
              name: 'AES-CTR'
            },
            key,
            chunk
          )
        }

        // 2. Upload parts
        await axios({
          method: 'PATCH',
          url: endpoint.href,
          params: {
            part: (uploadedParts + 1).toString()
          },
          headers: {
            ...headers,
            'Content-Type': 'application/octet-stream'
          },
          data: chunk
        })

        this.onProgress(counter + chunk.byteLength, file.size)
        counter += chunkSize
        uploadedParts++
      }

      endpoint.pathname = `/api/v2/file/${did}/complete`
      // 3. Complete the upload
      completeResp = (
        await axios({
          method: 'PATCH',
          url: endpoint.href,
          headers
        })
      ).data
    } catch (e) {
      this.onError(e)
    }

    try {
      const tx = await this.state.provider.getTransaction(
        completeResp.hash.substring(0, 2) === '0x' ? completeResp.hash : '0x' + completeResp.hash
      )
      await tx.wait()
      await this.onSuccess()
    } catch (e) {
      if (e.reason) {
        if (e.reason.includes('file_already_uploaded')) {
          throw customError('TRANSACTION', `File already exist. DID: ${did}`)
        } else {
          throw customError('TRANSACTION', e.reason)
        }
      } else {
        throw customError('', e.error)
      }
    }
    if (gatewayName) {
      await this.state.api.post(
        '/api/v1/file-name/',
        {},
        {
          params: {
            did,
            name: gatewayName
          }
        }
      )
    }
    return did.replace('0x', '')
  }
}

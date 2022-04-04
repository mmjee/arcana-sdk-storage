import {
  KeyGen,
  fromHexString,
  toHexString,
  makeTx,
  AESEncrypt,
  encryptKey,
  customError,
  isFileUploaded,
} from './Utils';
import { promisify } from 'util'
import * as tus from 'tus-js-client';
import FileReader from './fileReader';
import { utils, BigNumber, ethers } from 'ethers';

import axios, { AxiosInstance } from 'axios';
import _blobToBuffer from 'blob-to-buffer'

const blobToBuffer = promisify(_blobToBuffer)

export function getIVFromCounter (value) {
  if (value === 0) {
    return new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  let counterValue = value / 16;
  const counter = new Uint8Array(16);
  for (let index = 15; index >= 0; --index) {
    counter[index] = counterValue % 256;
    counterValue = Math.floor(counterValue / 256);
  }
  return counter;
}

// Encrypt a file larger than available RAM, using only (by default) 32MB at a time
async function encryptWholeFile ({ key, file, chunkSize }) {
  const possibleChunks = Math.ceil(file.size / chunkSize)
  const blobParts = []

  for (let chunkNo = 0; chunkNo < possibleChunks; chunkNo++) {
    const min = chunkNo * chunkSize
    const max = min + chunkSize

    const chunk = file.slice(min, max)
    const buf = await blobToBuffer(chunk)

    const iv = getIVFromCounter(chunkNo)
    const ct = await window.crypto.subtle.encrypt(
      {
        counter: iv,
        length: 64,
        name: 'AES-CTR',
      },
      key,
      buf
    )

    blobParts.push(ct)
  }

  return new Blob(blobParts, {
    type: 'application/octet-stream'
  })
}

export class Uploader {
  private provider: any;
  private api: AxiosInstance;
  private appAddress: string;

  constructor(appAddress: string, provider: any, api: AxiosInstance) {
    this.provider = provider;
    this.api = api;
    this.appAddress = appAddress;
  }

  onSuccess = () => {};

  onProgress = (bytesUploaded: number, bytesTotal: number) => {};

  onError = (err) => {
    console.log('Error', err);
  };

  onUpload = async (host: string, token: string, did: string) => {
    if (host) {
      let res;
      for (let i = 0; i < 5; i++) {
        try {
          res = await this.api.get(`${host}hash`, {headers: {Authorization: `Bearer ${token}`}});
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 1000));
          console.log('retrying to fetch tx hash');
        }
      }
      try {
        const tx = await this.provider.getTransaction(
          res.data.hash.substring(0, 2) == '0x' ? res.data.hash : '0x' + res.data.hash,
        );
        await tx.wait();
        await this.onSuccess();
      } catch (e) {
        if (e.reason) {
          if (e.reason.includes('Owner already exist for this file')) {
            throw customError('TRANSACTION', `File already exist. DID: ${did}`);
          } else {
            throw customError('TRANSACTION', e.reason);
          }
        } else {
          throw customError('', e.error);
        }
      }
    }
  };

  upload = async (file: any, chunkSize: number = 2 ** 25) => {
    const walletAddress = (await this.provider.send('eth_requestAccounts', []))[0];
    const hasher = new KeyGen(file, chunkSize);
    let key;
    const hash = await hasher.getHash();
    const signedHash = await this.provider.send('personal_sign', [
      `Sign this to proceed with the encryption of file with hash ${hash}`,
      walletAddress,
    ]);
    const did = utils.id(hash + signedHash);

    key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-CTR',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt'],
    );

    const aesRaw = await crypto.subtle.exportKey('raw', key);
    const hexString = toHexString(aesRaw);
    const encryptedMetaData = await AESEncrypt(
      key,
      JSON.stringify({
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        hash,
      }),
    );

    const ciphertextBlob = await encryptWholeFile({
      key,
      file,
      chunkSize
    })

    const node = (await this.api.get('/api/get-address/')).data;
    const host = node.host;

    const res = await makeTx(this.appAddress, this.api, this.provider, 'uploadInit', [
      did,
      BigNumber.from(6),
      BigNumber.from(4),
      BigNumber.from(file.size),
      utils.toUtf8Bytes(encryptedMetaData),
      utils.toUtf8Bytes(hexString),
      node.address,
    ]);

    await axios({
      method: 'PUT',
      url: 'https://localhost:8022/api/v1/upload/' + did,
      data: ciphertextBlob,
      headers: {
        'Authentication': 'Bearer ' + res.token,
        'Content-Type': 'application/octet-stream'
      }
    })

    // console.log('Upload Completed:', data)
    this.onSuccess()
    return did;
  };
}

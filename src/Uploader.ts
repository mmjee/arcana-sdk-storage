import {
  getProvider,
  customError, toHexString,
} from './Utils';
import { utils, BigNumber } from 'ethers';
import { AxiosInstance } from 'axios';

import { promisify } from 'util'
import _blobToBuffer from 'blob-to-buffer'
import {addUploadToLocalDB} from "./db";

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
  private readonly wallet: any;
  private readonly convergence: string;
  private readonly api: AxiosInstance;
  private readonly appAddress: string;
  private readonly client: any;

  constructor(appAddress: string, wallet: any, convergence: string, api: AxiosInstance, client) {
    this.wallet = wallet;
    this.convergence = convergence;
    this.api = api;
    this.appAddress = appAddress;
    this.client = client;
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
          res = await this.api.get(`${host}hash`, { headers: { Authorization: `Bearer ${token}` } });
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 1000));
          console.log('retrying to fetch tx hash');
        }
      }
      const provider = getProvider();
      try {
        const tx = await provider.getTransaction(
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

  upload = async (fileRaw: File, chunkSize: number = 2 ** 25) => {
    const walletAddress = await this.wallet.getAddress();

    const key = await window.crypto.subtle.generateKey(
        {
          name: 'AES-CTR',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt'],
    );

    const finalBlob = await encryptWholeFile({ key, file: fileRaw, chunkSize })
    const { skylink } = await this.client.uploadFile(finalBlob)

    const aesRaw = await crypto.subtle.exportKey('raw', key);
    const hexString = toHexString(aesRaw);

    console.log('Skylink:', skylink, 'Key:', hexString)
    await addUploadToLocalDB({
      skylink,
      key: hexString
    })
    return skylink
  }
}

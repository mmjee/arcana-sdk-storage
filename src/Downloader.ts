import { decryptWithPrivateKey } from 'eth-crypto';
import { utils } from 'ethers';
import axios, { AxiosInstance } from 'axios';

import Sha256 from './SHA256';
import { getIVFromCounter } from "./Uploader";

import * as DB from './db'
import {customError, fromHexString} from "./Utils";

const downloadBlob = (blob, fileName) => {
  // @ts-ignore
  if (navigator.msSaveBlob) {
    // IE 10+
    // @ts-ignore
    navigator.msSaveBlob(blob, fileName);
  } else {
    const link = document.createElement('a');
    // Browsers that support HTML5 download attribute
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};

export function createAndDownloadBlobFile(body, filename) {
  const blob = new Blob([body]);
  downloadBlob(blob, filename);
}

export class Downloader {
  private provider: any;
  private hasher;
  private api: AxiosInstance;
  private appAddress: string;

  constructor(appAddress: string, provider: any, api: AxiosInstance) {
    this.provider = provider;
    this.hasher = new Sha256();
    this.api = api;
    this.appAddress = appAddress;
  }

  onSuccess = async () => {};
  onProgress = async (bytesDownloaded: number, bytesTotal: number) => {};

  download = async (did, chunkSize = 2 ** 25) => {
    did = did.substring(0, 2) !== '0x' ? '0x' + did : did;
    // const arcana = Arcana(this.appAddress, this.provider);

    const file = await DB.getUploadByDID(did)
    if (!file) {
      throw customError('UNAUTHORIZED', 'File does not exist')
    }
    /*
    let file;
    try {
      file = await arcana.getFile(did, readHash, { from: await this.provider.getSigner().getAddress() });
    } catch (e) {
      throw customError('UNAUTHORIZED', "You can't download this file");
    }
    const res = await makeTx(this.appAddress, this.api, this.provider, 'checkPermission', [did, readHash]);
    const decryptedKey = utils.toUtf8String(file.encryptedKey);
     */
    const key = await window.crypto.subtle.importKey('raw', fromHexString(file.key), 'AES-CTR', false, [
      'encrypt',
      'decrypt',
    ]);

    // const fileMeta = JSON.parse(await AESDecrypt(key, utils.toUtf8String(file.encryptedMetaData)));
    const fileMeta = file.meta

    // Decrypt file larger than RAM
    // BUG / TODO
    // metadata.len is somehow empty, using a fallback size of 1, i.e. files larger than 32MiB won't work
    const possibleChunks = fileMeta.len ? Math.ceil(fileMeta.size / chunkSize) : 1
    const blobParts = []

    for (let chunkNo = 0; chunkNo < possibleChunks; chunkNo++) {
      const min = chunkNo * chunkSize
      const max = min + chunkSize

      const { data: chunk, status } = await axios.get('http://localhost:8022/api/v1/download/' + did, {
        headers: {
          Range: 'bytes=' + min.toString() + '-' + max.toString()
        },
        responseType: 'arraybuffer'
      })

      if (status !== 206) {
        console.error('???', status, chunk)
      }

      const iv = getIVFromCounter(chunkNo)
      const ct = await window.crypto.subtle.decrypt(
        {
          counter: iv,
          length: 64,
          name: 'AES-CTR',
        },
        key,
        chunk
      )

      blobParts.push(new Blob([ct]))
    }

    const blob = new Blob(blobParts, {
      type: 'application/octet-stream'
    })
    return downloadBlob(blob, 'test.file')
  };
}

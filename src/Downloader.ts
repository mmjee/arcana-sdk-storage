import { AxiosInstance } from 'axios';
import { SkynetClient } from "skynet-js";

import Sha256 from './SHA256';
import { fromHexString } from "./Utils";
import { getUploadBySkylink} from "./db";
import { getIVFromCounter } from "./Uploader";

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
  private wallet: any;
  private convergence: string;
  private hasher;
  private api: AxiosInstance;
  private appAddress: string;
  private client: SkynetClient;

  constructor(appAddress: string, wallet: any, convergence: string, api: AxiosInstance, client) {
    this.wallet = wallet;
    this.convergence = convergence;
    this.hasher = new Sha256();
    this.api = api;
    this.appAddress = appAddress;
    this.client = client;
  }

  onSuccess = async () => {};
  onProgress = async (bytesDownloaded: number, bytesTotal: number) => {};

  download = async (did) => {
    const sl = await getUploadBySkylink(did)
    const [{ metadata }, directUrl] = await Promise.all([
      this.client.getMetadata(sl.skylink),
      this.client.getSkylinkUrl(sl.skylink)
    ])

    const key = await window.crypto.subtle.importKey('raw', fromHexString(sl.key), 'AES-CTR', false, [
      'encrypt',
      'decrypt',
    ]);

    // Decrypt file larger than RAM
    const possibleChunks = Math.ceil(metadata.len / chunkSize)
    const blobParts = []

    for (let chunkNo = 0; chunkNo < possibleChunks; chunkNo++) {
      const min = chunkNo * chunkSize
      const max = min + chunkSize

      const { data: chunk, status } = await this.api.get(directUrl, {
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

      blobParts.push(ct)
    }

    const blob = new Blob(blobParts, {
      type: 'application/octet-stream'
    })
    return downloadBlob(blob, 'test.file')
  };
}

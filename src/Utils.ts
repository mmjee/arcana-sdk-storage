import './SHA256';
import Sha256 from './SHA256';

export class KeyGen {
  hasher: any;
  file: File;
  chunkSize: number;

  constructor(file: File, chunkSize = 10 * 2 ** 20) {
    this.file = file;
    this.hasher = new Sha256();
    this.chunkSize = chunkSize;
  }

  async read<T>(position: number, length: number, binary?: boolean): Promise<{ data: T; length: number }> {
    return new Promise((resolve, reject) => {
      this._chunk_reader(position, length, binary, (evt: any) => {
        if (evt.target.error == null) {
          resolve({ data: evt.target.result, length: evt.total });
        } else {
          reject(evt.target.error);
        }
      });
    });
  }

  private _chunk_reader(offset: number, length: number, binary: boolean, readEventHandler: (evt: any) => void) {
    const r: FileReader = new FileReader();
    let blob;
    if (!(offset === 0 && this.file.size <= length)) {
      blob = this.file.slice(offset, offset + length);
    } else {
      blob = this.file;
    }
    r.onload = readEventHandler;
    if (binary) {
      r.readAsBinaryString(blob);
    } else {
      r.readAsArrayBuffer(blob);
    }
  }

  getKey = async () => {
    await this.getHash();
    return this.hasher.digest().slice(16);
  };

  getHash = async () => {
    let offset = 0;
    while (offset < this.file.size) {
      let data = await this.read(offset, offset + this.chunkSize);
      offset += data.length;
      this.hasher.update(data.data);
    }
    return this.hasher
      .digest()
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('');
  };
}

export const fromHexString = (hexString: string): Uint8Array =>
  new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

export const toHexString = (bytes: ArrayBuffer): string =>
  new Uint8Array(bytes).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';

import { Wallet } from 'ethers';
import axios, { AxiosInstance } from 'axios';
import { SkynetClient } from "skynet-js"

import { Uploader } from './Uploader';
import { Downloader } from './Downloader';
import { Access } from './Access';
import * as utils from './Utils';
import { Arcana as ArcanaT } from './typechain';

export class StorageProvider {
  private wallet: Wallet;
  private convergence: string;
  private readonly email: string;
  private api: AxiosInstance;
  private appAddress: string;
  private appId: number;
  private arcana: ArcanaT;
  private skynetClient: SkynetClient;
  private readonly gateway: string;
  private readonly privateKey: string;

  constructor(config: utils.Config) {
    this.privateKey = config.privateKey;
    this.email = config.email;
    this.appId = config.appId;
    if (config.debug) {
      Sentry.init({
        dsn: 'https://1a411b6bfed244de8f6a7d64bb432bd4@o1011868.ingest.sentry.io/6081085',
        integrations: [new Integrations.BrowserTracing()],
        tracesSampleRate: 1.0,
      });
    }
    if (!this.privateKey) {
      throw new Error('Null wallet');
    }
    if (!config.gateway) {
      this.gateway = 'https://gateway-testnet.arcana.network/';
    } else {
      this.gateway = config.gateway;
    }

    this.skynetClient = new SkynetClient('https://siasky.net')
  }

  setConvergence = async () => {
    await this.login();
    if (!this.convergence) {
      this.arcana = utils.Arcana(this.appAddress);
      this.convergence = await this.arcana.convergence(await this.wallet.getAddress());
      if (!this.convergence) {
        const conv = String(Math.random());
        await utils.makeTx(this.appAddress, this.api, this.wallet, 'setConvergence', [conv]);
        this.convergence = conv;
      }
    }
  };

  getUploader = async () => {
    await this.setConvergence();
    return new Uploader(this.appAddress, this.wallet, this.convergence, this.api, this.skynetClient);
  };

  getAccess = async () => {
    await this.setConvergence();
    return new Access(this.appAddress, this.wallet, this.convergence, this.api);
  };

  getDownloader = async () => {
    await this.setConvergence();
    return new Downloader(this.appAddress, this.wallet, this.convergence, this.api);
  };

  login = async () => {
    let res = (await axios.get(this.gateway + 'get-config/')).data;
    localStorage.setItem('forwarder', res.Forwarder);
    localStorage.setItem('rpc_url', res.RPC_URL);

    this.wallet = utils.getWallet(this.privateKey);

    const nonce = (await axios.get(this.gateway + `get-nonce/?address=${this.wallet.address}`)).data;
    const sig = await this.wallet.signMessage(String(nonce));

    res = await axios.post(this.gateway + `login/`, {
      signature: sig,
      email: this.email,
      address: this.wallet.address,
    });
    this.api = axios.create({
      baseURL: this.gateway,
      headers: {
        Authorization: `Bearer ${res.data.token}`,
      },
    });
    this.appAddress = (await this.api.get(`get-address/?id=${this.appId}`)).data.address;
    this.appAddress = this.appAddress.length === 40 ? '0x' + this.appAddress : this.appAddress;
  };

  myFiles = async () => {
    await this.setConvergence();
    const res = await this.api('api/list-files/');
    let data = [];
    if (res.data) data = res.data;
    return data;
  };

  sharedFiles = async () => {
    await this.setConvergence();
    const res = await this.api('api/shared-files/');
    let data = [];
    if (res.data) data = res.data;
    return data;
  };

  getContract = async () => {
    return this.arcana;
  };
}
export { utils };

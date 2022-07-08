<p align="center">
<a href="#start"><img height="30rem" src="https://raw.githubusercontent.com/arcana-network/branding/main/an_logo_light_temp.png"/></a>
<h2 align="center"> <a href="https://arcana.network/">Arcana Network Storage SDK </a></h2>
</p>
<br>
<p id="banner" align="center">
<br>
<a title="MIT License" href="https://github.com/arcana-network/license/blob/main/LICENSE.md"><img src="https://img.shields.io/badge/license-MIT-blue"/></a>
<a title="Beta release" href="https://github.com/arcana-network/storage/releases"><img src="https://img.shields.io/github/v/release/arcana-network/storage?style=flat-square&color=28A745"/></a>
<a title="Twitter" href="https://twitter.com/ArcanaNetwork"><img alt="Twitter URL" src="https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Ftwitter.com%2FArcanaNetwork"/></a>
</p><p id="start" align="center">
<a href="https://docs.dev.arcana.network/"><img src="https://raw.githubusercontent.com/arcana-network/branding/main/an_banner_temp.png" alt="Arcana Storage SDK"/></a>
</p>

# What is Storage SDK?

The Arcana Storage SDK enables you to configure dApp and allow users to store files in a region enabled by the application, share it with other users, revoke access or transfer file ownership to another user.

In the beta release, the storage nodes are operated by Arcana Networks. In the future, the storage subsystem will be fully decentralized and third party storage nodes can be plugged into the Arcana Network storage subsystem once they meet the Arcana storage QoS criteria.

# 💪 Key Features

<p>🗄️ &nbsp; Save dApp user data in Arcana data store</p>
<p>🧩 &nbsp; Encrypt / Decrypt File data and metadata</p>
<p>📂 &nbsp; Share data with other dApp users</p>
<p>🔒 &nbsp; Revoke access to shared data</p>
<p>🖼️ &nbsp; Change data ownership</p>
<p>📈 &nbsp; Track data accesses via public blockchain browsers</p>

# 🏗️ Installation

## npm

```shell
npm i @arcana/storage
```

## yarn

```shell
yarn add @arcana/storage
```

You can use the standalone module which includes the polyfills.

```html
<script src="./dist/standalone/storage.umd.js"></script>
```

```js
import { StorageProvider } from '@arcana/storage/dist/standalone/storage.umd';
```

# :computer: Development
## Build
```
npm run build
```

## Integration testing

Run an HTTP server from the storage SDK, and go to */integration-tests/*. Connect to metamask with arcana beta RPC (https://blockchain001-testnet.arcana.network/). Make sure that you are using the correct chain-Id (40405) and gateway URL (https://gateway001-testnet.arcana.network/) in the */integration-tets/test.js/* while initializing the storage instance.

One way to start the server is using,
```
http-server
```

# 📋 Prerequisites

Before you can start using the Arcana Storage SDK, you need to register your dApp using [Arcana Developer Dashboard](https://dashboard.arcana.network/).

A unique **AppId** will be assigned to your dApp and you need to provide this to Arcana Storage SDK in order to use the SDK functionality.

# 📚 Documentation

Check out [Arcana Network documentation](https://docs.dev.arcana.network/) for [Storage SDK Quick Start Guide](https://docs.dev.arcana.network/docs/stgsdk_qs), [Usage Guide](https://docs.dev.arcana.network/docs/stgsdk_usage) and [API reference Guide](https://docs.dev.arcana.network/docs/stg_ref).

Refer to the [sample app code](https://docs.dev.arcana.network/docs/demo-app) or the [How To Guides](https://docs.dev.arcana.network/docs/config_dapp) for performing specific tasks such as uploading/downloading a file, sharing file or revoking access to a file, and change file ownership.

# 💡 Support

For any support or integration related queries, contact [Arcana support team](mailto:support@arcana.network).

# 🤝 Contributing

We appreciate your feedback and contribution to Arcana Storage component. Open a GitHub issue and discuss your RFP with Arcana Network developers. We plan to come up with a detailed contributing guide soon. Stay tuned!

# ℹ️ License

Arcana Storage is distributed under the [MIT License](https://fossa.com/blog/open-source-licenses-101-mit-license/).

For details see [Arcana License](https://github.com/arcana-network/license/blob/main/LICENSE.md).

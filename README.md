# Uprtcl-Blockchain Watchman Microservice

It intends to index data off chain throught [js-uprtcl-server](https://github.com/uprtcl/js-uprtcl-server)

**Local Development**

To hack, test or try this microservice it is recommended to have a Web3 environment setup in your machine, which means to have the following services available and ready:

> ### Quick Start Option
> [Click here to quick start](https://github.com/sotous/js-uprtcl-dev/tree/eth-refactor#quick-start)

- [Web Server](https://github.com/sotous/js-uprtcl-server/tree/eth-refactor): Check it's README file, but you need to create an `.env` file and run dgraph with docker.

- [IPFS](https://ipfs.io/) Service: Make sure you have a running daemon on your computer or assign an already deployed peer as environment variable to **Linked Thoughts** and **Watchman**

- [Uprtcl Blockchain Network](https://github.com/uprtcl/eth-uprtcl) (Only run `npm i` and `npm run dev`)

- Create a `.env` file in the root folder with the content:

```
// Watchman server properties
PROTOCOL=http
PORT=3000
HOST=localhost
// IPFS peer network properties
IPFS_PROTOCOL=http
IPFS_HOST=127.0.0.1
IPFS_PORT=5002
// ETH test or production network
ETH_PROVIDER=http://192.168.1.19:8545
TARGET_EVENT=HeadUpdated
// Main uprtcl service
WEB_SERVER=http://localhost:3100/uprtcl/1
// Blockchain authentication
MNEMONIC= the mnemonic provided with the wallet

```

Install packages

```
npm i
```

- Run in debug mode.

```
npm run dev
```

Now the **Watchman** is listening and ready to index information.

To see it in action after setting up the Web3 environment you can run the consuming application [Linked Thoughts](https://github.com/sotous/linked-thoughts/tree/eth-refactor) which uses the libraries and connects to the ETH Test Network, IPFS and the Server.

```
cd linked-thoughts
touch src/services/env.ts
```

And fill it with the following content:

```ts
export const env = {
  // host: 'https://api.intercreativity.io/uprtcl/1',
  host: 'http://localhost:3100/uprtcl/1',
  ethers: {
    provider: 'http://localhost:8545', // Blockchain test network (web3)
  },
  ipfs: {
    // IPFS daemon
    protocol: 'http',
    host: '127.0.0.1',
    port: 5002,
  },
};
```

Then run the app in dev mode

```
cd linked-thoughts
npm run dev
```

Now open `localhost:8002` on your browser and you should see the application. Use Metamask as the login tool.

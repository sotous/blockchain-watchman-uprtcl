# Uprtcl-Blockchain Watchman Microservice

It intends to index data off chain throught [js-uprtcl-server](https://github.com/uprtcl/js-uprtcl-server)

**Local Development**

To hack, test or try this microservice it is recommended to have a Web3 environment setup in your machine.

- Create a `.env` file in the root folder with the content:

```
PROTOCOL=http
PORT=3000
HOST=localhost // Host to index the data (Web Service)
IPFS_PROTOCOL=http
IPFS_HOST=127.0.0.1
IPFS_PORT=5002
ETH_PROVIDER=http://192.168.1.19:8545
TARGET_EVENT=HeadUpdated
WEB_SERVER=http://localhost:3100/uprtcl/1
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

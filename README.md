# Microservice to index blockchain data off chain throught [js-uprtcl-server](https://github.com/uprtcl/js-uprtcl-server)

**Local Development**

Microservice aimed at monitoring blockchain data changes to create indexing between the ETH network and the Uprctl main web service.

- Create a `.env` file in the root folder with the content:

```
PROTOCOL=http
PORT=3000
HOST=localhost // Host to index the data (Web Service)
ETH_HOST=http://localhost
ETH_PORT=8545
MAIN_EVENT=HeadUpdated
CONTRACT_ADDRESS=0x0000001 // In this case it would be uprtcl contract address.
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

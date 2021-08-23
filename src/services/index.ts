import { EthersService } from '../ethereum/ethers.service';
import { HttpEthConnection, HttpEthTokenServer } from '@uprtcl/http-provider';
import { EveesHttp, HttpEntityRemote } from '@uprtcl/evees-http';
import {
  initEntityResolver,
  ClientRemote,
  RemoteExploreCachedOnMemory,
} from '@uprtcl/evees';
import { WatchmanRepository } from './watchman/watchman.repository';
import { WatchmanService } from './watchman/watchman.service';
import { EveesEthereumConnection } from '@uprtcl/evees-ethereum';
import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import { EveesBlockchain } from '@uprtcl/evees-blockchain';

export const getRoutes = async () => {
  // Create IPFS node to be able to retrieve hashes.
  const ipfsCidConfig: any = {
    version: 1,
    type: 'sha2-256',
    codec: 'raw',
    base: 'base58btc',
  };

  const ipfsStore = new IpfsStore(ipfsCidConfig, {
    protocol: process.env.IPFS_PROTOCOL || '',
    host: process.env.IPFS_HOST || '',
    port: parseInt(process.env.IPFS_PORT || '80'),
  });

  // We request microservice authentication against ETH
  const ethHttpConnection = new HttpEthConnection(
    process.env.WEB_SERVER || '',
    new HttpEthTokenServer(
      process.env.WEB_SERVER || '',
      process.env.MNEMONIC || ''
    )
  );

  await ethHttpConnection.login();

  // Then we attach the authenticated connection to the remote.
  const httpRemote = new HttpEntityRemote(ethHttpConnection);

  // Connects with blockchain.
  const ethConnection = new EthereumConnection({
    provider: process.env.ETH_PROVIDER || '',
  });

  const ethEveesConnection = new EveesEthereumConnection(ethConnection);
  await ethEveesConnection.ready();

  // Create an entityResolver.
  const ethEvees = new EveesBlockchain(
    ethEveesConnection,
    ipfsStore,
    new RemoteExploreCachedOnMemory(new EveesHttp(ethHttpConnection))
  );
  let clientRemotes: ClientRemote[] = [ethEvees];
  const entityResolver = initEntityResolver(clientRemotes);

  // We provide the remote.
  const watchmanRepo = new WatchmanRepository(httpRemote);
  const watchmanService = new WatchmanService(ipfs, watchmanRepo);

  const contract = ethEveesConnection.uprtclRoot.contractInstance;

  const ethService = new EthersService(
    contract,
    watchmanService,
    entityResolver
  );
  return [];
};

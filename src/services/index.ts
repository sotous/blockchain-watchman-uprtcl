import { EthersService } from '../ethereum/ethers.service';
import { HttpEthConnection, HttpEthTokenServer } from '@uprtcl/http-provider';
import { HttpEntityRemote } from '@uprtcl/evees-http';
import { WatchmanRepository } from './watchman/watchman.repository';
import { WatchmanService } from './watchman/watchman.service';
const IPFS = require('ipfs-core');

export const getRoutes = async () => {
  // Create IPFS node to be able to retrieve hashes.
  const ipfs = await IPFS.create();

  // We request microservice authentication against ETH
  const ethHttpConnection = new HttpEthConnection(
    process.env.WEB_SERVER || '',
    new HttpEthTokenServer(
      'http://localhost:3100/uprtcl/1',
      'announce room limb pattern dry unit scale effort smooth jazz weasel alcohol'
    )
  );

  await ethHttpConnection.login();

  // Then we attach the authenticated connection to the remote.
  const httpRemote = new HttpEntityRemote(ethHttpConnection);

  // We provide the remote.
  const watchmanRepo = new WatchmanRepository(httpRemote);
  const watchmanService = new WatchmanService(ipfs, watchmanRepo, httpRemote);

  const ethService = new EthersService(watchmanService, ipfs);
  return [];
};

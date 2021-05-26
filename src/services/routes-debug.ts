import { EthersService } from '../ethereum/ethers.service';
import { WatchmanRepository } from './watchman/watchman.repository';
import { WatchmanService } from './watchman/watchman.service';
import IPFS from 'ipfs';

export const getRoutes = async () => {
  // Create IPFS node to be able to retrieve hashes.
  const ipfs = await IPFS.create();

  const watchmanRepo = new WatchmanRepository();
  const watchmanService = new WatchmanService(ipfs, watchmanRepo);

  const ethService = new EthersService(watchmanService, ipfs);

  return [];
};

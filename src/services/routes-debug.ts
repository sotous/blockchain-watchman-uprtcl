import { EthersService } from '../ethereum/ethers.service';
import { WatchmanRepository } from './watchman/watchman.repository';
import { WatchmanService } from './watchman/watchman.service';
import { IpfsStore } from '@uprtcl/ipfs-provider';

// Connect to IPFS in order to have available a method to retrieve entities from a hash.
const ipfs = new IpfsStore();
const watchmanRepo = new WatchmanRepository();
const watchmanService = new WatchmanService(ipfs, watchmanRepo);

const ethService = new EthersService();

export const routes = [];

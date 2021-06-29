import { EthersService } from '../ethereum/ethers.service';
import { Auth0Connection } from '../middleware/authentication';
import { WatchmanRepository } from './watchman/watchman.repository';
import { WatchmanService } from './watchman/watchman.service';
const IPFS = require('ipfs-core');

export const getRoutes = async () => {
  // We request microservice authentication against Auth0
  const auth0 = new Auth0Connection(
    process.env.AUTH0_HOST as string,
    process.env.CLIENT_ID as string,
    process.env.CLIENT_SECRET as string,
    process.env.AUTH0_AUDIENCE as string,
    process.env.GRANT_TYPE as string
  );

  const jwtToken = await auth0.jwtToken;
  // Create IPFS node to be able to retrieve hashes.
  const ipfs = await IPFS.create();
  const watchmanRepo = new WatchmanRepository(jwtToken);
  const watchmanService = new WatchmanService(ipfs, watchmanRepo);

  const ethService = new EthersService(watchmanService, ipfs);

  return [];
};

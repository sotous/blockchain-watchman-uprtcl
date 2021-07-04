import { EthersService } from '../ethereum/ethers.service';
import { Auth0Connection } from '../middleware/authentication';
import { Auth0ClientOptions } from '@auth0/auth0-spa-js';
import { HttpAuth0Connection, HttpAuthentication } from '@uprtcl/http-provider';
import { HttpEntityRemote } from '@uprtcl/evees-http';
import { WatchmanRepository } from './watchman/watchman.repository';
import { WatchmanService } from './watchman/watchman.service';
const IPFS = require('ipfs-core');

export const getRoutes = async () => {
  // const auth0 = new Auth0Connection(
  //   process.env.AUTH0_HOST as string,
  //   process.env.CLIENT_ID as string,
  //   process.env.CLIENT_SECRET as string,
  //   process.env.AUTH0_AUDIENCE as string,
  //   process.env.GRANT_TYPE as string
  // );

  // // We request microservice authentication against Auth0
  // const jwtToken = await auth0.jwtToken;

  // Create IPFS node to be able to retrieve hashes.
  const ipfs = await IPFS.create();

  const auth0Config: Auth0ClientOptions = {
    domain: process.env.AUTH0_DOMAIN || '',
    client_id: process.env.CLIENT_ID || '',
    client_secret: process.env.CLIENT_SECRET,
    audience: process.env.AUTH0_AUDIENCE,
    grant_type: process.env.GRANT_TYPE,
  };

  // We request microservice authentication against Auth0
  const auth0HttpConnection = new HttpAuth0Connection(
    process.env.WEB_SERVER || '',
    auth0Config
  );

  const auth = new HttpAuthentication();
  // Then we attach the authenticated connection to the remote.
  const httpRemote = new HttpEntityRemote(auth0HttpConnection);

  // We provide the remote.
  const watchmanRepo = new WatchmanRepository(httpRemote);
  const watchmanService = new WatchmanService(ipfs, watchmanRepo);

  const ethService = new EthersService(watchmanService, ipfs);

  return [];
};

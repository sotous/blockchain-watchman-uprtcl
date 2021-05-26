import { EveesMutationCreate } from '@uprtcl/evees';
import {
  HttpMultiConnection,
  HttpAuth0Connection,
} from '@uprtcl/http-provider';
import { EveesHttp, HttpStore } from '@uprtcl/evees-http';
export class WatchmanRepository {
  constructor() {}

  async postNewUpdate(mutation: EveesMutationCreate): Promise<void> {
    console.log(mutation);
    console.log('Posting updates . . .');
    const httpConnection = await new HttpSupertest(
      process.env.HOST as string,
      user
    );

    const httpStore = new HttpStore(httpConnection, httpCidConfig);
    const httpEvees = new EveesHttp(httpConnection, httpStore.casID);
    // TODO: Prepare HttpStore to send data to server.
  }
}

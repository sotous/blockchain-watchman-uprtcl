import { EveesMutationCreate } from '@uprtcl/evees';
import { HttpEntityRemote } from '@uprtcl/evees-http';
export class WatchmanRepository {
  entityRemote: HttpEntityRemote;

  constructor(private httpEntityRemote: HttpEntityRemote) {
    this.entityRemote = httpEntityRemote;
  }

  async postNewUpdate(mutation: EveesMutationCreate): Promise<void> {
    console.log(mutation);
    if (mutation.entities) {
      await this.entityRemote.persistEntities(mutation.entities);
    }
    //this.httpEntityRemote.
    // const httpConnection = await new HttpSupertest(
    //   process.env.HOST as string,
    //   user
    // );
    // const httpStore = new HttpStore(httpConnection, httpCidConfig);
    // const httpEvees = new EveesHttp(httpConnection, httpStore.casID);
    // TODO: Prepare HttpStore to send data to server.
  }
}

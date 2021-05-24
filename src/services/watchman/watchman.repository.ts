import { EveesMutationCreate } from '@uprtcl/evees';
export class WatchmanRepository {
  constructor() {}

  async postNewUpdate(mutation: EveesMutationCreate): Promise<void> {
    console.log(mutation);
    console.log('Posting updates . . .');
    // TODO: Prepare HttpStore to send data to server.
  }
}

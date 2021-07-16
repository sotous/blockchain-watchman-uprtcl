import { EveesMutationCreate } from '@uprtcl/evees';
import { HttpEntityRemote } from '@uprtcl/evees-http';
export class WatchmanRepository {
  entityRemote: HttpEntityRemote;

  constructor(private httpEntityRemote: HttpEntityRemote) {
    this.entityRemote = httpEntityRemote;
  }

  async postNewUpdate(mutation: EveesMutationCreate): Promise<void> {
    await this.entityRemote.updateSu(mutation);
  }
}

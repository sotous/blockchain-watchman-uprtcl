import { EveesMutationCreate } from '@uprtcl/evees';
import { HttpEntityRemote } from '@uprtcl/evees-http';
export class WatchmanRepository {
  entityRemote: HttpEntityRemote;

  constructor(private httpEntityRemote: HttpEntityRemote) {
    this.entityRemote = httpEntityRemote;
  }

  async postNewUpdate(mutation: EveesMutationCreate): Promise<void> {
    console.log('[IPFS] - Success.');
    try {
      await this.entityRemote.updateSu(mutation);
      console.log('[Blockchain Microservice] - Content successfully mirrored.');
    } catch (err) {
      throw new Error(err as any);
    }
  }
}

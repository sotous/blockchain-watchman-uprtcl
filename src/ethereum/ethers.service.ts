import { HeadUpdatedEvent } from './HeadUpdated.event';
import { WatchmanService } from '../services/watchman/watchman.service';
import { EntityResolver } from '@uprtcl/evees';

require('dotenv').config();

export const HEAD_UPDATED = 'HeadUpdated';

export class EthersService {
  provider: any;

  constructor(
    private contract: any,
    private watchmanService: WatchmanService,
    private entityResolver: EntityResolver
  ) {
    this.contract = contract;
    this.provider = contract.provider;
    this.subscribeToEvent(HEAD_UPDATED);
  }

  async subscribeToEvent(eventName: string) {
    if (eventName === HEAD_UPDATED) {
      let filter = this.contract.filters.HeadUpdated();
      filter.fromBlock = this.provider
        .getBlockNumber()
        .then((b: number) => b - 10000);
      filter.toBlock = 'latest';
      // If HeadUpdated is the event chosen, then we instantiate the event.
      const headUpdated = new HeadUpdatedEvent(
        this.contract,
        eventName,
        this.provider,
        this.entityResolver,
        filter,
        this.watchmanService
      );
      await headUpdated.watch();
    }
  }
}

import { ethers } from 'ethers';
import { abi } from '../utils/UprtclRoot.min.json';
import { HeadUpdatedEvent } from './HeadUpdated.event';
import { WatchmanService } from '../services/watchman/watchman.service';

require('dotenv').config();

export const HEAD_UPDATED = 'HeadUpdated';

export class EthersService {
  provider: any;

  constructor(
    private contract: any,
    private watchmanService: WatchmanService,
    private ipfs: any
  ) {
    this.contract = contract;
    this.provider = contract.provider;
    this.subscribeToEvent(HEAD_UPDATED);
  }

  async subscribeToEvent(eventName: string) {
    if (eventName === 'HeadUpdated') {
      let filter = this.contract.filters.HeadUpdated();
      filter.fromBlock = this.provider
        .getBlockNumber()
        .then((b: any) => b - 10000);
      filter.toBlock = 'latest';
      // If HeadUpdated is the event chosen, then we instantiate the event.
      const headUpdated = new HeadUpdatedEvent(
        this.contract,
        eventName,
        this.provider,
        this.ipfs,
        filter,
        this.watchmanService
      );
      await headUpdated.watch();
    }
  }
}

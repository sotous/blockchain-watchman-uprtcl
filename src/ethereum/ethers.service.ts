import { ethers } from 'ethers';
import { abi } from '../utils/UprtclRoot.min.json';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import { HeadUpdatedEvent } from './HeadUpdated.event';
import { WatchmanService } from '../services/watchman/watchman.service';

require('dotenv').config();

export const HEAD_UPDATED = 'HeadUpdated';

export class EthersService {
  connectionReady: Promise<any>;
  contract: any;
  provider: any;
  event: any;
  blockNotification: any;

  constructor(
    private watchmanService: WatchmanService,
    private ipfs: IpfsStore
  ) {
    console.log('HEY');
    this.connectionReady = new Promise<void>(async (resolve) => {
      await this.connect();
      resolve();
    });
  }

  async connect() {
    this.provider = new ethers.providers.JsonRpcProvider(
      `${process.env.ETH_HOST}:${process.env.ETH_PORT}`
    );

    try {
      const network = await this.provider.getNetwork();
      console.log(
        `[EthNetwork] Connection established ${process.env.ETH_HOST}:${process.env.ETH_PORT}`
      );
      console.log(network);
    } catch (e) {
      throw new Error(`Can't connect to ETH network. ${e}`);
    }

    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS || '',
      abi,
      this.provider
    );

    this.contract = contract;
    // We subscribe to the main event.
    await this.subscribeToEvent(process.env.MAIN_EVENT || '');
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

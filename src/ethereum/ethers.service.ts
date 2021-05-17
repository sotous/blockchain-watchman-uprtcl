import { ethers } from 'ethers';
import { abi } from '../utils/UprtclRoot.min.json';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import { HeadUpdatedEvent } from './HeadUpdated.event';

require('dotenv').config();

export const HEAD_UPDATED = 'HeadUpdated';

export class EthersService {
  connectionReady: Promise<any>;
  contract: any;
  provider: any;
  event: any;
  ipfs: any;
  blockNotification: any;

  constructor() {
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

    // Connect to IPFS in order to have available a method to retrieve entities from a hash.
    this.ipfs = new IpfsStore();
    await this.ipfs.connect();

    this.contract = contract;
    // We subscribe to the main event.
    await this.subscribeToEvent(process.env.MAIN_EVENT || '');
  }

  async subscribeToEvent(eventName: string) {
    if (eventName === 'HeadUpdated') {
      // If HeadUpdated is the event chosen, then we instantiate the event.
      const headUpdated = new HeadUpdatedEvent(
        this.contract,
        eventName,
        this.provider,
        this.ipfs
      );

      await headUpdated.watch();
    }
  }

  ready(): Promise<void> {
    return this.connectionReady;
  }
}

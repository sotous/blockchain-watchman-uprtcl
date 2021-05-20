import { ethers } from 'ethers';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import { abi } from '../utils/UprtclRoot.min.json';
import { WatchmanController } from '../services/watchman/watchman.controller';
import { WatchmanService } from '../services/watchman/watchman.service';
import { bytes32ToCid } from '@uprtcl/evees';

export const NEW_INTERACTION = 'new_interaction';
export interface HeadUpdateData {
  id: string;
  object: [
    {
      perspectiveId: string;
      canUpdate: boolean;
      guardianId?: string;
      headId: string;
    }
  ];
}

export class HeadUpdatedEvent {
  blockNotification: any;
  watchmanService: WatchmanService;

  constructor(
    private contract: any,
    private eventName: string,
    private provider: ethers.providers.JsonRpcProvider,
    private ipfs: IpfsStore,
    private filter: any
  ) {
    this.watchmanService = new WatchmanService();
    this.blockNotification = new WatchmanController(this.watchmanService);
  }

  public async watch() {
    this.contract.on(
      this.eventName,
      async (author: any, val0: any, val1: any, event: any) => {
        /**
         * We retrieve the new incoming data from the event
         * and the inmediate previous data too on this event.
         */

        // Filter logs by user.
        this.filter.from = author;

        const data = await this.getCurrentAndPreviousData(
          val0,
          val1,
          this.provider,
          this.ipfs
        );

        // If the hash is different, changes might be present.
        if (data.previous && data.event.id !== data.previous.id) {
          this.blockNotification.emit(NEW_INTERACTION, data);
        }
      }
    );
  }

  // Some code extracted from: https://medium.com/linum-labs/everything-you-ever-wanted-to-know-about-events-and-logs-on-ethereum-fec84ea7d0a5
  async getCurrentAndPreviousData(
    val0: string,
    val1: string,
    provider: ethers.providers.JsonRpcProvider,
    ipfs: IpfsStore // Used to retrieve entities from a hash.
  ) {
    // Called when there is an update
    // We convert the val0 and val1 into the perspective hash.
    const newHash = bytes32ToCid([val0, val1]);
    const eventData = await ipfs.get(newHash);

    try {
      const logs = await provider.getLogs(this.filter);
      const previousEvent = logs[logs.length - 2];

      // this will return an array with an object for each event
      const events = abi.filter((obj) =>
        obj.type ? obj.type === 'event' : false
      );
      // getting the specified event, then pulling it out of the array
      const event = events.filter(
        (event) => event.name === process.env.MAIN_EVENT
      )[0];

      // Knowing which types are indexed will be useful later
      let indexedInputs: any = [];
      let unindexedInputs: any = [];
      event.inputs.forEach((input: any) => {
        input.indexed ? indexedInputs.push(input) : unindexedInputs.push(input);
      });

      // If a previous event is present.
      if (previousEvent) {
        // Need to decode the topics and events
        const decoder = new ethers.utils.AbiCoder();
        const decodedDataRaw = decoder.decode(
          unindexedInputs,
          previousEvent.data
        );

        const oldHash = bytes32ToCid([
          decodedDataRaw.val1,
          decodedDataRaw.val0,
        ]);

        const previousData = await ipfs.get(oldHash);

        return {
          event: eventData,
          previous: previousData,
        };
      }

      return {
        event: eventData,
      };
    } catch (e) {
      throw new Error(`Could not get logs data from event. ${e}`);
    }
  }
}

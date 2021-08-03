import { ethers } from 'ethers';
import { abi } from '../utils/UprtclRoot.min.json';
import { WatchmanController } from '../services/watchman/watchman.controller';
import { WatchmanService } from '../services/watchman/watchman.service';
import { bytes32ToCid } from '@uprtcl/evees';
import { ChainEvents, ChainUpdate } from '@uprtcl/evees-blockchain';
import { NEW_INTERACTION } from '../middleware/common';
import { EntityResolver } from '@uprtcl/evees';

export class HeadUpdatedEvent {
  blockNotification: WatchmanController;

  constructor(
    private contract: any,
    private eventName: string,
    private provider: ethers.providers.JsonRpcProvider,
    private entityResolver: EntityResolver,
    private filter: any,
    private watchmanService: WatchmanService
  ) {
    this.blockNotification = new WatchmanController(this.watchmanService);
  }

  public async watch() {
    this.contract.on(
      this.eventName,
      async (author: string, val0: string, val1: string, event: any) => {
        /**
         * We retrieve the new incoming data from the event
         * and the inmediate previous data too on this event.
         */

        console.log('[Blockchain Microservice] - Interaction detected.');

        // Filter logs by user.
        this.filter.from = author;

        const data = await this.getCurrentAndPreviousData(val0, val1);

        this.blockNotification.emit(NEW_INTERACTION, data);
      }
    );
  }

  // Some code extracted from: https://medium.com/linum-labs/everything-you-ever-wanted-to-know-about-events-and-logs-on-ethereum-fec84ea7d0a5
  async getCurrentAndPreviousData(
    val0: string,
    val1: string
  ): Promise<ChainEvents> {
    // Called when there is an update
    // We convert the val0 and val1 into the perspective hash.
    const newHash = bytes32ToCid([val0, val1]);
    let eventData = await this.entityResolver.getEntity<ChainUpdate>(newHash);

    try {
      const logs = await this.provider.getLogs(this.filter);
      const previousEvent = logs[logs.length - 2];

      // this will return an array with an object for each event
      const events = abi.filter((obj) =>
        obj.type ? obj.type === 'event' : false
      );
      // getting the specified event, then pulling it out of the array
      const event = events.filter(
        (event) => event.name === process.env.TARGET_EVENT
      )[0];

      // Knowing which types are indexed will be useful later
      let indexedInputs: string[] = [];
      let unindexedInputs: string[] = [];
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

        let previousData = await this.entityResolver.getEntity<ChainUpdate>(
          oldHash
        );
        return {
          current: Object.keys(eventData.object).map(
            (update) => eventData.object[update]
          ),
          previous: Object.keys(previousData.object).map(
            (update) => previousData.object[update]
          ),
        };
      }

      return {
        current: Object.keys(eventData.object).map(
          (update) => eventData.object[update]
        ),
      };
    } catch (e) {
      throw new Error(`Could not get logs data from event. ${e}`);
    }
  }
}

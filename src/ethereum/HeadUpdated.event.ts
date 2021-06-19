import { ethers } from 'ethers';
import { abi } from '../utils/UprtclRoot.min.json';
import { WatchmanController } from '../services/watchman/watchman.controller';
import { WatchmanService } from '../services/watchman/watchman.service';
import { bytes32ToCid, LinkChanges } from '@uprtcl/evees';
import CBOR from 'cbor';
import CID from 'cids';

export const NEW_INTERACTION = 'new_interaction';
export interface HeadUpdateData {
  id: string;
  object: UpdateContent[];
}

export interface UpdateContent {
  perspectiveId: string;
  canUpdate: boolean;
  guardianId?: string;
  headId: string;
  linkChanges?: LinkChanges;
  text?: string;
}

export interface HeadMutation {
  changes?: UpdateContent[];
  added?: UpdateContent[];
  removed?: UpdateContent[];
}

export const getContentFromHash = async (
  hash: string,
  ipfs: any
): Promise<any> => {
  const cid = new CID(hash);
  console.log('[IPFS] Retrieving content from hash => ', hash);
  const raw = await ipfs.dag.get(cid);
  const forceBuffer = Uint8Array.from(raw.value);
  console.log('[IPFS] Success retrieving hash content for ', hash);
  return CBOR.decode(forceBuffer.buffer);
};

export class HeadUpdatedEvent {
  blockNotification: any;

  constructor(
    private contract: any,
    private eventName: string,
    private provider: ethers.providers.JsonRpcProvider,
    private ipfs: any,
    private filter: any,
    private watchmanService: WatchmanService
  ) {
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

        console.log('[Blockchain Microservice] - Interaction detected.');

        // Filter logs by user.
        this.filter.from = author;

        const data = await this.getCurrentAndPreviousData(
          val0,
          val1,
          this.provider,
          this.ipfs
        );

        this.blockNotification.emit(NEW_INTERACTION, data);
      }
    );
  }

  // Some code extracted from: https://medium.com/linum-labs/everything-you-ever-wanted-to-know-about-events-and-logs-on-ethereum-fec84ea7d0a5
  async getCurrentAndPreviousData(
    val0: string,
    val1: string,
    provider: ethers.providers.JsonRpcProvider,
    ipfs: any // Used to retrieve entities from a hash.
  ) {
    // Called when there is an update
    // We convert the val0 and val1 into the perspective hash.
    const newHash = bytes32ToCid([val0, val1]);
    let eventData = await getContentFromHash(newHash, ipfs);

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

        let previousData = await getContentFromHash(oldHash, ipfs);

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

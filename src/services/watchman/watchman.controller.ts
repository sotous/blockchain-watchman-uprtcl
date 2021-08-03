import { WatchmanService } from './watchman.service';
import { ChainEvents } from '@uprtcl/evees-blockchain';
import { NEW_INTERACTION } from '../../middleware/common';
const EventEmitter = require('events');

export class WatchmanController extends EventEmitter {
  constructor(protected watchmanService: WatchmanService) {
    super();
    this.on(NEW_INTERACTION, async (data: ChainEvents) => {
      await this.watchmanService.postNewUpdate(data);
    });
  }
}

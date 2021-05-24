import { WatchmanService } from './watchman.service';
import { NEW_INTERACTION } from '../../ethereum/HeadUpdated.event';
const EventEmitter = require('events');

export class WatchmanController extends EventEmitter {
  constructor(protected watchmanService: WatchmanService) {
    super();
    this.on(NEW_INTERACTION, async (data: any) => {
      console.log('[Blockchain Microservice] - Interaction detected.');
      await this.watchmanService.postNewUpdate(data);
    });
  }
}

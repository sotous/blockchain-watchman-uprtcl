import { WatchmanService } from './watchman.service';
import { NEW_INTERACTION } from '../../ethereum/HeadUpdated.event';
const EventEmitter = require('events');

export class WatchmanController extends EventEmitter {
  constructor(protected watcherService: WatchmanService) {
    super();
    this.on(NEW_INTERACTION, (data: any) => {
      // TODO: call watchman service
    });
  }
}

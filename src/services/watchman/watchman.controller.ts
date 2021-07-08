import { WatchmanService } from './watchman.service';
import { NEW_INTERACTION } from '../../utils/types';
const EventEmitter = require('events');

export class WatchmanController extends EventEmitter {
  constructor(protected watchmanService: WatchmanService) {
    super();
    this.on(NEW_INTERACTION, async (data: any) => {
      await this.watchmanService.postNewUpdate(data);
    });
  }
}

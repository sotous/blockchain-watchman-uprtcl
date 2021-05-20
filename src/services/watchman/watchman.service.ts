import { HeadUpdateData } from '../../ethereum/HeadUpdated.event';

export class WatchmanService {
  async postNewUpdate(blockchainData: any): Promise<void> {
    if (!this.isHeadUpdatedEvent(blockchainData)) {
      throw new Error('Not a head updated event');
    }

    const previous = this.translateBlockToEventData(blockchainData.previous);
    const event = this.translateBlockToEventData(blockchainData.event);
    let updates;

    if (previous) {
      // find the difference between the two given events.
      updates = this.getLogsDifference(previous, event);
    }

    // TODO: build mutation with only event without previous.
    // TODO: build mutation from difference.

    // TODO: collect all hashes

    // TODO: Translate hashes

    // TODO: Post data. Communicate with server.
  }

  async collectAllHashes() {}

  async buildEveesMutation() {}

  getLogsDifference(previous: HeadUpdateData, event: HeadUpdateData) {
    let changes: any = [];
    let added: any = [];
    let removed: any = [];

    // First sort both arrays by perspectiveId.
    const previousChanges = previous.object;
    const latest = event.object;
    previousChanges.sort((a, b) =>
      a.perspectiveId > b.perspectiveId ? 1 : -1
    );
    latest.sort((a, b) => (a.perspectiveId > b.perspectiveId ? 1 : -1));

    // Detect added or removed perspectives.
    if (previousChanges.length !== latest.length) {
      added = latest.filter(this.comparer(previousChanges));
      removed = previousChanges.filter(this.comparer(latest));
    }

    // Gets modifications to persistent information.
    previousChanges.map((persp) => {
      latest.map((el) => {
        if (persp.perspectiveId === el.perspectiveId) {
          const canUpdate =
            persp.canUpdate !== el.canUpdate ? el.canUpdate : undefined;
          const headId = persp.headId !== el.headId ? el.headId : undefined;
          const guardianId =
            persp.guardianId !== el.guardianId ? el.guardianId : undefined;

          if (!(!canUpdate && !headId && !guardianId)) {
            changes.push(el);
          }
        }
      });
    });

    return {
      changes,
      added,
      removed,
    };
  }

  comparer(otherArray: any) {
    return (current: any) => {
      return (
        otherArray.filter((other: any) => {
          return other.perspectiveId == current.perspectiveId;
        }).length == 0
      );
    };
  }

  isHeadUpdatedEvent(blockchainData: any): boolean {
    return blockchainData.event.id && blockchainData.event.object;
  }

  translateBlockToEventData(eventData: any): HeadUpdateData {
    // Initialize event data
    let data: HeadUpdateData = {
      id: eventData.id,
      object: [
        {
          perspectiveId: '',
          canUpdate: false,
          headId: '',
        },
      ],
    };

    Object.keys(eventData.object).forEach((key) => {
      data.object.push({
        perspectiveId: key,
        canUpdate: eventData.object[key].canUpdate,
        guardianId: eventData.object[key].guardianId,
        headId: eventData.object[key].headId,
      });
    });

    // We remove the first element used as a placeholder.
    data.object.splice(0, 1);
    return data;
  }
}

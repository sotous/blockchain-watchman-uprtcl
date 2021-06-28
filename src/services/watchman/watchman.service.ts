import { UpdateContent, HeadMutation } from '../../ethereum/HeadUpdated.event';
import {
  EveesMutationCreate,
  Entity,
  NewPerspective,
  Update,
} from '@uprtcl/evees';
import { WatchmanRepository } from './watchman.repository';
import { getContentFromHash } from '../../ethereum/HeadUpdated.event';

export class WatchmanService {
  constructor(private ipfs: any, private watchmanRepo: WatchmanRepository) {}
  async postNewUpdate(blockchainData: any): Promise<void> {
    const previous = blockchainData.previous
      ? this.translateBlockToEventData(blockchainData.previous)
      : undefined;
    const event = this.translateBlockToEventData(blockchainData.event);
    let update;

    // Look for any previous event to current.
    if (!previous) {
      const headMutation: HeadMutation = {
        added: event,
      };
      update = headMutation;
    } else {
      // find the difference between the two given events.
      update = this.getLogsDifference(previous, event);
    }

    const eveesMutation = await this.buildEveesMutation(update);
    if (eveesMutation) {
      await this.watchmanRepo.postNewUpdate(eveesMutation);
    }
  }

  async buildEveesMutation(
    data: HeadMutation
  ): Promise<EveesMutationCreate | undefined> {
    let mutationEntities: Entity[] = [];

    let updates: Update[] = [];
    let newPerspectives: NewPerspective[] = [];

    const added = data.added;
    const changes = data.changes;

    if (changes) {
      // For change elements return updates.
      updates = await Promise.all(
        changes.map(async (persp) => {
          const perspective = await getContentFromHash(
            persp.perspectiveId,
            this.ipfs
          );

          const head = await getContentFromHash(persp.headId, this.ipfs);
          const data = await getContentFromHash(head.payload.dataId, this.ipfs);

          mutationEntities.push(perspective, head, data);

          return {
            perspectiveId: persp.perspectiveId,
            details: {
              headId: persp.headId,
              guardianId: persp.guardianId,
              canUpdate: persp.canUpdate,
            },
            indexData: {
              linkChanges: persp.linkChanges,
              text: persp.text,
            },
          };
        })
      );
    }

    if (added) {
      // For change elements return updates.
      newPerspectives = await Promise.all(
        added.map(async (persp) => {
          const perspective = await getContentFromHash(
            persp.perspectiveId,
            this.ipfs
          );
          const head = await getContentFromHash(persp.headId, this.ipfs);
          const data = await getContentFromHash(head.payload.dataId, this.ipfs);

          mutationEntities.push(perspective, head, data);

          return {
            perspective: perspective,
            update: {
              perspectiveId: persp.perspectiveId,
              details: {
                headId: persp.headId,
                guardianId: persp.guardianId,
                canUpdate: persp.canUpdate,
              },
              indexData: {
                linkChanges: persp.linkChanges,
                text: persp.text,
              },
            },
          };
        })
      );
    }

    // Collect IDs from delete perspectives
    const deletedPerspectives = (data as HeadMutation).removed?.map(
      (persp) => persp.perspectiveId
    );

    return {
      newPerspectives,
      updates,
      deletedPerspectives,
      entities: mutationEntities,
    };
  }

  getLogsDifference(
    previous: UpdateContent[],
    event: UpdateContent[]
  ): HeadMutation {
    let changes: any = [];
    let added: any = [];
    let removed: any = [];

    // First sort both arrays by perspectiveId.
    const previousChanges = previous;
    const latest = event;
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
          const linkChanges =
            persp.linkChanges !== el.linkChanges ? el.linkChanges : undefined;
          const text = persp.text !== persp.text ? el.text : undefined;

          if (
            !(!canUpdate && !headId && !guardianId && !linkChanges && !text)
          ) {
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

  translateBlockToEventData(eventData: any): UpdateContent[] {
    // Initialize event data
    let data: UpdateContent[] = [];

    Object.keys(eventData).forEach((key) => {
      data.push({
        perspectiveId: key,
        canUpdate: eventData[key].canUpdate,
        guardianId: eventData[key].guardianId,
        headId: eventData[key].headId,
        linkChanges: eventData[key].linkChanges,
        text: eventData[key].text,
      });
    });
    return data;
  }
}

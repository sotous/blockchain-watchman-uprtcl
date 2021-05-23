import { HeadUpdateData, HeadMutation } from '../../ethereum/HeadUpdated.event';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import {
  EveesMutationCreate,
  EntityCreate,
  NewPerspective,
  Update,
} from '@uprtcl/evees';
import { WatchmanRepository } from './watchman.repository';

export class WatchmanService {
  constructor(
    private ipfs: IpfsStore,
    private watchmanRepo: WatchmanRepository
  ) {}
  async postNewUpdate(blockchainData: any): Promise<void> {
    if (!this.isHeadUpdatedEvent(blockchainData)) {
      throw new Error('Not a head updated event');
    }
    const previous = this.translateBlockToEventData(blockchainData.previous);
    const event = this.translateBlockToEventData(blockchainData.event);
    let updates;

    // Look for any previous event to current.
    if (!previous) {
      const eveesMutation = this.buildEveesMutation(event);
      console.log(eveesMutation);
      // Send to server.
    }

    // find the difference between the two given events.
    updates = this.getLogsDifference(previous, event);
    const eveesMutation = await this.buildEveesMutation(updates);
    console.log(eveesMutation);
    return;
  }

  async buildEveesMutation(
    data: HeadUpdateData | HeadMutation
  ): Promise<EveesMutationCreate | undefined> {
    const create = (data as HeadUpdateData).object;
    const mutation = (data as HeadMutation).changes;
    let mutationEntities: EntityCreate[] = [];

    let updates: Update[] = [];
    let newPerspectives: NewPerspective[] = [];

    if (create) {
      // Since this is create, return newPerspectives
      newPerspectives = await Promise.all(
        create.map(async (persp) => {
          const perspective = await this.ipfs.get(persp.perspectiveId);
          const head = await this.ipfs.get(persp.headId);
          const data = await this.ipfs.get(head.object.payload.dataId);

          mutationEntities.push(perspective, head, data);

          return {
            perspective: perspective,
            update: {
              perspectiveId: perspective.id,
              details: {
                headId: head.id,
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

      return {
        newPerspectives,
        updates,
        entities: mutationEntities,
      };
    }

    if (mutation) {
      const added = (data as HeadMutation).added;

      // For change elements return updates.
      updates = await Promise.all(
        mutation.map(async (persp) => {
          const perspective = await this.ipfs.get(persp.perspectiveId);
          const head = await this.ipfs.get(persp.headId);
          const data = await this.ipfs.get(head.object.payload.dataId);

          mutationEntities.push(perspective, head, data);

          return {
            perspectiveId: perspective.id,
            details: {
              headId: head.id,
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

      // If add return update and newPerspectives
      // For change elements return updates.

      if (added) {
        newPerspectives = await Promise.all(
          added.map(async (persp) => {
            const perspective = await this.ipfs.get(persp.perspectiveId);
            const head = await this.ipfs.get(persp.headId);
            const data = await this.ipfs.get(head.object.payload.dataId);

            mutationEntities.push(perspective, head, data);

            return {
              perspective: perspective,
              update: {
                perspectiveId: perspective.id,
                details: {
                  headId: head.id,
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
  }

  getLogsDifference(
    previous: HeadUpdateData,
    event: HeadUpdateData
  ): HeadMutation {
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
        linkChanges: eventData.object[key].linkChanges,
        text: eventData.object[key].text,
      });
    });

    // We remove the first element used as a placeholder.
    data.object.splice(0, 1);
    return data;
  }
}

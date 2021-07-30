import {
  BlockchainMutation,
  EveeEntity,
  BlockchainEvents,
} from '../../utils/types';
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

  async postNewUpdate(blockchainEvents: BlockchainEvents): Promise<void> {
    let update;
    const { current, previous } = blockchainEvents;

    // Look for any previous event to current.
    if (!previous) {
      const headMutation: BlockchainMutation = {
        added: current,
      };
      update = headMutation;
    } else {
      // find the difference between the two given events.
      update = this.getLogsDifference(previous, current);
    }

    const eveesMutation = await this.buildEveesMutation(update);
    if (eveesMutation) {
      await this.watchmanRepo.postNewUpdate(eveesMutation);
    }
  }

  async buildEveesMutation(
    data: BlockchainMutation
  ): Promise<EveesMutationCreate | undefined> {
    let mutationEntities: Entity[] = [];

    let newPerspectives: NewPerspective[] = [];

    const added = data.added || [];
    const changes = data.changes || [];

    // For change elements return updates.
    await Promise.all(
      changes.map(async (update: Update) => {
        const { perspective, head, data } = await this.unpackAndBuildEntities(
          update
        );
        mutationEntities.push(perspective, head, data);
      })
    );

    // For change elements return updates.
    newPerspectives = await Promise.all(
      added.map(async (update: Update) => {
        const { perspective, head, data } = await this.unpackAndBuildEntities(
          update
        );

        // Checks for duplicated data.
        const dataIndex = mutationEntities
          .map((mutation) => {
            return mutation.hash;
          })
          .indexOf(data.hash);

        mutationEntities.push(perspective, head);

        if (dataIndex < 0) {
          mutationEntities.push(data);
        }

        return {
          perspective: perspective,
          update,
        };
      })
    );

    // Collect IDs from delete perspectives
    const deletedPerspectives = (data as BlockchainMutation).removed?.map(
      (update: Update) => update.perspectiveId
    );

    return {
      newPerspectives,
      updates: data.changes,
      deletedPerspectives,
      entities: mutationEntities,
    };
  }

  async unpackAndBuildEntities(update: Update): Promise<EveeEntity> {
    const perspectiveObject = await getContentFromHash(
      update.perspectiveId,
      this.ipfs
    );

    const headObject = await getContentFromHash(
      update.details.headId || '',
      this.ipfs
    );

    const dataObject = await getContentFromHash(
      headObject.payload.dataId,
      this.ipfs
    );

    return {
      perspective: {
        hash: update.perspectiveId,
        object: perspectiveObject,
        remote: perspectiveObject.payload.remote,
      },
      head: {
        hash: update.details.headId || '',
        object: headObject,
        remote: perspectiveObject.payload.remote,
      },
      data: {
        hash: headObject.payload.dataId,
        object: dataObject,
        remote: perspectiveObject.payload.remote,
      },
    };
  }

  getLogsDifference(previous: Update[], event: Update[]): BlockchainMutation {
    let changes: Update[] = [];
    let added: Update[] = [];
    let removed: Update[] = [];

    // First sort both arrays by its key (perspectiveId).
    const previousChanges = previous;
    const latest = event;
    previousChanges.sort((a, b) =>
      a.perspectiveId > b.perspectiveId ? 1 : -1
    );
    latest.sort((a, b) => (a.perspectiveId > b.perspectiveId ? 1 : -1));

    // Detect added or removed perspectives.
    if (previousChanges.length !== latest.length) {
      added = latest.filter(this.updatesComparer(previousChanges));
      removed = previousChanges.filter(this.updatesComparer(latest));
    }

    // Gets modifications to persistent information.
    previousChanges.map((previous) => {
      latest.map((current) => {
        if (previous.perspectiveId === current.perspectiveId) {
          const canUpdate =
            previous.details.canUpdate !== current.details.canUpdate
              ? current.details.canUpdate
              : undefined;
          const headId =
            previous.details.headId !== current.details.headId
              ? current.details.headId
              : undefined;
          const guardianId =
            previous.details.guardianId !== current.details.guardianId
              ? current.details.guardianId
              : undefined;
          const linkChanges =
            previous.indexData?.linkChanges !== current.indexData?.linkChanges
              ? current.indexData?.linkChanges
              : undefined;
          const text =
            previous.indexData?.text !== previous.indexData?.text
              ? current.indexData?.text
              : undefined;

          if (
            !(!canUpdate && !headId && !guardianId && !linkChanges && !text)
          ) {
            changes.push(current);
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

  updatesComparer(otherUpdate: Update[]) {
    return (current: Update) => {
      return (
        otherUpdate.filter((other: Update) => {
          return other.perspectiveId == current.perspectiveId;
        }).length == 0
      );
    };
  }
}

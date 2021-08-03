import {
  ChainMutation,
  EveeEntity,
  ChainEvents,
} from '@uprtcl/evees-blockchain';
import {
  EveesMutationCreate,
  Entity,
  NewPerspective,
  Perspective,
  Update,
  Secured,
  Commit,
} from '@uprtcl/evees';
import { WatchmanRepository } from './watchman.repository';
import { EntityResolver } from '@uprtcl/evees';
export class WatchmanService {
  constructor(
    private entityResolver: EntityResolver,
    private watchmanRepo: WatchmanRepository
  ) {}

  async postNewUpdate(blockchainEvents: ChainEvents): Promise<void> {
    let update;
    const { current, previous } = blockchainEvents;

    // Look for any previous event to current.
    if (!previous) {
      const headMutation: ChainMutation = {
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
    data: ChainMutation
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
    const deletedPerspectives = (data as ChainMutation).removed?.map(
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
    const perspective = await this.entityResolver.getEntity<
      Secured<Perspective>
    >(update.perspectiveId);
    const head = await this.entityResolver.getEntity<any>(
      update.details.headId || ''
    );
    const data = await this.entityResolver.getEntity<Object>(
      head.object.payload.dataId
    );

    return {
      perspective,
      head,
      data,
    };
  }

  getLogsDifference(previous: Update[], event: Update[]): ChainMutation {
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

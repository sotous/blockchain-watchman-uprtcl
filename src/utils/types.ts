export const NEW_INTERACTION = 'new_interaction';
import { LinkChanges, Entity } from '@uprtcl/evees';

export interface EveeEntity {
  perspective: Entity;
  head: Entity;
  data: Entity;
}
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

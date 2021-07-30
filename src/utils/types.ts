export const NEW_INTERACTION = 'new_interaction';
import { Entity, Update } from '@uprtcl/evees';

export interface EveeEntity {
  perspective: Entity;
  head: Entity;
  data: Entity;
}

export interface BlockchainMutation {
  changes?: Update[];
  added?: Update[];
  removed?: Update[];
}

export interface BlockchainEvents {
  current: Update[];
  previous?: Update[];
}

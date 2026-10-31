import type { CutItem } from '../schemas/index.js';

export type CutScheduleItem = CutItem;

export type SimulatorTier =
  | 'ordinary'
  | 'promising'
  | 'expert_review'
  | 'Ordinary verge'
  | 'Promising verge'
  | 'Refer for expert review'
  | 'unknown';

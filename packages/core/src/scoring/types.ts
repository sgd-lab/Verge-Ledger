import type {
  CutState,
  CuttingsState,
  ForbCountBand,
  IndicatorSpecies,
  ScoreResult,
  SwardStructure,
} from '../schemas/index.js';

export interface IndicatorRecordInput {
  id: string;
  weight?: number;
  group?: string;
  sensitive?: boolean;
}

export interface ScoreObservationInput {
  forbCountBand: ForbCountBand;
  indicatorIds?: string[];
  nutrientDominantIds?: string[];
  indicators?: (IndicatorSpecies | IndicatorRecordInput)[];
  nutrientDominants?: (IndicatorSpecies | IndicatorRecordInput)[];
  indicatorWeightsSum?: number;
  hasOrchid?: boolean;
  nutrientDominantCount?: number;
  swardStructure: SwardStructure;
  cutState: CutState;
  cuttingsState: CuttingsState;
  lastCutMonth?: number | null;
}

export interface ScoreExplanation {
  contributors: string[];
  penalties: string[];
  suggestions: string[];
  disclaimer: string;
}

export type { ScoreResult };

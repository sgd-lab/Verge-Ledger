import type { RoadClass, Setting, WidthBand, Side } from '../schemas/segment.js';
import type { ScoreConfidence } from '../schemas/observation.js';

export interface ExportOptions {
  /** Coarsen coordinates of segments with sensitive species to 1 km. Default: true */
  coarsenSensitive?: boolean;
  /** Decimal places for coarsened coordinates. Default: 2 */
  coarseningPrecision?: number;
  /** Include demo segments (marked isDemo). Default: false */
  includeDemo?: boolean;
}

export interface VergeExportProperties {
  segmentId: string;
  workspaceId: string;
  roadName: string | null;
  roadClass: RoadClass;
  setting: Setting;
  widthBand: WidthBand;
  side: Side;
  lengthM: number;
  observedAt: string | null;
  forbCountBand: string | null;
  triageScore: number | null;
  tier: string | null;
  confidence: ScoreConfidence | null;
  managementFlags: string[];
  indicatorSpecies: string[];
  nutrientDominants: string[];
  hasSensitiveTaxa: boolean;
  isCoarsened: boolean;
  swardStructure: string | null;
  cutState: string | null;
  cuttingsState: string | null;
  lastCutMonth: number | null;
  notes: string | null;
  isDemo: boolean;
  scoringVersion: string;
  disclaimer: string;
}

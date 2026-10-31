import type { RoadClass, Setting, WidthBand } from '../schemas/index.js';

export type VergeTierInput =
  | 'ordinary'
  | 'promising'
  | 'expert_review'
  | 'Ordinary verge'
  | 'Promising verge'
  | 'Refer for expert review'
  | 'unknown';

export type CuttingsRemovableInput = 'yes' | 'no' | 'unknown';
export type SafetyConstraintInput = 'none' | 'junction_or_bend' | 'visibility_splay_present';

export interface AdvisorInput {
  setting: Setting;
  roadClass: RoadClass;
  widthBand: WidthBand;
  tier: VergeTierInput;
  cuttingsRemovable: CuttingsRemovableInput;
  safetyConstraint?: SafetyConstraintInput;
  cutsPossiblePerYear?: number;
}

export interface RegimeRecommendation {
  regimeId: 'R1' | 'RA' | 'RB' | 'RU';
  name: string;
  cuttingMonths: number[];
  monthsDescription: string;
  cuttingsHandling: string;
  rationale: string;
  note?: string;
  sourceCitations: string[];
}

export interface SafetyOverlay {
  swatheWidthMeters: number;
  description: string;
  junctionsAndBendsNote: string;
  mandatoryRule: string;
}

export interface RefugeGuidance {
  refugePercentage: string;
  description: string;
  placement: string;
  rotationSchedule: string;
}

export interface CutterHeightGuidance {
  minHeightCm: number;
  description: string;
  benefits: string[];
}

export interface WideVergeGuidance {
  isApplicable: boolean;
  zones?: {
    zone1Edge: string;
    zone2Middle: string;
    zone3Back: string;
  };
}

export interface AdviceResult {
  version: 'verge-advice-v1';
  primaryRegime: RegimeRecommendation;
  fallbackRegime: RegimeRecommendation;
  safetyOverlay: SafetyOverlay;
  refugeGuidance: RefugeGuidance;
  cutterHeightGuidance: CutterHeightGuidance;
  wideVergeGuidance?: WideVergeGuidance;
  flags: string[];
  safetyDisclaimer: string;
}

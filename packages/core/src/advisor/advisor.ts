import {
  ADVICE_VERSION,
  CUTTER_HEIGHT_GUIDANCE,
  REFUGE_GUIDANCE,
  REGIMES,
  SAFETY_DISCLAIMER,
  SAFETY_OVERLAY,
} from './constants.js';
import type {
  AdviceResult,
  AdvisorInput,
  RegimeRecommendation,
  WideVergeGuidance,
} from './types.js';

/**
 * Cut-Regime Advisor (`verge-advice-v1`).
 *
 * Deterministic advisor mapping roadside verge attributes to recommended management regimes
 * (R1, RA, RB, RU) with mandatory safety, refuge, cutter-height, and width overlays.
 * Zero DOM, network, or Node dependencies.
 */
export function generateCutAdvice(input: AdvisorInput): AdviceResult {
  const isExpertReview = input.tier === 'Refer for expert review' || input.tier === 'expert_review';

  let primary: RegimeRecommendation;
  let fallback: RegimeRecommendation;
  const flags: string[] = [];

  // 1. Decision Tree based on setting and tier
  if (input.setting === 'urban') {
    if (isExpertReview) {
      primary = { ...REGIMES.RA };
      fallback = { ...REGIMES.RU };
      flags.push('EXPERT_REVIEW_RECOMMENDED');
    } else {
      primary = { ...REGIMES.RU };
      fallback = { ...REGIMES.RA };
    }
  } else {
    // Rural setting
    const cutsAllowed = input.cutsPossiblePerYear ?? 2;
    if (cutsAllowed === 1) {
      primary = { ...REGIMES.R1 };
      fallback = {
        ...REGIMES.R1,
        note: 'A second cut before Christmas would improve outcomes if budget allows.',
      };
    } else {
      primary = { ...REGIMES.RA };
      fallback = { ...REGIMES.RB };
    }

    if (isExpertReview) {
      flags.push('EXPERT_REVIEW_RECOMMENDED');
    }
  }

  // 2. Cuttings Fertility Flag
  if (input.cuttingsRemovable === 'no' || input.cuttingsRemovable === 'unknown') {
    flags.push('CUTTINGS_FERTILITY');
  }

  // 3. Wide Verge Guidance (> 3 m)
  let wideVergeGuidance: WideVergeGuidance | undefined;
  if (input.widthBand === 'gt3') {
    wideVergeGuidance = {
      isApplicable: true,
      zones: {
        zone1Edge:
          'Zone 1 (0–1.2 m from road edge): Regular safety cut (1 working width) kept short.',
        zone2Middle:
          'Zone 2 (1.2–3.0 m): Managed under meadow regime (RA or RB), cut 1–2 times per year with cuttings collected.',
        zone3Back:
          'Zone 3 (>3.0 m, hedge bottom/ditch): Cut on a 2-to-3-year rotation to create an ecotone buffer for wildlife.',
      },
    };
  }

  return {
    version: ADVICE_VERSION,
    primaryRegime: primary,
    fallbackRegime: fallback,
    safetyOverlay: SAFETY_OVERLAY,
    refugeGuidance: REFUGE_GUIDANCE,
    cutterHeightGuidance: CUTTER_HEIGHT_GUIDANCE,
    wideVergeGuidance,
    flags,
    safetyDisclaimer: SAFETY_DISCLAIMER,
  };
}

import {
  FORB_RICHNESS_POINTS,
  MANAGEMENT_FLAGS,
  MANAGEMENT_FLAG_MESSAGES,
  SCO_4_DISCLAIMER,
  SWARD_STRUCTURE_POINTS,
} from './constants.js';
import type { ScoreObservationInput } from './types.js';
import type { ScoreConfidence, ScoreResult, ScoreTier, ScoreTierLabel } from '../schemas/index.js';

/**
 * verge-triage-v1 Pure Scoring Engine.
 *
 * Implements the deterministic 4-component calculation:
 * Raw = R + I + S (<= 85)
 * Base = round(100 * Raw / 85)
 * Score = clamp(Base - N, 0, 100)
 *
 * Applies statutory orchid override, zero-forb override, and confidence rating.
 * Zero DOM, network, or external runtime dependencies.
 */
export function calculateTriageScore(input: ScoreObservationInput): ScoreResult {
  // 1. Forb Richness Subscore R (0-40)
  const richness = FORB_RICHNESS_POINTS[input.forbCountBand] ?? 0;

  // 2. Indicator Species Subscore I (0-30)
  let indicatorSum = 0;
  let positiveIndicatorCount = 0;
  let hasOrchid = input.hasOrchid ?? false;

  if (input.indicatorWeightsSum !== undefined) {
    indicatorSum = input.indicatorWeightsSum;
    if (indicatorSum > 0) {
      positiveIndicatorCount = 1;
    }
  } else if (input.indicators && input.indicators.length > 0) {
    for (const ind of input.indicators) {
      if (ind.group === 'nutrient_enrichment') {
        continue;
      }
      const weight = ind.weight ?? 0;
      if (weight > 0) {
        indicatorSum += weight;
        positiveIndicatorCount++;
      }
      if (ind.group === 'orchid' || ind.sensitive || ind.id.toLowerCase().includes('orchid')) {
        hasOrchid = true;
      }
    }
  } else if (input.indicatorIds && input.indicatorIds.length > 0) {
    // If only IDs are supplied without metadata, check for orchid IDs
    positiveIndicatorCount = input.indicatorIds.length;
    for (const id of input.indicatorIds) {
      if (id.toLowerCase().includes('orchid')) {
        hasOrchid = true;
      }
    }
  }

  const effectiveIndicatorSum = Math.min(10, indicatorSum);
  const indicators = Math.round((30 * effectiveIndicatorSum) / 10);

  // 3. Sward Structure Subscore S (0-15)
  const sward = SWARD_STRUCTURE_POINTS[input.swardStructure] ?? 0;

  // 4. Raw and Base Score
  const rawScore = Math.min(85, richness + indicators + sward);
  const baseScore = Math.round((100 * rawScore) / 85);

  // 5. Nutrient Penalty N (0-20)
  let nutrientCount = 0;
  if (input.nutrientDominantCount !== undefined) {
    nutrientCount = input.nutrientDominantCount;
  } else if (input.nutrientDominantIds) {
    nutrientCount = input.nutrientDominantIds.length;
  } else if (input.nutrientDominants) {
    nutrientCount = input.nutrientDominants.length;
  }
  const nutrientPenalty = Math.min(20, 7 * nutrientCount);

  // 6. Final Score (0-100)
  let finalScore = Math.max(0, Math.min(100, baseScore - nutrientPenalty));

  // 7. Management Flags
  const flags: string[] = [];
  if (input.cuttingsState === 'left') {
    flags.push(MANAGEMENT_FLAGS.CUTTINGS_LEFT);
  }
  if (input.lastCutMonth === 5 || input.lastCutMonth === 6) {
    flags.push(MANAGEMENT_FLAGS.MAY_JUNE_CUT);
  }
  if (
    input.swardStructure === 'tall_rank' &&
    (input.cuttingsState === 'left' || input.cutState === 'uncut')
  ) {
    flags.push(MANAGEMENT_FLAGS.RANK_GROWTH);
  }
  if (flags.length === 0) {
    flags.push(MANAGEMENT_FLAGS.NO_FLAGS);
  }

  // 8. Overrides & Tier Assignment
  let tier: ScoreTier;
  let tierLabel: ScoreTierLabel;
  let tierLevel: 1 | 2 | 3;
  let badgeCode: 'bronze' | 'silver' | 'gold';

  const breakdown: string[] = [
    `Richness score: ${richness} (band: ${input.forbCountBand})`,
    `Indicator score: ${indicators} (effective weight: ${effectiveIndicatorSum}/10)`,
    `Sward structure score: ${sward} (${input.swardStructure})`,
    `Raw total: ${rawScore}/85, Base score: ${baseScore}/100`,
  ];

  if (nutrientPenalty > 0) {
    breakdown.push(`Nutrient penalty: -${nutrientPenalty} (${nutrientCount} dominant species)`);
  }

  if (hasOrchid) {
    // Orchid Override: minimum Tier 1 Gold, score >= 70
    if (finalScore < 70) {
      finalScore = 70;
    }
    tier = 'expert_review';
    tierLabel = 'Refer for expert review';
    tierLevel = 1;
    badgeCode = 'gold';
    flags.push(MANAGEMENT_FLAGS.ORCHID_RECORDED);
    breakdown.push('Orchid override applied: score elevated to >= 70, minimum Tier 1 (Gold).');
  } else if (input.forbCountBand === '0' && positiveIndicatorCount === 0) {
    // Zero-Forb Override: max Tier 3 Bronze, max score 40
    if (finalScore > 40) {
      finalScore = 40;
    }
    tier = 'ordinary';
    tierLabel = 'Ordinary verge';
    tierLevel = 3;
    badgeCode = 'bronze';
    breakdown.push(
      'Zero-forb override applied: zero forbs recorded, capped at Tier 3 (Bronze) and max score 40.',
    );
  } else {
    // Standard Tier Bands
    if (finalScore >= 60) {
      tier = 'expert_review';
      tierLabel = 'Refer for expert review';
      tierLevel = 1;
      badgeCode = 'gold';
    } else if (finalScore >= 30) {
      tier = 'promising';
      tierLabel = 'Promising verge';
      tierLevel = 2;
      badgeCode = 'silver';
    } else {
      tier = 'ordinary';
      tierLabel = 'Ordinary verge';
      tierLevel = 3;
      badgeCode = 'bronze';
    }
  }

  // 9. Confidence Rating
  let confidence: ScoreConfidence = 'medium';
  if (
    positiveIndicatorCount === 0 &&
    (input.forbCountBand === '0' || input.forbCountBand === '1_2')
  ) {
    confidence = 'low';
  }

  // 10. Flag messages in breakdown
  for (const flag of flags) {
    const msg = MANAGEMENT_FLAG_MESSAGES[flag];
    if (msg) {
      breakdown.push(`[${flag}] ${msg}`);
    }
  }

  return {
    rawScore,
    baseScore,
    finalScore,
    subscores: {
      richness,
      indicators,
      sward,
      nutrientPenalty,
    },
    tier,
    tierLabel,
    tierLevel,
    badgeCode,
    confidence,
    flags,
    breakdown,
    disclaimer: SCO_4_DISCLAIMER,
  };
}

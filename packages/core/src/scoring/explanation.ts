import { MANAGEMENT_FLAG_MESSAGES, MANAGEMENT_FLAGS, SCO_4_DISCLAIMER } from './constants.js';
import type { ScoreExplanation, ScoreObservationInput } from './types.js';
import type { ScoreResult } from '../schemas/index.js';

/**
 * Generates human-readable breakdown and actionable suggestions for a triage score.
 */
export function generateScoreExplanation(
  input: ScoreObservationInput,
  result: ScoreResult,
): ScoreExplanation {
  const contributors: string[] = [];
  const penalties: string[] = [];
  const suggestions: string[] = [];

  // 1. Contributors
  if (result.subscores.richness > 0) {
    contributors.push(
      `Forb richness (${input.forbCountBand}): +${result.subscores.richness} points`,
    );
  }
  if (result.subscores.indicators > 0) {
    contributors.push(
      `Indicator species: +${result.subscores.indicators} points (${result.rawScore} raw score)`,
    );
  }
  if (result.subscores.sward > 0) {
    contributors.push(
      `Sward structure (${input.swardStructure}): +${result.subscores.sward} points`,
    );
  }

  // 2. Penalties
  if (result.subscores.nutrientPenalty > 0) {
    penalties.push(
      `Nutrient-enrichment dominants: -${result.subscores.nutrientPenalty} points deducted`,
    );
  }

  // 3. Flags and suggestions
  if (result.flags.includes(MANAGEMENT_FLAGS.CUTTINGS_LEFT)) {
    suggestions.push(
      MANAGEMENT_FLAG_MESSAGES[MANAGEMENT_FLAGS.CUTTINGS_LEFT] ??
        'Collecting cuttings prevents nutrient buildup.',
    );
  }

  if (result.flags.includes(MANAGEMENT_FLAGS.MAY_JUNE_CUT)) {
    suggestions.push(
      MANAGEMENT_FLAG_MESSAGES[MANAGEMENT_FLAGS.MAY_JUNE_CUT] ??
        'Early summer cutting reduces flowering.',
    );
  }

  if (result.subscores.indicators === 0) {
    suggestions.push(
      "Recording indicator species (e.g. bird's-foot trefoil or knapweed) would increase score and raise confidence.",
    );
  }

  if (result.flags.includes(MANAGEMENT_FLAGS.ORCHID_RECORDED)) {
    suggestions.push(
      'Wild orchid recorded: contact your local Wildlife Trust or biological records centre.',
    );
  }

  return {
    contributors,
    penalties,
    suggestions,
    disclaimer: SCO_4_DISCLAIMER,
  };
}

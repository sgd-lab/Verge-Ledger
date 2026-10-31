import { getCombinations } from './combinations.js';
import { MONTH_ALIGNMENT_SCALE, MONTH_NAMES, SIMULATOR_DISCLAIMER } from './constants.js';
import type {
  IndicativeSavings,
  RankedOption,
  SimulationParams,
  SimulationResult,
} from '../schemas/index.js';

type RemovalOption = RankedOption;

/**
 * Which-Cut-To-Drop Scenario Simulator.
 *
 * Evaluates candidate cut reductions against published wildflower-verge guidance.
 * Applies Rule 1 (safety cut lock), Rule 2 (late summer Aug/Sep preservation),
 * and 12-month alignment ranking.
 * Zero DOM, network, or external runtime dependencies.
 */
export function simulateCutDrop(params: SimulationParams): SimulationResult {
  const { currentCuts, tier, cuttingsRemovable, cutsToRemove, costInputs } = params;

  // Rule 1: Exclude safety-critical cuts from candidate removals
  const candidateCuts = currentCuts.filter((cut) => !cut.safetyCritical);

  if (candidateCuts.length < cutsToRemove) {
    return {
      status: 'no_valid_options',
      options: [],
      summaryMessage: 'no option meets guidance; consider alternatives',
      safetyDisclaimer: SIMULATOR_DISCLAIMER,
    };
  }

  const isHighValueTier =
    tier === 'promising' ||
    tier === 'Promising verge' ||
    tier === 'expert_review' ||
    tier === 'Refer for expert review';

  // Calculate indicative savings if cost inputs supplied
  let savings: IndicativeSavings | undefined;
  if (costInputs) {
    const km = costInputs.kmOfRoad ?? costInputs.vergeLengthKm ?? 0;
    const costSavedGbp = costInputs.costPerCutPerKm
      ? cutsToRemove * costInputs.costPerCutPerKm * km
      : undefined;
    const fuelSavedLitres = costInputs.fuelLitersPerCutPerKm
      ? cutsToRemove * costInputs.fuelLitersPerCutPerKm * km
      : undefined;
    const carbonSavedKg =
      fuelSavedLitres !== undefined ? Math.round(fuelSavedLitres * 2.68 * 10) / 10 : undefined;
    const operationalReductionPercent = Math.round((cutsToRemove / currentCuts.length) * 100);

    savings = {
      costSavedGbp,
      fuelSavedLitres,
      carbonSavedKg,
      operationalReductionPercent,
      label: 'Based on your assumption. Not an official council calculation.',
    };
  }

  // Generate all combinations of size cutsToRemove
  const candidateCombinations = getCombinations(candidateCuts, cutsToRemove);

  const evaluatedOptions: RemovalOption[] = candidateCombinations.map((droppedCuts) => {
    // Find remaining cuts in the annual schedule
    const droppedIds = new Set(droppedCuts.map((c, idx) => c.id ?? `${c.month}-${idx}`));
    const remainingCuts = currentCuts.filter(
      (c, idx) => !droppedIds.has(c.id ?? `${c.month}-${idx}`),
    );

    // Rule 3: Alignment score sum
    const sumAlignmentRemoved = droppedCuts.reduce(
      (sum, c) => sum + (MONTH_ALIGNMENT_SCALE[c.month] ?? 1),
      0,
    );

    // Rule 2: Aug/Sep preservation for Promising / Refer-for-review
    const hasLateSummerRemaining = remainingCuts.some((c) => c.month === 8 || c.month === 9);

    let recommended = true;
    let recommendationReason =
      'Recommended option to drop based on 12-month biodiversity alignment.';

    if (isHighValueTier && !hasLateSummerRemaining) {
      recommended = false;
      recommendationReason =
        'Guidance requires at least one cut in August or September for Promising or Refer-for-review verges to allow seed set.';
    }

    // Rule 5: Cuttings left caution
    const warnings: string[] = [];
    if (
      (cuttingsRemovable === 'no' || cuttingsRemovable === 'unknown') &&
      remainingCuts.length === 1
    ) {
      warnings.push(
        'With cuttings left on site, reducing to a single cut can increase rank growth and thatch buildup.',
      );
    }

    return {
      rank: 0, // Assigned after sorting
      cutsDropped: droppedCuts,
      remainingCuts,
      sumAlignmentRemoved,
      recommended,
      recommendationReason,
      warnings,
      savings,
    };
  });

  // Sort candidate options:
  // 1. Recommended before not-recommended
  // 2. Sum alignment removed ascending (lowest score = least value lost)
  // 3. Tie breaker: earlier month of dropped cuts first
  evaluatedOptions.sort((a, b) => {
    if (a.recommended !== b.recommended) {
      return a.recommended ? -1 : 1;
    }
    if (a.sumAlignmentRemoved !== b.sumAlignmentRemoved) {
      return a.sumAlignmentRemoved - b.sumAlignmentRemoved;
    }

    const aMonths = a.cutsDropped.map((c) => c.month).sort((m1, m2) => m1 - m2);
    const bMonths = b.cutsDropped.map((c) => c.month).sort((m1, m2) => m1 - m2);
    for (let i = 0; i < Math.min(aMonths.length, bMonths.length); i++) {
      if (aMonths[i] !== bMonths[i]) {
        return aMonths[i]! - bMonths[i]!;
      }
    }
    return 0;
  });

  // Assign ranks
  evaluatedOptions.forEach((opt, idx) => {
    opt.rank = idx + 1;
  });

  const hasAnyRecommended = evaluatedOptions.some((opt) => opt.recommended);

  if (!hasAnyRecommended) {
    return {
      status: 'no_valid_options',
      options: evaluatedOptions,
      summaryMessage: 'no option meets guidance; consider alternatives',
      safetyDisclaimer: SIMULATOR_DISCLAIMER,
    };
  }

  return {
    status: 'success',
    options: evaluatedOptions,
    summaryMessage: 'Options evaluated successfully against guidance.',
    safetyDisclaimer: SIMULATOR_DISCLAIMER,
  };
}

export { MONTH_ALIGNMENT_SCALE, MONTH_NAMES };

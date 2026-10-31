import { describe, expect, it } from 'vitest';
import { SIMULATOR_DISCLAIMER, simulateCutDrop, getCombinations } from '../src/index.js';

describe('Which-Cut-To-Drop Scenario Simulator', () => {
  describe('4 Canonical Spec Test Cases', () => {
    it('verifies Case 1: May (5), Jul (7), Sep (9); tier unknown, remove 1', () => {
      const result = simulateCutDrop({
        currentCuts: [
          { id: 'cut-1', month: 5, safetyCritical: false },
          { id: 'cut-2', month: 7, safetyCritical: false },
          { id: 'cut-3', month: 9, safetyCritical: false },
        ],
        tier: 'unknown',
        cuttingsRemovable: 'yes',
        cutsToRemove: 1,
      });

      expect(result.status).toBe('success');
      expect(result.options).toHaveLength(3);

      // Rank 1: Remove May (alignment 0)
      expect(result.options[0]?.rank).toBe(1);
      expect(result.options[0]?.cutsDropped[0]?.month).toBe(5);
      expect(result.options[0]?.sumAlignmentRemoved).toBe(0);
      expect(result.options[0]?.recommended).toBe(true);

      // Rank 2: Remove Jul (alignment 2)
      expect(result.options[1]?.rank).toBe(2);
      expect(result.options[1]?.cutsDropped[0]?.month).toBe(7);
      expect(result.options[1]?.sumAlignmentRemoved).toBe(2);
      expect(result.options[1]?.recommended).toBe(true);

      // Rank 3: Remove Sep (alignment 3)
      expect(result.options[2]?.rank).toBe(3);
      expect(result.options[2]?.cutsDropped[0]?.month).toBe(9);
      expect(result.options[2]?.sumAlignmentRemoved).toBe(3);
      expect(result.options[2]?.recommended).toBe(true);
    });

    it('verifies Case 2: May (5), Jul (7), Sep (9); tier Promising verge, remove 1', () => {
      const result = simulateCutDrop({
        currentCuts: [
          { id: 'cut-1', month: 5, safetyCritical: false },
          { id: 'cut-2', month: 7, safetyCritical: false },
          { id: 'cut-3', month: 9, safetyCritical: false },
        ],
        tier: 'Promising verge',
        cuttingsRemovable: 'yes',
        cutsToRemove: 1,
      });

      expect(result.status).toBe('success');
      expect(result.options).toHaveLength(3);

      // Dropping May leaves Jul & Sep (Sep in Aug/Sep) -> Recommended
      expect(result.options[0]?.cutsDropped[0]?.month).toBe(5);
      expect(result.options[0]?.recommended).toBe(true);

      // Dropping Jul leaves May & Sep (Sep in Aug/Sep) -> Recommended
      expect(result.options[1]?.cutsDropped[0]?.month).toBe(7);
      expect(result.options[1]?.recommended).toBe(true);

      // Dropping Sep leaves May & Jul (no Aug/Sep remaining!) -> Not recommended
      expect(result.options[2]?.cutsDropped[0]?.month).toBe(9);
      expect(result.options[2]?.recommended).toBe(false);
      expect(result.options[2]?.recommendationReason).toContain(
        'Guidance requires at least one cut in August or September for Promising or Refer-for-review verges to allow seed set.',
      );
    });

    it('verifies Case 3: May (5), Sep (9); May safetyCritical: true; tier Promising verge, remove 1', () => {
      const result = simulateCutDrop({
        currentCuts: [
          { id: 'cut-1', month: 5, safetyCritical: true }, // Locked by Rule 1
          { id: 'cut-2', month: 9, safetyCritical: false },
        ],
        tier: 'Promising verge',
        cuttingsRemovable: 'yes',
        cutsToRemove: 1,
      });

      // May cannot be removed because safetyCritical is true.
      // Sep is the only candidate, but removing Sep leaves zero Aug/Sep cuts on Promising verge.
      // Therefore, no valid recommended options exist.
      expect(result.status).toBe('no_valid_options');
      expect(result.summaryMessage).toBe('no option meets guidance; consider alternatives');
    });

    it('verifies Case 4: Mar (3), Aug (8), Dec (12); tier unknown, remove 2', () => {
      const result = simulateCutDrop({
        currentCuts: [
          { id: 'cut-1', month: 3, safetyCritical: false }, // Alignment 2
          { id: 'cut-2', month: 8, safetyCritical: false }, // Alignment 3
          { id: 'cut-3', month: 12, safetyCritical: false }, // Alignment 2
        ],
        tier: 'unknown',
        cuttingsRemovable: 'yes',
        cutsToRemove: 2,
      });

      expect(result.status).toBe('success');
      expect(result.options).toHaveLength(3);

      // Combination [Mar, Dec]: sum = 2 + 2 = 4 (Rank 1)
      expect(result.options[0]?.rank).toBe(1);
      const opt1Months = result.options[0]?.cutsDropped.map((c) => c.month).sort((a, b) => a - b);
      expect(opt1Months).toEqual([3, 12]);
      expect(result.options[0]?.sumAlignmentRemoved).toBe(4);

      // Combination [Mar, Aug]: sum = 2 + 3 = 5 (Rank 2, broken by earlier month Mar vs Aug)
      expect(result.options[1]?.rank).toBe(2);
      const opt2Months = result.options[1]?.cutsDropped.map((c) => c.month).sort((a, b) => a - b);
      expect(opt2Months).toEqual([3, 8]);
      expect(result.options[1]?.sumAlignmentRemoved).toBe(5);

      // Combination [Aug, Dec]: sum = 3 + 2 = 5 (Rank 3)
      expect(result.options[2]?.rank).toBe(3);
      const opt3Months = result.options[2]?.cutsDropped.map((c) => c.month).sort((a, b) => a - b);
      expect(opt3Months).toEqual([8, 12]);
      expect(result.options[2]?.sumAlignmentRemoved).toBe(5);
    });
  });

  describe('Edge Cases and Savings Calculations', () => {
    it('computes indicative cost and fuel savings when cost inputs are provided', () => {
      const result = simulateCutDrop({
        currentCuts: [
          { id: 'c1', month: 5 },
          { id: 'c2', month: 7 },
          { id: 'c3', month: 9 },
        ],
        tier: 'ordinary',
        cuttingsRemovable: 'yes',
        cutsToRemove: 1,
        costInputs: {
          costPerCutPerKm: 120,
          fuelLitersPerCutPerKm: 15,
          kmOfRoad: 10,
        },
      });

      const opt = result.options[0];
      expect(opt?.savings).toBeDefined();
      expect(opt?.savings?.costSavedGbp).toBe(1200); // 1 * 120 * 10
      expect(opt?.savings?.fuelSavedLitres).toBe(150); // 1 * 15 * 10
      expect(opt?.savings?.operationalReductionPercent).toBe(33); // 1/3 ~ 33%
      expect(opt?.savings?.label).toContain(
        'Based on your assumption. Not an official council calculation.',
      );
    });

    it('warns when cuttings are left and only 1 cut remains', () => {
      const result = simulateCutDrop({
        currentCuts: [
          { id: 'c1', month: 5 },
          { id: 'c2', month: 9 },
        ],
        tier: 'ordinary',
        cuttingsRemovable: 'no',
        cutsToRemove: 1,
      });

      expect(result.options[0]?.warnings).toContain(
        'With cuttings left on site, reducing to a single cut can increase rank growth and thatch buildup.',
      );
    });

    it('returns no_valid_options if requested cutsToRemove exceeds non-safety candidates', () => {
      const result = simulateCutDrop({
        currentCuts: [
          { id: 'c1', month: 5, safetyCritical: true },
          { id: 'c2', month: 9, safetyCritical: true },
        ],
        tier: 'ordinary',
        cuttingsRemovable: 'yes',
        cutsToRemove: 1,
      });

      expect(result.status).toBe('no_valid_options');
      expect(result.options).toEqual([]);
    });

    it('includes verbatim safety disclaimer', () => {
      const result = simulateCutDrop({
        currentCuts: [{ id: 'c1', month: 5 }],
        tier: 'ordinary',
        cuttingsRemovable: 'yes',
        cutsToRemove: 1,
      });

      expect(result.safetyDisclaimer).toBe(SIMULATOR_DISCLAIMER);
    });

    it('handles combinations boundaries and selective cost inputs', () => {
      // Test selective cost inputs (cost without fuel, and fuel without cost)
      const costOnly = simulateCutDrop({
        currentCuts: [
          { id: 'c1', month: 5 },
          { id: 'c2', month: 9 },
        ],
        tier: 'ordinary',
        cuttingsRemovable: 'yes',
        cutsToRemove: 1,
        costInputs: { vergeLengthKm: 10, costPerCutPerKm: 150 },
      });
      expect(costOnly.options[0]?.savings?.costSavedGbp).toBe(1500);
      expect(costOnly.options[0]?.savings?.fuelSavedLitres).toBeUndefined();

      const fuelOnly = simulateCutDrop({
        currentCuts: [
          { id: 'c1', month: 5 },
          { id: 'c2', month: 9 },
        ],
        tier: 'ordinary',
        cuttingsRemovable: 'yes',
        cutsToRemove: 1,
        costInputs: { kmOfRoad: 10, fuelLitersPerCutPerKm: 25 },
      });
      expect(fuelOnly.options[0]?.savings?.costSavedGbp).toBeUndefined();
      expect(fuelOnly.options[0]?.savings?.fuelSavedLitres).toBe(250);

      // Boundary tests for getCombinations
      expect(getCombinations([1, 2], 0)).toEqual([]);
      expect(getCombinations([1], 5)).toEqual([]);
    });
  });
});

import { describe, expect, it } from 'vitest';
import {
  calculateTriageScore,
  generateScoreExplanation,
  MANAGEMENT_FLAGS,
  SCO_4_DISCLAIMER,
  ScoreResultSchema,
} from '../src/index.js';

describe('verge-triage-v1 Pure Scoring Engine', () => {
  describe('Golden Fixtures A through E (Dispatch Targets)', () => {
    it('verifies Golden Fixture A: Score 85, Tier 1 (Gold)', () => {
      const result = calculateTriageScore({
        forbCountBand: '15plus', // R = 40
        indicatorWeightsSum: 8, // I = round(30 * 8 / 10) = 24
        swardStructure: 'short_uniform', // S = 8
        // Raw = 40 + 24 + 8 = 72; Base = round(100 * 72 / 85) = 85
        cutState: 'uncut',
        cuttingsState: 'na',
        nutrientDominantCount: 0, // N = 0
      });

      expect(result.subscores.richness).toBe(40);
      expect(result.subscores.indicators).toBe(24);
      expect(result.subscores.sward).toBe(8);
      expect(result.rawScore).toBe(72);
      expect(result.baseScore).toBe(85);
      expect(result.finalScore).toBe(85);
      expect(result.tier).toBe('expert_review');
      expect(result.tierLevel).toBe(1);
      expect(result.badgeCode).toBe('gold');
      expect(result.tierLabel).toBe('Refer for expert review');
    });

    it('verifies Golden Fixture B: Score 72, Tier 1 (Gold)', () => {
      const result = calculateTriageScore({
        forbCountBand: '6_9', // R = 28
        indicatorWeightsSum: 6, // I = 18
        swardStructure: 'medium_mixed', // S = 15
        // Raw = 28 + 18 + 15 = 61; Base = round(100 * 61 / 85) = 72
        cutState: 'uncut',
        cuttingsState: 'na',
        nutrientDominantCount: 0, // N = 0
      });

      expect(result.subscores.richness).toBe(28);
      expect(result.subscores.indicators).toBe(18);
      expect(result.subscores.sward).toBe(15);
      expect(result.rawScore).toBe(61);
      expect(result.baseScore).toBe(72);
      expect(result.finalScore).toBe(72);
      expect(result.tier).toBe('expert_review');
      expect(result.tierLevel).toBe(1);
      expect(result.badgeCode).toBe('gold');
    });

    it('verifies Golden Fixture C: Score 54, Tier 2 (Silver)', () => {
      const result = calculateTriageScore({
        forbCountBand: '6_9', // R = 28
        indicatorWeightsSum: 1, // I = 3
        swardStructure: 'medium_mixed', // S = 15
        // Raw = 28 + 3 + 15 = 46; Base = round(100 * 46 / 85) = 54
        cutState: 'uncut',
        cuttingsState: 'na',
        nutrientDominantCount: 0, // N = 0
      });

      expect(result.subscores.richness).toBe(28);
      expect(result.subscores.indicators).toBe(3);
      expect(result.subscores.sward).toBe(15);
      expect(result.rawScore).toBe(46);
      expect(result.baseScore).toBe(54);
      expect(result.finalScore).toBe(54);
      expect(result.tier).toBe('promising');
      expect(result.tierLevel).toBe(2);
      expect(result.badgeCode).toBe('silver');
      expect(result.tierLabel).toBe('Promising verge');
    });

    it('verifies Golden Fixture D: Score 28, Tier 3 (Bronze)', () => {
      const result = calculateTriageScore({
        forbCountBand: '3_5', // R = 18
        indicatorWeightsSum: 1, // I = 3
        swardStructure: 'tall_rank', // S = 3
        // Raw = 18 + 3 + 3 = 24; Base = round(100 * 24 / 85) = 28
        cutState: 'uncut',
        cuttingsState: 'left',
        nutrientDominantCount: 0, // N = 0
      });

      expect(result.subscores.richness).toBe(18);
      expect(result.subscores.indicators).toBe(3);
      expect(result.subscores.sward).toBe(3);
      expect(result.rawScore).toBe(24);
      expect(result.baseScore).toBe(28);
      expect(result.finalScore).toBe(28);
      expect(result.tier).toBe('ordinary');
      expect(result.tierLevel).toBe(3);
      expect(result.badgeCode).toBe('bronze');
      expect(result.tierLabel).toBe('Ordinary verge');
    });

    it('verifies Golden Fixture E: Score 12, Tier 3 (Bronze)', () => {
      const result = calculateTriageScore({
        forbCountBand: '1_2', // R = 8
        indicatorWeightsSum: 0, // I = 0
        swardStructure: 'short_uniform', // S = 8
        // Raw = 8 + 0 + 8 = 16; Base = round(100 * 16 / 85) = 19
        // N = 7 (1 nutrient dominant) -> 19 - 7 = 12
        cutState: 'cut_recent',
        cuttingsState: 'removed',
        nutrientDominantCount: 1,
      });

      expect(result.subscores.richness).toBe(8);
      expect(result.subscores.indicators).toBe(0);
      expect(result.subscores.sward).toBe(8);
      expect(result.subscores.nutrientPenalty).toBe(7);
      expect(result.rawScore).toBe(16);
      expect(result.baseScore).toBe(19);
      expect(result.finalScore).toBe(12);
      expect(result.tier).toBe('ordinary');
      expect(result.tierLevel).toBe(3);
      expect(result.badgeCode).toBe('bronze');
    });
  });

  describe('Authoritative Specification Fixtures (Doc 03 § 9)', () => {
    it('verifies Spec Fixture A: Score 9 (Raw 8, Base 9, N 0)', () => {
      const result = calculateTriageScore({
        forbCountBand: '0',
        indicators: [],
        swardStructure: 'short_uniform',
        cutState: 'cut_recent',
        cuttingsState: 'removed',
      });
      expect(result.finalScore).toBe(9);
      expect(result.tier).toBe('ordinary');
      expect(result.confidence).toBe('low');
    });

    it('verifies Spec Fixture B: Score 65 (Raw 55, Base 65, N 0)', () => {
      const result = calculateTriageScore({
        forbCountBand: '6_9',
        indicators: [
          { id: 'centaurea-nigra', weight: 2, group: 'forb' },
          { id: 'galium-verum', weight: 2, group: 'forb' },
        ],
        swardStructure: 'medium_mixed',
        cutState: 'uncut',
        cuttingsState: 'removed',
      });
      expect(result.finalScore).toBe(65);
      expect(result.tier).toBe('expert_review');
      expect(result.confidence).toBe('medium');
    });

    it('verifies Spec Fixture C: Score 66 (Raw 68, Base 80, N 14)', () => {
      const result = calculateTriageScore({
        forbCountBand: '10_14',
        indicatorWeightsSum: 6,
        swardStructure: 'medium_mixed',
        nutrientDominants: [
          { id: 'urtica-dioica', weight: 0, group: 'nutrient_enrichment' },
          { id: 'anthriscus-sylvestris', weight: 0, group: 'nutrient_enrichment' },
        ],
        cutState: 'uncut',
        cuttingsState: 'left',
      });
      expect(result.rawScore).toBe(68);
      expect(result.baseScore).toBe(80);
      expect(result.finalScore).toBe(66);
      expect(result.tier).toBe('expert_review');
    });

    it('verifies Spec Fixture D: Score 21 (Raw 24, Base 28, N 7)', () => {
      const result = calculateTriageScore({
        forbCountBand: '3_5',
        indicators: [{ id: 'lotus-corniculatus', weight: 1, group: 'legume' }],
        swardStructure: 'tall_rank',
        nutrientDominantCount: 1,
        cutState: 'uncut',
        cuttingsState: 'left',
      });
      expect(result.rawScore).toBe(24);
      expect(result.baseScore).toBe(28);
      expect(result.finalScore).toBe(21);
      expect(result.tier).toBe('ordinary');
      expect(result.flags).toContain(MANAGEMENT_FLAGS.CUTTINGS_LEFT);
      expect(result.flags).toContain(MANAGEMENT_FLAGS.RANK_GROWTH);
    });

    it('verifies Spec Fixture E: Score 41 (Raw 35, Base 41, N 0, Orchid override tier Promising)', () => {
      const result = calculateTriageScore({
        forbCountBand: '3_5',
        indicators: [
          {
            id: 'dactylorhiza-fuchsii',
            weight: 3,
            group: 'orchid',
            sensitive: true,
          },
        ],
        swardStructure: 'short_uniform',
        nutrientDominantCount: 0,
        cutState: 'uncut',
        cuttingsState: 'na',
      });

      expect(result.subscores.richness).toBe(18);
      expect(result.subscores.indicators).toBe(9);
      expect(result.subscores.sward).toBe(8);
      expect(result.subscores.nutrientPenalty).toBe(0);
      expect(result.rawScore).toBe(35);
      expect(result.baseScore).toBe(41);
      expect(result.finalScore).toBe(41);
      expect(result.tier).toBe('promising');
      expect(result.tierLabel).toBe('Promising verge');
      expect(result.tierLevel).toBe(2);
      expect(result.badgeCode).toBe('silver');
      expect(result.confidence).toBe('medium');
      expect(result.flags).toContain(MANAGEMENT_FLAGS.ORCHID_RECORDED);
      expect(result.flags).not.toContain(MANAGEMENT_FLAGS.NO_FLAGS);
    });
  });

  describe('Mandatory Overrides and Heuristics', () => {
    it('applies orchid override: >= 1 orchid elevates Ordinary tier to Promising without altering score', () => {
      const result = calculateTriageScore({
        forbCountBand: '1_2', // R = 8
        indicators: [
          {
            id: 'ophrys-apifera',
            weight: 3,
            group: 'orchid',
            sensitive: true,
          },
        ],
        swardStructure: 'short_uniform', // S = 8
        cutState: 'uncut',
        cuttingsState: 'na',
      });

      // Raw = 8 + 9 + 8 = 25 -> Base = round(100 * 25 / 85) = 29
      // Standard tier for 29 is Ordinary (Tier 3 Bronze)
      // Orchid override elevates tier to Promising (Tier 2 Silver) while preserving score 29
      expect(result.finalScore).toBe(29);
      expect(result.tier).toBe('promising');
      expect(result.tierLevel).toBe(2);
      expect(result.badgeCode).toBe('silver');
      expect(result.tierLabel).toBe('Promising verge');
      expect(result.flags).toContain(MANAGEMENT_FLAGS.ORCHID_RECORDED);
    });

    it('clamps negative subscores to zero and conforms to ScoreResultSchema', () => {
      const result = calculateTriageScore({
        forbCountBand: '0',
        indicatorWeightsSum: -10,
        nutrientDominantCount: -5,
        swardStructure: 'tall_rank',
        cutState: 'uncut',
        cuttingsState: 'na',
      });

      expect(result.subscores.indicators).toBe(0);
      expect(result.subscores.nutrientPenalty).toBe(0);
      expect(result.rawScore).toBe(3);
      expect(result.baseScore).toBe(4);
      expect(result.finalScore).toBe(4);
      expect(result.tier).toBe('ordinary');
      expect(() => ScoreResultSchema.parse(result)).not.toThrow();
    });

    it('deduplicates indicator species and nutrient dominants', () => {
      const duplicateIndicators = calculateTriageScore({
        forbCountBand: '0',
        indicators: [
          { id: 'centaurea-nigra', weight: 2, group: 'forb' },
          { id: 'centaurea-nigra', weight: 2, group: 'forb' },
        ],
        swardStructure: 'short_uniform',
        cutState: 'uncut',
        cuttingsState: 'na',
      });
      // Weight 2 once -> effective weight 2 -> round(30 * 2 / 10) = 6
      expect(duplicateIndicators.subscores.indicators).toBe(6);

      const duplicateNutrients = calculateTriageScore({
        forbCountBand: '0',
        swardStructure: 'short_uniform',
        cutState: 'uncut',
        cuttingsState: 'na',
        nutrientDominantIds: ['urtica-dioica', 'urtica-dioica'],
      });
      // 1 unique species -> penalty 7
      expect(duplicateNutrients.subscores.nutrientPenalty).toBe(7);
    });

    it('applies zero-forb override: 0 forbs and 0 indicators caps at Tier 3 (Bronze) and max score 40', () => {
      const result = calculateTriageScore({
        forbCountBand: '0',
        indicators: [],
        swardStructure: 'medium_mixed', // S = 15
        cutState: 'uncut',
        cuttingsState: 'na',
      });

      expect(result.tier).toBe('ordinary');
      expect(result.tierLevel).toBe(3);
      expect(result.badgeCode).toBe('bronze');
      expect(result.finalScore).toBeLessThanOrEqual(40);
    });

    it('clamps scores strictly between 0 and 100', () => {
      // Extremely low score with high nutrient penalties
      const lowResult = calculateTriageScore({
        forbCountBand: '0',
        indicators: [],
        swardStructure: 'tall_rank',
        nutrientDominantCount: 5, // N = 20
        cutState: 'uncut',
        cuttingsState: 'na',
      });
      expect(lowResult.finalScore).toBe(0);

      // Max score
      const highResult = calculateTriageScore({
        forbCountBand: '15plus',
        indicatorWeightsSum: 15, // Capped at 10 -> I = 30
        swardStructure: 'medium_mixed', // S = 15
        nutrientDominantCount: 0,
        cutState: 'uncut',
        cuttingsState: 'na',
      });
      expect(highResult.finalScore).toBe(100);
    });

    it('assigns confidence: low only when 0 indicators and forb band 0 or 1_2', () => {
      const lowConf1 = calculateTriageScore({
        forbCountBand: '0',
        indicators: [],
        swardStructure: 'short_uniform',
        cutState: 'uncut',
        cuttingsState: 'na',
      });
      expect(lowConf1.confidence).toBe('low');

      const lowConf2 = calculateTriageScore({
        forbCountBand: '1_2',
        indicators: [],
        swardStructure: 'short_uniform',
        cutState: 'uncut',
        cuttingsState: 'na',
      });
      expect(lowConf2.confidence).toBe('low');

      const medConf = calculateTriageScore({
        forbCountBand: '3_5',
        indicators: [],
        swardStructure: 'short_uniform',
        cutState: 'uncut',
        cuttingsState: 'na',
      });
      expect(medConf.confidence).toBe('medium');
    });

    it('never assigns confidence high in v1', () => {
      const maxedSurvey = calculateTriageScore({
        forbCountBand: '15plus',
        indicatorWeightsSum: 10,
        swardStructure: 'medium_mixed',
        cutState: 'uncut',
        cuttingsState: 'removed',
      });
      expect(maxedSurvey.confidence).not.toBe('high');
      expect(maxedSurvey.confidence).toBe('medium');
    });
  });

  describe('Management Flags and Explanation Breakdown', () => {
    it('detects CUTTINGS_LEFT when cuttingsState is left', () => {
      const result = calculateTriageScore({
        forbCountBand: '6_9',
        swardStructure: 'medium_mixed',
        cutState: 'cut_recent',
        cuttingsState: 'left',
      });
      expect(result.flags).toContain(MANAGEMENT_FLAGS.CUTTINGS_LEFT);
    });

    it('detects MAY_JUNE_CUT when last cut month is May (5) or June (6)', () => {
      const mayResult = calculateTriageScore({
        forbCountBand: '6_9',
        swardStructure: 'medium_mixed',
        cutState: 'cut_recent',
        cuttingsState: 'removed',
        lastCutMonth: 5,
      });
      expect(mayResult.flags).toContain(MANAGEMENT_FLAGS.MAY_JUNE_CUT);

      const juneResult = calculateTriageScore({
        forbCountBand: '6_9',
        swardStructure: 'medium_mixed',
        cutState: 'cut_recent',
        cuttingsState: 'removed',
        lastCutMonth: 6,
      });
      expect(juneResult.flags).toContain(MANAGEMENT_FLAGS.MAY_JUNE_CUT);
    });

    it('detects RANK_GROWTH when sward is tall_rank and uncollected or uncut', () => {
      const result = calculateTriageScore({
        forbCountBand: '3_5',
        swardStructure: 'tall_rank',
        cutState: 'uncut',
        cuttingsState: 'left',
      });
      expect(result.flags).toContain(MANAGEMENT_FLAGS.RANK_GROWTH);
    });

    it('returns NO_FLAGS when no management conditions are violated', () => {
      const result = calculateTriageScore({
        forbCountBand: '6_9',
        swardStructure: 'medium_mixed',
        cutState: 'cut_recent',
        cuttingsState: 'removed',
        lastCutMonth: 9,
      });
      expect(result.flags).toEqual([MANAGEMENT_FLAGS.NO_FLAGS]);
    });

    it('includes verbatim SCO-4 disclaimer text', () => {
      const result = calculateTriageScore({
        forbCountBand: '6_9',
        swardStructure: 'medium_mixed',
        cutState: 'uncut',
        cuttingsState: 'removed',
      });
      expect(result.disclaimer).toBe(SCO_4_DISCLAIMER);
      expect(result.disclaimer).toContain(
        'This is a quick volunteer triage, not an ecological survey',
      );
    });

    it('handles indicatorIds with and without orchid string ids', () => {
      const regularIds = calculateTriageScore({
        forbCountBand: '6_9',
        indicatorIds: ['centaurea-nigra', 'galium-verum'],
        swardStructure: 'medium_mixed',
        cutState: 'uncut',
        cuttingsState: 'removed',
      });
      expect(regularIds.confidence).toBe('medium');

      const orchidIds = calculateTriageScore({
        forbCountBand: '1_2',
        indicatorIds: ['wild-orchid-unspecified'],
        swardStructure: 'medium_mixed',
        cutState: 'uncut',
        cuttingsState: 'removed',
      });
      expect(orchidIds.tier).toBe('promising');
      expect(orchidIds.tierLevel).toBe(2);
      expect(orchidIds.badgeCode).toBe('silver');
      expect(orchidIds.flags).toContain(MANAGEMENT_FLAGS.ORCHID_RECORDED);
    });

    it('skips nutrient_enrichment group items inside indicators list', () => {
      const result = calculateTriageScore({
        forbCountBand: '6_9',
        indicators: [
          { id: 'centaurea-nigra', weight: 2, group: 'forb' },
          { id: 'urtica-dioica', weight: 0, group: 'nutrient_enrichment' },
        ],
        swardStructure: 'tall_rank',
        cutState: 'uncut',
        cuttingsState: 'removed', // triggers cutState === 'uncut' branch of RANK_GROWTH
      });
      expect(result.subscores.indicators).toBe(6);
      expect(result.flags).toContain(MANAGEMENT_FLAGS.RANK_GROWTH);
    });

    it('generates structured explanation when 0 indicators and orchid recorded', () => {
      const orchidInput = {
        forbCountBand: '1_2' as const,
        indicators: [],
        hasOrchid: true,
        swardStructure: 'tall_rank' as const,
        cutState: 'uncut' as const,
        cuttingsState: 'removed' as const,
      };
      const result = calculateTriageScore(orchidInput);
      const explanation = generateScoreExplanation(orchidInput, result);

      expect(explanation.suggestions).toContain(
        "Recording indicator species (e.g. bird's-foot trefoil or knapweed) would increase score and raise confidence.",
      );
      expect(explanation.suggestions).toContain(
        'Wild orchid recorded: contact your local Wildlife Trust or biological records centre.',
      );
    });

    it('generates full structured explanation for cut flags and contributors', () => {
      const fullInput = {
        forbCountBand: '6_9' as const,
        indicatorWeightsSum: 4,
        swardStructure: 'medium_mixed' as const,
        cutState: 'cut_recent' as const,
        cuttingsState: 'left' as const,
        lastCutMonth: 5,
        nutrientDominantCount: 1,
      };
      const fullResult = calculateTriageScore(fullInput);
      const fullExplanation = generateScoreExplanation(fullInput, fullResult);

      expect(fullExplanation.contributors.length).toBe(3);
      expect(fullExplanation.penalties.length).toBe(1);
      expect(fullExplanation.suggestions).toContain(
        'Cuttings left on the verge return nutrients and favour coarse grasses.',
      );
      expect(fullExplanation.suggestions).toContain(
        'Guidance suggests early summer cuts reduce flowering and seed set where the aim is wildflowers.',
      );
    });
  });
});

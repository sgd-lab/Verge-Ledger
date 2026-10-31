import { describe, expect, it } from 'vitest';
import { ADVICE_VERSION, generateCutAdvice, SAFETY_DISCLAIMER } from '../src/index.js';

describe('Cut-Regime Advisor (verge-advice-v1)', () => {
  it('advises RU primary and RA fallback for urban ordinary verge', () => {
    const advice = generateCutAdvice({
      setting: 'urban',
      roadClass: 'C',
      widthBand: '1_5_to_3',
      tier: 'ordinary',
      cuttingsRemovable: 'yes',
    });

    expect(advice.version).toBe(ADVICE_VERSION);
    expect(advice.primaryRegime.regimeId).toBe('RU');
    expect(advice.fallbackRegime.regimeId).toBe('RA');
    expect(advice.flags).not.toContain('EXPERT_REVIEW_RECOMMENDED');
  });

  it('elevates to RA primary for urban verge under expert review', () => {
    const advice = generateCutAdvice({
      setting: 'urban',
      roadClass: 'B',
      widthBand: '1_5_to_3',
      tier: 'Refer for expert review',
      cuttingsRemovable: 'yes',
    });

    expect(advice.primaryRegime.regimeId).toBe('RA');
    expect(advice.fallbackRegime.regimeId).toBe('RU');
    expect(advice.flags).toContain('EXPERT_REVIEW_RECOMMENDED');
  });

  it('advises R1 primary and R1 with note for rural single-cut verges', () => {
    const advice = generateCutAdvice({
      setting: 'rural',
      roadClass: 'C',
      widthBand: '1_5_to_3',
      tier: 'promising',
      cuttingsRemovable: 'yes',
      cutsPossiblePerYear: 1,
    });

    expect(advice.primaryRegime.regimeId).toBe('R1');
    expect(advice.fallbackRegime.regimeId).toBe('R1');
    expect(advice.fallbackRegime.note).toContain(
      'A second cut before Christmas would improve outcomes',
    );
  });

  it('advises RA primary and RB fallback for rural verges with 2+ cuts', () => {
    const advice = generateCutAdvice({
      setting: 'rural',
      roadClass: 'A',
      widthBand: '1_5_to_3',
      tier: 'promising',
      cuttingsRemovable: 'yes',
      cutsPossiblePerYear: 2,
    });

    expect(advice.primaryRegime.regimeId).toBe('RA');
    expect(advice.fallbackRegime.regimeId).toBe('RB');
  });

  it('attaches wide verge zoning guidance when widthBand is gt3', () => {
    const advice = generateCutAdvice({
      setting: 'rural',
      roadClass: 'B',
      widthBand: 'gt3',
      tier: 'ordinary',
      cuttingsRemovable: 'yes',
    });

    expect(advice.wideVergeGuidance).toBeDefined();
    expect(advice.wideVergeGuidance?.isApplicable).toBe(true);
    expect(advice.wideVergeGuidance?.zones?.zone1Edge).toContain('0–1.2 m');
    expect(advice.wideVergeGuidance?.zones?.zone2Middle).toContain('1.2–3.0 m');
    expect(advice.wideVergeGuidance?.zones?.zone3Back).toContain('>3.0 m');
  });

  it('flags CUTTINGS_FERTILITY when cuttings are not removable or unknown', () => {
    const adviceNo = generateCutAdvice({
      setting: 'rural',
      roadClass: 'C',
      widthBand: 'lt1_5',
      tier: 'ordinary',
      cuttingsRemovable: 'no',
    });
    expect(adviceNo.flags).toContain('CUTTINGS_FERTILITY');

    const adviceUnknown = generateCutAdvice({
      setting: 'rural',
      roadClass: 'C',
      widthBand: 'lt1_5',
      tier: 'ordinary',
      cuttingsRemovable: 'unknown',
    });
    expect(adviceUnknown.flags).toContain('CUTTINGS_FERTILITY');
  });

  it('always includes mandatory safety, refuge, cutter height overlays and disclaimer', () => {
    const advice = generateCutAdvice({
      setting: 'rural',
      roadClass: 'A',
      widthBand: '1_5_to_3',
      tier: 'expert_review',
      cuttingsRemovable: 'yes',
    });

    expect(advice.safetyOverlay.swatheWidthMeters).toBe(1.2);
    expect(advice.safetyOverlay.mandatoryRule).toContain('Highway safety rules take priority');
    expect(advice.refugeGuidance.refugePercentage).toBe('10% to 20%');
    expect(advice.cutterHeightGuidance.minHeightCm).toBe(8);
    expect(advice.safetyDisclaimer).toBe(SAFETY_DISCLAIMER);
    expect(advice.flags).toContain('EXPERT_REVIEW_RECOMMENDED');
  });
});

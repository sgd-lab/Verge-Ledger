import { describe, it, expect } from 'vitest';
import { INDICATOR_SPECIES } from '@verge-ledger/data';
import type { SurveyObservation, VergeSegment } from '@verge-ledger/core';
import { generateUlid } from './id';
import {
  advisorInputFor,
  councilFactRecordFromForm,
  evidencePackText,
  latestObservationsBySegment,
  scoreForObservation,
  validateCouncilFactForm,
  type CouncilFactForm,
} from './pageData';

const NOW = '2026-05-01T10:00:00.000Z';

function makeSegment(overrides: Partial<VergeSegment> = {}): VergeSegment {
  return {
    id: generateUlid(),
    workspaceId: generateUlid(),
    geometry: { type: 'LineString', coordinates: [[-1.5, 52.5], [-1.499, 52.501]] },
    lengthM: 100,
    roadClass: 'C',
    setting: 'rural',
    widthBand: '1_5_to_3',
    side: 'left',
    roadName: 'Church Lane',
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    isDemo: false,
    ...overrides,
  };
}

function makeObservation(overrides: Partial<SurveyObservation> = {}): SurveyObservation {
  return {
    id: generateUlid(),
    segmentId: generateUlid(),
    observedAt: NOW,
    forbCountBand: '15plus',
    indicatorIds: ['centaurea-nigra', 'primula-veris'],
    nutrientDominantIds: [],
    swardStructure: 'medium_mixed',
    cutState: 'unknown',
    cuttingsState: 'removed',
    lastCutMonth: null,
    notes: null,
    photoIds: [],
    scoringVersion: 'verge-triage-v1',
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    isDemo: false,
    ...overrides,
  };
}

describe('latestObservationsBySegment', () => {
  it('keeps the most recent observation per segment and ignores deleted ones', () => {
    const segmentId = generateUlid();
    const older = makeObservation({ segmentId, observedAt: '2026-04-01T10:00:00.000Z' });
    const newer = makeObservation({ segmentId, observedAt: '2026-05-01T10:00:00.000Z' });
    const deleted = makeObservation({
      segmentId,
      observedAt: '2026-06-01T10:00:00.000Z',
      deletedAt: '2026-06-02T10:00:00.000Z',
    });
    const latest = latestObservationsBySegment([older, newer, deleted]);
    expect(latest.get(segmentId)?.id).toBe(newer.id);
  });
});

describe('scoreForObservation', () => {
  it('computes a score from full indicator weights when none is stored', () => {
    const score = scoreForObservation(makeObservation(), INDICATOR_SPECIES);
    // Richness 40 + indicators (weights 2+3 -> 15) + sward 15 = raw 70 -> base 82.
    expect(score?.finalScore).toBe(82);
    expect(score?.tier).toBe('expert_review');
  });

  it('prefers a stored score over recomputation', () => {
    const stored = scoreForObservation(makeObservation(), INDICATOR_SPECIES);
    const obs = makeObservation({ scoreResult: stored ?? undefined, forbCountBand: '0' });
    expect(scoreForObservation(obs, INDICATOR_SPECIES)).toBe(stored);
  });
});

describe('advisorInputFor', () => {
  it('maps segment, score tier and cuttings state to advisor inputs', () => {
    const segment = makeSegment();
    const obs = makeObservation({ cutsPerYear: 2 });
    const score = scoreForObservation(obs, INDICATOR_SPECIES);
    const input = advisorInputFor(segment, obs, score);
    expect(input).toMatchObject({
      setting: 'rural',
      roadClass: 'C',
      widthBand: '1_5_to_3',
      tier: 'expert_review',
      cuttingsRemovable: 'yes',
      cutsPossiblePerYear: 2,
    });
  });
});

describe('validateCouncilFactForm', () => {
  const valid: CouncilFactForm = {
    authorityName: 'Example County Council',
    councilId: 'example-county',
    tier: 'county',
    policyType: 'rural',
    key: 'ruralCutsPerYear',
    value: '2',
    sourceUrl: 'https://example.org/verges',
    sourceRetrievedAt: '2026-05-01',
    status: 'unverified',
  };

  it('accepts a complete, sourced fact', () => {
    expect(validateCouncilFactForm(valid)).toEqual([]);
  });

  it('rejects a missing source URL and a malformed retrieval date', () => {
    const errors = validateCouncilFactForm({
      ...valid,
      sourceUrl: 'not-a-url',
      sourceRetrievedAt: '01/05/2026',
    });
    expect(errors).toContain('Source URL must be a valid web address.');
    expect(errors).toContain('Source retrieved date must be YYYY-MM-DD.');
  });
});

describe('councilFactRecordFromForm', () => {
  it('keeps numbers as numbers and true/false as booleans', () => {
    const base: CouncilFactForm = {
      authorityName: 'Example',
      councilId: 'example',
      tier: 'county',
      policyType: 'rural',
      key: 'ruralCutsPerYear',
      value: '2',
      sourceUrl: 'https://example.org',
      sourceRetrievedAt: '2026-05-01',
      status: 'unverified',
    };
    expect(councilFactRecordFromForm(base, generateUlid()).value).toBe(2);
    expect(councilFactRecordFromForm({ ...base, value: 'true' }, generateUlid()).value).toBe(true);
    expect(councilFactRecordFromForm({ ...base, value: 'left on site' }, generateUlid()).value).toBe(
      'left on site',
    );
  });
});

describe('evidencePackText', () => {
  it('includes the score, tier, disclaimer and sensitive-taxa warning', () => {
    const segment = makeSegment();
    const obs = makeObservation();
    const score = scoreForObservation(obs, INDICATOR_SPECIES);
    const text = evidencePackText(segment, obs, score, INDICATOR_SPECIES);
    expect(text).toContain('82 / 100');
    expect(text).toContain('Refer for expert review');
    expect(text).toContain('volunteer triage');
    expect(text).toContain('Sensitive taxa are never shown at precise location');
  });

  it('says plainly when no observation exists yet', () => {
    const text = evidencePackText(makeSegment(), undefined, null, INDICATOR_SPECIES);
    expect(text).toContain('No survey observation has been recorded');
  });
});

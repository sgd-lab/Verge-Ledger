import { describe, it, expect } from 'vitest';
import { IndicatorSpeciesSchema } from '@verge-ledger/core';
import { DATA_VERSION, INDICATOR_SPECIES } from '../src/index.js';
import rawIndicators from '../indicators.json' with { type: 'json' };

describe('Curated Indicator Species Dataset', () => {
  it('exports valid DATA_VERSION and typed INDICATOR_SPECIES array', () => {
    expect(DATA_VERSION).toBe('0.1.0');
    expect(Array.isArray(INDICATOR_SPECIES)).toBe(true);
    expect(INDICATOR_SPECIES.length).toBe(rawIndicators.length);
  });

  it('IND-1: all entries validate against IndicatorSpeciesSchema', () => {
    for (const item of rawIndicators) {
      const parsed = IndicatorSpeciesSchema.safeParse(item);
      expect(
        parsed.success,
        `Item ${item.id} failed schema validation: ${JSON.stringify(parsed)}`,
      ).toBe(true);
    }
  });

  it('IND-2: dataset size conforms to boundary constraints (20 <= N <= 40)', () => {
    expect(rawIndicators.length).toBeGreaterThanOrEqual(20);
    expect(rawIndicators.length).toBeLessThanOrEqual(40);
    expect(rawIndicators.length).toBe(37);
  });

  it('IND-3: all species IDs are unique kebab-case strings', () => {
    const ids = new Set<string>();
    const kebabRegex = /^[a-z0-9-]+$/;

    for (const item of rawIndicators) {
      expect(kebabRegex.test(item.id), `ID "${item.id}" is not valid kebab-case`).toBe(true);
      expect(ids.has(item.id), `Duplicate ID detected: "${item.id}"`).toBe(false);
      ids.add(item.id);
    }
  });

  it('IND-4: all species have HTTPS source URLs and ISO-8601 retrieval dates', () => {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\\d{2}(\\.\\d{3})?Z)?$/;

    for (const item of rawIndicators) {
      expect(
        item.sourceUrl.startsWith('https://'),
        `Species ${item.id} URL must start with https://`,
      ).toBe(true);
      expect(
        isoDateRegex.test(item.sourceRetrievedAt),
        `Species ${item.id} date must be ISO-8601`,
      ).toBe(true);
      expect(item.sourceRetrievedAt).toBe('2026-10-31');
    }
  });

  it('IND-5: all orchids have group="orchid", weight=3, and sensitive=true', () => {
    const orchids = rawIndicators.filter((item) => item.group === 'orchid');
    expect(orchids.length).toBe(4);

    const expectedOrchidIds = [
      'dactylorhiza-fuchsii',
      'anacamptis-pyramidalis',
      'ophrys-apifera',
      'wild-orchid-unspecified',
    ];

    expect(orchids.map((o) => o.id).sort()).toEqual(expectedOrchidIds.sort());

    for (const orchid of orchids) {
      expect(orchid.weight).toBe(3);
      expect(orchid.sensitive).toBe(true);
    }
  });

  it('IND-6: all nutrient dominants have group="nutrient_enrichment" and weight=0', () => {
    const nutrientDominants = rawIndicators.filter((item) => item.group === 'nutrient_enrichment');
    expect(nutrientDominants.length).toBe(8);

    const expectedDominantIds = [
      'urtica-dioica',
      'anthriscus-sylvestris',
      'heracleum-sphondylium',
      'rumex-obtusifolius',
      'cirsium-arvense',
      'lolium-perenne',
      'galium-aparine',
      'arrhenatherum-elatius',
    ];

    expect(nutrientDominants.map((d) => d.id).sort()).toEqual(expectedDominantIds.sort());

    for (const dominant of nutrientDominants) {
      expect(dominant.weight).toBe(0);
      expect(dominant.sensitive).toBe(false);
    }
  });

  it('IND-7: not-sure entry is present with weight=0', () => {
    const notSure = rawIndicators.find((item) => item.id === 'not-sure');
    expect(notSure).toBeDefined();
    expect(notSure?.weight).toBe(0);
    expect(notSure?.sensitive).toBe(false);
    expect(notSure?.group).toBe('forb');
  });

  it('IND-8: provisional weights are strictly in range 0-3 with reviewStatus needs_expert_review', () => {
    for (const item of rawIndicators) {
      expect(item.weight).toBeGreaterThanOrEqual(0);
      expect(item.weight).toBeLessThanOrEqual(3);
      expect(item.reviewStatus).toBe('needs_expert_review');
    }
  });
});

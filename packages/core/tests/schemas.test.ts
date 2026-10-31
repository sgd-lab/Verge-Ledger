import { describe, expect, it } from 'vitest';
import {
  CouncilFactSchema,
  CouncilSchema,
  ImpactCountersSchema,
  IndicatorSpeciesSchema,
  LineStringGeometrySchema,
  PhotoSchema,
  RegimeGuidanceSchema,
  SimulationParamsSchema,
  SurveyObservationSchema,
  UlidSchema,
  VergeSegmentSchema,
  WorkspaceSchema,
} from '../src/index.js';

describe('Domain Models and Zod Schemas', () => {
  const validUlid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validIsoDateTime = '2026-10-31T12:00:00.000Z';
  const validIsoDate = '2026-10-31';

  describe('UlidSchema', () => {
    it('accepts valid 26-character Crockford Base32 ULIDs', () => {
      expect(UlidSchema.parse(validUlid)).toBe(validUlid);
    });

    it('rejects ULIDs containing ambiguous characters I, L, O, U', () => {
      expect(() => UlidSchema.parse('01ARZ3NDEKTSV4RRFFQ69G5FAI')).toThrow();
      expect(() => UlidSchema.parse('01ARZ3NDEKTSV4RRFFQ69G5FAL')).toThrow();
      expect(() => UlidSchema.parse('01ARZ3NDEKTSV4RRFFQ69G5FAO')).toThrow();
      expect(() => UlidSchema.parse('01ARZ3NDEKTSV4RRFFQ69G5FAU')).toThrow();
    });

    it('rejects strings with invalid lengths', () => {
      expect(() => UlidSchema.parse('01ARZ3NDEK')).toThrow();
      expect(() => UlidSchema.parse('01ARZ3NDEKTSV4RRFFQ69G5FAVEXTRA')).toThrow();
    });
  });

  describe('LineStringGeometrySchema', () => {
    it('parses valid LineString geometry and rejects invalid formats', () => {
      const valid = LineStringGeometrySchema.parse({
        type: 'LineString',
        coordinates: [
          [0.1, 52.1],
          [0.2, 52.2],
        ],
      });
      expect(valid.coordinates).toHaveLength(2);
      expect(() =>
        LineStringGeometrySchema.parse({
          type: 'Point',
          coordinates: [0.1, 52.1],
        }),
      ).toThrow();
    });
  });

  describe('WorkspaceSchema', () => {
    it('parses a valid workspace and applies defaults', () => {
      const parsed = WorkspaceSchema.parse({
        id: validUlid,
        name: 'Little Snoring Parish',
        createdAt: validIsoDateTime,
        updatedAt: validIsoDateTime,
      });
      expect(parsed.name).toBe('Little Snoring Parish');
      expect(parsed.isDemo).toBe(false);
      expect(parsed.serverId).toBeNull();
      expect(parsed.syncEnabled).toBe(false);
    });

    it('rejects extra unknown properties due to strict mode', () => {
      expect(() =>
        WorkspaceSchema.parse({
          id: validUlid,
          name: 'Parish',
          createdAt: validIsoDateTime,
          updatedAt: validIsoDateTime,
          unknownField: true,
        }),
      ).toThrow();
    });
  });

  describe('VergeSegmentSchema', () => {
    const validGeometry = {
      type: 'LineString' as const,
      coordinates: [
        [0.12, 52.34],
        [0.13, 52.35],
      ] as [number, number][],
    };

    it('parses a valid verge segment', () => {
      const segment = VergeSegmentSchema.parse({
        id: validUlid,
        workspaceId: validUlid,
        geometry: validGeometry,
        lengthM: 85.5,
        roadClass: 'C',
        setting: 'rural',
        widthBand: '1_5_to_3',
        side: 'left',
        roadName: 'Church Lane',
        createdAt: validIsoDateTime,
        updatedAt: validIsoDateTime,
      });
      expect(segment.lengthM).toBe(85.5);
      expect(segment.setting).toBe('rural');
    });

    it('enforces SUR-1 length constraints (5m <= lengthM <= 500m)', () => {
      expect(() =>
        VergeSegmentSchema.parse({
          id: validUlid,
          workspaceId: validUlid,
          geometry: validGeometry,
          lengthM: 4.9,
          roadClass: 'B',
          setting: 'rural',
          widthBand: 'lt1_5',
          side: 'both',
          createdAt: validIsoDateTime,
          updatedAt: validIsoDateTime,
        }),
      ).toThrow();

      expect(() =>
        VergeSegmentSchema.parse({
          id: validUlid,
          workspaceId: validUlid,
          geometry: validGeometry,
          lengthM: 500.1,
          roadClass: 'B',
          setting: 'rural',
          widthBand: 'lt1_5',
          side: 'both',
          createdAt: validIsoDateTime,
          updatedAt: validIsoDateTime,
        }),
      ).toThrow();
    });
  });

  describe('SurveyObservationSchema', () => {
    it('parses a valid survey observation', () => {
      const obs = SurveyObservationSchema.parse({
        id: validUlid,
        segmentId: validUlid,
        observedAt: validIsoDateTime,
        forbCountBand: '6_9',
        indicatorIds: ['centaurea-nigra', 'lotus-corniculatus'],
        nutrientDominantIds: ['urtica-dioica'],
        swardStructure: 'medium_mixed',
        cutState: 'uncut',
        cuttingsState: 'left',
        lastCutMonth: 5,
        scoringVersion: 'verge-triage-v1',
        createdAt: validIsoDateTime,
        updatedAt: validIsoDateTime,
      });
      expect(obs.forbCountBand).toBe('6_9');
      expect(obs.photoIds).toEqual([]);
      expect(obs.scoreResult).toBeUndefined();
    });

    it('enforces SUR-4 limit of maximum 3 photos', () => {
      expect(() =>
        SurveyObservationSchema.parse({
          id: validUlid,
          segmentId: validUlid,
          observedAt: validIsoDateTime,
          forbCountBand: '1_2',
          indicatorIds: [],
          nutrientDominantIds: [],
          swardStructure: 'short_uniform',
          cutState: 'cut_recent',
          cuttingsState: 'removed',
          scoringVersion: 'verge-triage-v1',
          photoIds: [validUlid, validUlid, validUlid, validUlid],
          createdAt: validIsoDateTime,
          updatedAt: validIsoDateTime,
        }),
      ).toThrow();
    });
  });

  describe('PhotoSchema', () => {
    it('parses a valid photo metadata object', () => {
      const photo = PhotoSchema.parse({
        id: validUlid,
        observationId: validUlid,
        mime: 'image/jpeg',
        width: 1920,
        height: 1080,
        createdAt: validIsoDateTime,
      });
      expect(photo.mime).toBe('image/jpeg');
      expect(photo.width).toBe(1920);
    });
  });

  describe('CouncilSchema & CouncilFactSchema', () => {
    it('parses valid council and council facts', () => {
      const council = CouncilSchema.parse({
        id: 'norfolk-county-council',
        name: 'Norfolk County Council',
        type: 'county',
        region: 'East of England',
        createdAt: validIsoDateTime,
        updatedAt: validIsoDateTime,
      });
      expect(council.type).toBe('county');

      const fact = CouncilFactSchema.parse({
        id: validUlid,
        councilId: council.id,
        key: 'ruralCutsPerYear',
        value: 2,
        sourceUrl: 'https://www.norfolk.gov.uk/roads/grass-cutting',
        sourceRetrievedAt: validIsoDate,
        status: 'verified',
        submittedAt: validIsoDateTime,
      });
      expect(fact.key).toBe('ruralCutsPerYear');
      expect(fact.value).toBe(2);
    });
  });

  describe('IndicatorSpeciesSchema', () => {
    it('parses valid indicator species with kebab-case IDs', () => {
      const indicator = IndicatorSpeciesSchema.parse({
        id: 'centaurea-nigra',
        commonName: 'Common Knapweed',
        scientificName: 'Centaurea nigra',
        group: 'forb',
        weight: 2,
        sensitive: false,
        notes: 'Hard, black-bracted thistle-like purple heads.',
        sourceUrl: 'https://plantatlas2020.org/atlas/2cd4p9h.n8',
        sourceRetrievedAt: validIsoDate,
      });
      expect(indicator.weight).toBe(2);
      expect(indicator.reviewStatus).toBe('needs_expert_review');
    });

    it('rejects invalid non-kebab-case IDs', () => {
      expect(() =>
        IndicatorSpeciesSchema.parse({
          id: 'Common Knapweed',
          commonName: 'Common Knapweed',
          scientificName: 'Centaurea nigra',
          group: 'forb',
          weight: 2,
          notes: '',
          sourceUrl: 'https://plantatlas2020.org/',
          sourceRetrievedAt: validIsoDate,
        }),
      ).toThrow();
    });
  });

  describe('RegimeGuidanceSchema', () => {
    it('parses valid guidance for standard regimes', () => {
      const regime = RegimeGuidanceSchema.parse({
        id: 'RA',
        name: 'Meadow pattern A',
        months: 'Mid-July to September and October to December',
        description: 'Replicates traditional hay meadow management.',
        conditions: 'Rural, 2+ cuts per year possible',
        sourceUrls: ['https://www.plantlife.org.uk/'],
        sourceRetrievedAt: validIsoDate,
      });
      expect(regime.id).toBe('RA');
    });
  });

  describe('SimulationParamsSchema', () => {
    it('parses valid simulation inputs', () => {
      const sim = SimulationParamsSchema.parse({
        currentCuts: [
          { month: 5, safetyCritical: false },
          { month: 9, safetyCritical: false },
        ],
        tier: 'promising',
        cuttingsRemovable: 'yes',
        cutsToRemove: 1,
      });
      expect(sim.cutsToRemove).toBe(1);
    });
  });

  describe('ImpactCountersSchema', () => {
    it('parses valid impact counter values', () => {
      const counter = ImpactCountersSchema.parse({
        key: 'kmSurveyed',
        value: 125,
        updatedAt: validIsoDateTime,
      });
      expect(counter.value).toBe(125);
    });
  });
});

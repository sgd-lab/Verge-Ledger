import { describe, it, expect } from 'vitest';
import {
  exportToGeoJson,
  exportToCsv,
  escapeCsvField,
  CSV_HEADERS,
  SCO_4_DISCLAIMER,
  type VergeSegment,
  type SurveyObservation,
  type IndicatorSpecies,
} from '../src/index.js';

describe('GeoJSON & CSV Export Helpers', () => {
  const sampleIndicators: IndicatorSpecies[] = [
    {
      id: 'centaurea-nigra',
      commonName: 'Common Knapweed',
      scientificName: 'Centaurea nigra',
      group: 'forb',
      weight: 2,
      sensitive: false,
      notes: 'Unimproved meadow indicator',
      sourceUrl: 'https://plantatlas2020.org/atlas/2cd4p9h.n8',
      sourceRetrievedAt: '2026-10-31',
      reviewStatus: 'needs_expert_review',
    },
    {
      id: 'lotus-corniculatus',
      commonName: "Bird's-foot Trefoil",
      scientificName: 'Lotus corniculatus',
      group: 'legume',
      weight: 1,
      sensitive: false,
      notes: 'Larval foodplant',
      sourceUrl: 'https://plantatlas2020.org/atlas/2cd4p9h.26y',
      sourceRetrievedAt: '2026-10-31',
      reviewStatus: 'needs_expert_review',
    },
    {
      id: 'ophrys-apifera',
      commonName: 'Bee Orchid',
      scientificName: 'Ophrys apifera',
      group: 'orchid',
      weight: 3,
      sensitive: true,
      notes: 'Wild orchid subject to protection',
      sourceUrl: 'https://plantatlas2020.org/atlas/2cd4p9h.12v',
      sourceRetrievedAt: '2026-10-31',
      reviewStatus: 'needs_expert_review',
    },
    {
      id: 'urtica-dioica',
      commonName: 'Stinging Nettle',
      scientificName: 'Urtica dioica',
      group: 'nutrient_enrichment',
      weight: 0,
      sensitive: false,
      notes: 'Nitrogen indicator',
      sourceUrl: 'https://plantatlas2020.org/atlas/2cd4p9h.209',
      sourceRetrievedAt: '2026-10-31',
      reviewStatus: 'needs_expert_review',
    },
  ];

  const ordinarySegment: VergeSegment = {
    id: '01JBC000000000000000000001',
    workspaceId: '01JBC000000000000000000000',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-0.12813, 51.50805],
        [-0.12854, 51.50892],
      ],
    },
    lengthM: 100,
    roadClass: 'B',
    setting: 'rural',
    widthBand: '1_5_to_3',
    side: 'left',
    roadName: 'High Street',
    createdAt: '2026-10-31T10:00:00Z',
    updatedAt: '2026-10-31T10:00:00Z',
    deletedAt: null,
    isDemo: false,
  };

  const ordinaryObservation: SurveyObservation = {
    id: '01JBC000000000000000000011',
    segmentId: ordinarySegment.id,
    observedAt: '2026-06-15T11:00:00Z',
    forbCountBand: '6_9',
    indicatorIds: ['centaurea-nigra', 'lotus-corniculatus'],
    nutrientDominantIds: [],
    swardStructure: 'medium_mixed',
    cutState: 'uncut',
    cuttingsState: 'na',
    lastCutMonth: 8,
    cutsPerYear: 1,
    notes: 'Well-managed rural roadside with knapweed blooming.',
    photoIds: [],
    scoringVersion: 'verge-triage-v1',
    scoreResult: null,
    createdAt: '2026-06-15T11:00:00Z',
    updatedAt: '2026-06-15T11:00:00Z',
    deletedAt: null,
    isDemo: false,
  };

  const sensitiveSegment: VergeSegment = {
    id: '01JBC000000000000000000002',
    workspaceId: '01JBC000000000000000000000',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-1.25774, 51.75204],
        [-1.25852, 51.75298],
      ],
    },
    lengthM: 120,
    roadClass: 'C',
    setting: 'rural',
    widthBand: 'gt3',
    side: 'both',
    roadName: 'Meadow Way',
    createdAt: '2026-10-31T10:00:00Z',
    updatedAt: '2026-10-31T10:00:00Z',
    deletedAt: null,
    isDemo: false,
  };

  const sensitiveObservation: SurveyObservation = {
    id: '01JBC000000000000000000012',
    segmentId: sensitiveSegment.id,
    observedAt: '2026-06-20T14:30:00Z',
    forbCountBand: '10_14',
    indicatorIds: ['ophrys-apifera', 'centaurea-nigra'],
    nutrientDominantIds: ['urtica-dioica'],
    swardStructure: 'medium_mixed',
    cutState: 'uncut',
    cuttingsState: 'na',
    lastCutMonth: 9,
    cutsPerYear: 1,
    notes: 'Bee orchid colony found! Do not disclose exact coordinates.',
    photoIds: [],
    scoringVersion: 'verge-triage-v1',
    scoreResult: null,
    createdAt: '2026-06-20T14:30:00Z',
    updatedAt: '2026-06-20T14:30:00Z',
    deletedAt: null,
    isDemo: false,
  };

  const demoSegment: VergeSegment = {
    id: '01JBC000000000000000000003',
    workspaceId: '01JBC000000000000000000000',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-0.1, 51.5],
        [-0.1, 51.51],
      ],
    },
    lengthM: 111,
    roadClass: 'A',
    setting: 'urban',
    widthBand: 'lt1_5',
    side: 'right',
    roadName: 'Demo Ring Road',
    createdAt: '2026-10-31T10:00:00Z',
    updatedAt: '2026-10-31T10:00:00Z',
    deletedAt: null,
    isDemo: true,
  };

  describe('EXP-1: GeoJSON RFC 7946 Compliance', () => {
    it('creates a valid FeatureCollection with LineString features', () => {
      const geojson = exportToGeoJson([ordinarySegment], [ordinaryObservation], sampleIndicators);

      expect(geojson.type).toBe('FeatureCollection');
      expect(geojson.features.length).toBe(1);

      const f = geojson.features[0]!;
      expect(f.type).toBe('Feature');
      expect(f.geometry.type).toBe('LineString');
      expect(f.geometry.coordinates).toEqual(ordinarySegment.geometry.coordinates);

      expect(f.properties.segmentId).toBe(ordinarySegment.id);
      expect(f.properties.roadName).toBe('High Street');
      expect(f.properties.roadClass).toBe('B');
      expect(f.properties.hasSensitiveTaxa).toBe(false);
      expect(f.properties.isCoarsened).toBe(false);
      expect(f.properties.disclaimer).toBe(SCO_4_DISCLAIMER);
      expect(f.properties.indicatorSpecies).toContain('Common Knapweed');
    });

    it('filters out demo segments by default and includes them when requested', () => {
      const withoutDemo = exportToGeoJson(
        [ordinarySegment, demoSegment],
        [ordinaryObservation],
        sampleIndicators,
        { includeDemo: false },
      );
      expect(withoutDemo.features.length).toBe(1);
      expect(withoutDemo.features[0]!.properties.segmentId).toBe(ordinarySegment.id);

      const withDemo = exportToGeoJson(
        [ordinarySegment, demoSegment],
        [ordinaryObservation],
        sampleIndicators,
        { includeDemo: true },
      );
      expect(withDemo.features.length).toBe(2);
    });
  });

  describe('EXP-2: Sensitive Taxa Coarsening in GeoJSON', () => {
    it('coarsens LineString coordinates to 2 decimal places for sensitive taxa', () => {
      const geojson = exportToGeoJson(
        [sensitiveSegment],
        [sensitiveObservation],
        sampleIndicators,
        { coarsenSensitive: true },
      );

      const f = geojson.features[0]!;
      expect(f.properties.hasSensitiveTaxa).toBe(true);
      expect(f.properties.isCoarsened).toBe(true);

      // Raw was [-1.25774, 51.75204] -> rounded to 2 decimals is [-1.26, 51.75]
      const coords = f.geometry.coordinates;
      expect(coords[0]![0]).toBe(-1.26);
      expect(coords[0]![1]).toBe(51.75);
    });

    it('preserves full coordinate precision when coarsenSensitive is false', () => {
      const geojson = exportToGeoJson(
        [sensitiveSegment],
        [sensitiveObservation],
        sampleIndicators,
        { coarsenSensitive: false },
      );

      const f = geojson.features[0]!;
      expect(f.properties.hasSensitiveTaxa).toBe(true);
      expect(f.properties.isCoarsened).toBe(false);
      expect(f.geometry.coordinates).toEqual(sensitiveSegment.geometry.coordinates);
    });
  });

  describe('EXP-3: RFC 4180 CSV Generation', () => {
    it('generates standard CSV with CRLF line endings and 30-column header row', () => {
      const csv = exportToCsv(
        [ordinarySegment, sensitiveSegment],
        [ordinaryObservation, sensitiveObservation],
        sampleIndicators,
      );

      expect(csv.includes('\r\n')).toBe(true);
      const lines = csv.split('\r\n').filter(Boolean);
      expect(lines.length).toBe(3); // 1 header + 2 data rows

      const header = lines[0]!;
      expect(header).toBe(CSV_HEADERS.join(','));

      // Check ordinary row
      const ordinaryLine = lines[1]!;
      expect(ordinaryLine).toContain(ordinarySegment.id);
      expect(ordinaryLine).toContain('High Street');
      expect(ordinaryLine).toContain('false'); // sensitive_taxa_recorded

      // Check sensitive row
      const sensitiveLine = lines[2]!;
      expect(sensitiveLine).toContain(sensitiveSegment.id);
      expect(sensitiveLine).toContain('true'); // sensitive_taxa_recorded
      expect(sensitiveLine).toContain('SP5106'); // OS Grid Ref for Oxford
    });

    it('escapes notes containing commas, quotes, and newlines per RFC 4180', () => {
      const trickyObs: SurveyObservation = {
        ...ordinaryObservation,
        notes: 'Notes with, comma, "quotes", and\nnewline.',
      };

      const csv = exportToCsv([ordinarySegment], [trickyObs], sampleIndicators);

      expect(csv).toContain('"Notes with, comma, ""quotes"", and\nnewline."');
    });
  });

  describe('EXP-4: escapeCsvField helper', () => {
    it('handles null and undefined', () => {
      expect(escapeCsvField(null)).toBe('');
      expect(escapeCsvField(undefined)).toBe('');
    });

    it('returns clean strings unchanged', () => {
      expect(escapeCsvField('hello_world')).toBe('hello_world');
      expect(escapeCsvField(12345)).toBe('12345');
    });

    it('escapes strings with commas, double quotes, and line breaks', () => {
      expect(escapeCsvField('a,b')).toBe('"a,b"');
      expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
      expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
      expect(escapeCsvField('line1\r\nline2')).toBe('"line1\r\nline2"');
    });
  });
});

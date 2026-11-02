import { describe, it, expect } from 'vitest';
import { SCO_4_DISCLAIMER, type VergeSegment } from '@verge-ledger/core';
import { INDICATOR_SPECIES } from '@verge-ledger/data';
import { generateUlid } from './id';
import {
  buildEvidencePack,
  isDemoSelection,
  parseCsvImport,
  parseGeoJsonImport,
} from './importExport';

const WORKSPACE_ID = generateUlid();

function geoJsonText(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[-1.5, 52.5], [-1.499, 52.501]] },
        properties: {
          segmentId: generateUlid(),
          workspaceId: WORKSPACE_ID,
          lengthM: 100,
          roadClass: 'C',
          setting: 'rural',
          widthBand: '1_5_to_3',
          side: 'left',
          roadName: 'Church Lane',
          isDemo: false,
          ...overrides,
        },
      },
    ],
  });
}

describe('parseGeoJsonImport', () => {
  it('validates a segment feature against VergeSegmentSchema', () => {
    const parsed = parseGeoJsonImport(geoJsonText(), {
      fallbackWorkspaceId: WORKSPACE_ID,
      indicators: INDICATOR_SPECIES,
    });
    expect(parsed.errors).toEqual([]);
    expect(parsed.segments).toHaveLength(1);
    expect(parsed.segments[0]?.roadName).toBe('Church Lane');
  });

  it('preserves the isDemo flag and reports the failing row', () => {
    const parsed = parseGeoJsonImport(geoJsonText({ isDemo: true, lengthM: 99999 }), {
      fallbackWorkspaceId: WORKSPACE_ID,
      indicators: INDICATOR_SPECIES,
    });
    expect(parsed.segments).toHaveLength(0);
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0]?.row).toBe('GeoJSON feature 1');
    expect(parsed.errors[0]?.message).toContain('lengthM');
  });

  it('imports a flat exported observation alongside its segment', () => {
    const parsed = parseGeoJsonImport(
      geoJsonText({
        observedAt: '2026-05-01T10:00:00.000Z',
        forbCountBand: '3_5',
        indicatorSpecies: 'Common Knapweed',
        nutrientDominants: '',
        swardStructure: 'medium_mixed',
        cutState: 'unknown',
        cuttingsState: 'removed',
        lastCutMonth: null,
        notes: null,
      }),
      { fallbackWorkspaceId: WORKSPACE_ID, indicators: INDICATOR_SPECIES },
    );
    expect(parsed.errors).toEqual([]);
    expect(parsed.observations).toHaveLength(1);
    expect(parsed.observations[0]?.indicatorIds).toEqual(['centaurea-nigra']);
    expect(parsed.observations[0]?.segmentId).toBe(parsed.segments[0]?.id);
  });

  it('rejects non-FeatureCollection input as a file-level error', () => {
    const parsed = parseGeoJsonImport('{"type":"Point"}', {
      fallbackWorkspaceId: WORKSPACE_ID,
      indicators: INDICATOR_SPECIES,
    });
    expect(parsed.segments).toHaveLength(0);
    expect(parsed.errors[0]?.row).toBe('File');
  });
});

describe('parseCsvImport', () => {
  const headers =
    'segment_id,workspace_id,road_name,road_class,setting,verge_width_band,side_of_road,length_metres,start_latitude,start_longitude,end_latitude,end_longitude,os_grid_reference_1km,survey_date,forb_count_band,indicator_species,nutrient_dominants,sward_structure,cut_state,cuttings_state,last_cut_month,triage_score,tier,confidence,management_flags,sensitive_taxa_recorded,coordinates_coarsened,notes,is_demo,disclaimer';
  const row = [
    generateUlid(), WORKSPACE_ID, 'Church Lane', 'C', 'rural', '1_5_to_3', 'left', '100',
    '52.5', '-1.5', '52.501', '-1.499', '', '2026-05-01T10:00:00.000Z', '3_5',
    'Common Knapweed', '', 'medium_mixed', 'unknown', 'removed', '', '', '', '', '', 'false',
    'false', '', 'true', '',
  ].join(',');

  it('validates a segment row and its observation, preserving isDemo', () => {
    const parsed = parseCsvImport(`${headers}\n${row}`, {
      fallbackWorkspaceId: WORKSPACE_ID,
      indicators: INDICATOR_SPECIES,
    });
    expect(parsed.errors).toEqual([]);
    expect(parsed.segments).toHaveLength(1);
    expect(parsed.segments[0]?.isDemo).toBe(true);
    expect(parsed.observations).toHaveLength(1);
    expect(parsed.observations[0]?.forbCountBand).toBe('3_5');
  });

  it('reports the failing CSV row number and reason, and keeps valid rows', () => {
    const badRow = row.replace(',C,rural,', ',Z,rural,');
    const parsed = parseCsvImport(`${headers}\n${row}\n${badRow}`, {
      fallbackWorkspaceId: WORKSPACE_ID,
      indicators: INDICATOR_SPECIES,
    });
    expect(parsed.segments).toHaveLength(1);
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0]?.row).toBe('CSV row 3');
    expect(parsed.errors[0]?.message).toContain('roadClass');
  });
});

describe('isDemoSelection', () => {
  it('is demo when the workspace is demo or every segment is demo', () => {
    const segment = (isDemo: boolean): VergeSegment => ({
      id: generateUlid(),
      workspaceId: WORKSPACE_ID,
      geometry: { type: 'LineString', coordinates: [[-1.5, 52.5], [-1.499, 52.501]] },
      lengthM: 100,
      roadClass: 'C',
      setting: 'rural',
      widthBand: '1_5_to_3',
      side: 'left',
      roadName: null,
      createdAt: '2026-05-01T10:00:00.000Z',
      updatedAt: '2026-05-01T10:00:00.000Z',
      deletedAt: null,
      isDemo,
    });
    expect(
      isDemoSelection(
        [{ id: WORKSPACE_ID, name: 'Demo', createdAt: '', updatedAt: '', isDemo: true, serverId: null, syncEnabled: false }],
        [segment(false)],
      ),
    ).toBe(true);
    expect(isDemoSelection([], [segment(true), segment(true)])).toBe(true);
    expect(isDemoSelection([], [segment(true), segment(false)])).toBe(false);
  });
});

describe('buildEvidencePack', () => {
  it('contains the exact SCO-4 disclaimer, council sources and a demo watermark for demo packs', () => {
    const pack = buildEvidencePack({
      segments: [],
      observations: [],
      indicators: INDICATOR_SPECIES,
      councilFacts: [
        {
          id: generateUlid(),
          councilId: 'example-county',
          authorityName: 'Example County Council',
          tier: 'county',
          policyType: 'rural',
          lastVerifiedAt: '2026-05-01',
          key: 'ruralCutsPerYear',
          value: 2,
          sourceUrl: 'https://example.org/verges',
          sourceRetrievedAt: '2026-05-01',
          status: 'unverified',
        },
      ],
      isDemo: true,
      simulatorText: null,
    });
    expect(pack.isDemo).toBe(true);
    expect(pack.markdown).toContain(SCO_4_DISCLAIMER);
    expect(pack.html).toContain(SCO_4_DISCLAIMER);
    expect(pack.html).toContain('DEMO — NOT A REAL EVIDENCE PACK');
    expect(pack.markdown).toContain('https://example.org/verges');
    expect(pack.markdown).toContain('Contact:');
    expect(pack.markdown).toContain('Simulator output');
  });
});

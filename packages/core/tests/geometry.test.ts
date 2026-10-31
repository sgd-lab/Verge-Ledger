import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  calculateLineStringLength,
  validateSegmentLength,
  clampSegmentLength,
  coarsenPosition,
  coarsenLineString,
  latLngToOsGridRef1km,
  type Position,
} from '../src/index.js';

describe('Geometry & Sensitive Taxa Protection', () => {
  describe('GEO-1: Haversine distance accuracy', () => {
    it('calculates meridian displacement with high accuracy (<0.05% error)', () => {
      // At latitude 51.508, 1 degree latitude is approx 111,250 m
      // A displacement of 0.001 deg lat is approx 111.19 m
      const p1: Position = [-0.1281, 51.508];
      const p2: Position = [-0.1281, 51.509];

      const dist = haversineDistance(p1, p2);
      expect(dist).toBeGreaterThan(110);
      expect(dist).toBeLessThan(112);
      // Expected spherical distance: 6371000 * (0.001 * pi / 180) = 111.1949 m
      expect(Math.abs(dist - 111.195) / 111.195).toBeLessThan(0.0005);
    });

    it('calculates parallel displacement with high accuracy', () => {
      // At latitude 52.0, 0.001 deg lon is approx 68.46 m
      const p1: Position = [-1.0, 52.0];
      const p2: Position = [-0.999, 52.0];

      const dist = haversineDistance(p1, p2);
      expect(dist).toBeGreaterThan(68);
      expect(dist).toBeLessThan(69);
      // Expected spherical: 6371000 * cos(52°) * (0.001 * pi / 180) = 68.459 m
      expect(Math.abs(dist - 68.459) / 68.459).toBeLessThan(0.002);
    });

    it('returns 0 for identical coordinates', () => {
      const p1: Position = [-0.1281, 51.508];
      expect(haversineDistance(p1, p1)).toBe(0);
    });
  });

  describe('GEO-2: LineString length calculation', () => {
    it('returns 0 for empty or single-point LineStrings', () => {
      expect(calculateLineStringLength([])).toBe(0);
      expect(calculateLineStringLength([[-0.1281, 51.508]])).toBe(0);
    });

    it('sums consecutive segment distances accurately', () => {
      const coords: Position[] = [
        [-0.1281, 51.508],
        [-0.1281, 51.509],
        [-0.1271, 51.509],
      ];

      const total = calculateLineStringLength(coords);
      const seg1 = haversineDistance(coords[0]!, coords[1]!);
      const seg2 = haversineDistance(coords[1]!, coords[2]!);

      expect(total).toBeCloseTo(seg1 + seg2, 5);
      expect(total).toBeGreaterThan(170);
    });
  });

  describe('GEO-3: Segment length bounds validation and clamping (SUR-1)', () => {
    it('rejects segments shorter than 5 metres with explanatory message', () => {
      const result = validateSegmentLength(4.2);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('is shorter than minimum allowed (5 m)');
      expect(result.error).toContain('requires at least a 10 m representative sample');
    });

    it('rejects segments longer than 500 metres with explanatory message', () => {
      const result = validateSegmentLength(505.0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed (500 m)');
      expect(result.error).toContain('Please split long verges into separate segments');
    });

    it('accepts segments between 5 and 500 metres', () => {
      expect(validateSegmentLength(5.0).valid).toBe(true);
      expect(validateSegmentLength(50.0).valid).toBe(true);
      expect(validateSegmentLength(500.0).valid).toBe(true);
    });

    it('clamps values correctly to [5, 500]', () => {
      expect(clampSegmentLength(2)).toBe(5);
      expect(clampSegmentLength(600)).toBe(500);
      expect(clampSegmentLength(150)).toBe(150);
    });
  });

  describe('GEO-4: Sensitive taxa coordinate coarsening', () => {
    it('rounds WGS84 coordinates to 2 decimal places (~1 km grid blur)', () => {
      const original: Position = [-0.12813, 51.50805];
      const coarsened = coarsenPosition(original, 2);
      expect(coarsened[0]).toBe(-0.13);
      expect(coarsened[1]).toBe(51.51);
    });

    it('coarsens LineString and deduplicates adjacent collapsed vertices', () => {
      const coords: Position[] = [
        [-0.1281, 51.508],
        [-0.1282, 51.5081], // Rounds to [-0.13, 51.51] (same as first)
        [-0.139, 51.52], // Rounds to [-0.14, 51.52] (distinct)
      ];

      const coarsened = coarsenLineString(coords, 2);
      expect(coarsened.length).toBe(2);
      expect(coarsened[0]).toEqual([-0.13, 51.51]);
      expect(coarsened[1]).toEqual([-0.14, 51.52]);
    });

    it('preserves LineString validity (minimum 2 points) even if all points collapse', () => {
      const coords: Position[] = [
        [-0.1281, 51.508],
        [-0.1282, 51.5081],
      ];

      const coarsened = coarsenLineString(coords, 2);
      expect(coarsened.length).toBe(2);
      expect(coarsened[0]).toEqual([-0.13, 51.51]);
      // Second point has micro-offset to preserve RFC 7946 LineString constraint
      expect(coarsened[1]).not.toEqual(coarsened[0]);
    });

    it('handles empty LineString gracefully', () => {
      expect(coarsenLineString([])).toEqual([]);
    });
  });

  describe('GEO-5: OSGB36 1km Grid Reference calculation', () => {
    it('converts London Trafalgar Square to TQ3080', () => {
      const ref = latLngToOsGridRef1km(51.508, -0.1281);
      expect(ref).toBe('TQ3080');
    });

    it('converts Oxford Carfax to SP5106', () => {
      const ref = latLngToOsGridRef1km(51.752, -1.2577);
      expect(ref).toBe('SP5106');
    });

    it('converts Cambridge Market to TL4458', () => {
      const ref = latLngToOsGridRef1km(52.2053, 0.1192);
      expect(ref).toBe('TL4458');
    });

    it('converts Northern England, Scottish Highlands, and coastal points correctly', () => {
      // Newcastle upon Tyne (NZ square, n100k between 5 and 10, e100k < 5)
      const newcastle = latLngToOsGridRef1km(54.9783, -1.6178);
      expect(newcastle.startsWith('NZ')).toBe(true);

      // Inverness, Scottish Highlands (NH square, n100k >= 10)
      const inverness = latLngToOsGridRef1km(57.4778, -4.2247);
      expect(inverness.startsWith('NH')).toBe(true);

      // Scilly Isles (SV square, l2Index < 8)
      const scilly = latLngToOsGridRef1km(49.914, -6.315);
      expect(scilly.startsWith('SV')).toBe(true);
    });

    it('returns OUT_OF_BOUNDS for coordinates outside the British National Grid', () => {
      expect(latLngToOsGridRef1km(0, 0)).toBe('OUT_OF_BOUNDS');
      expect(latLngToOsGridRef1km(80, 100)).toBe('OUT_OF_BOUNDS');
    });
  });
});

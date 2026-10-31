import type { Position } from '../schemas/index.js';

export const EARTH_RADIUS_METRES = 6371000;
export const MIN_SEGMENT_LENGTH_METRES = 5;
export const MAX_SEGMENT_LENGTH_METRES = 500;

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates great-circle distance between two WGS84 positions in metres.
 * Coordinates are passed as [longitude, latitude].
 */
export function haversineDistance(coord1: Position, coord2: Position): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METRES * c;
}

/**
 * Calculates cumulative length of a GeoJSON LineString coordinates array in metres.
 */
export function calculateLineStringLength(coordinates: Position[]): number {
  if (!coordinates || coordinates.length < 2) {
    return 0;
  }
  let totalM = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const pt1 = coordinates[i];
    const pt2 = coordinates[i + 1];
    if (pt1 && pt2) {
      totalM += haversineDistance(pt1, pt2);
    }
  }
  return totalM;
}

/**
 * Validates segment length against SUR-1 boundaries (5 m to 500 m).
 */
export function validateSegmentLength(lengthM: number): {
  valid: boolean;
  error?: string;
} {
  if (lengthM < MIN_SEGMENT_LENGTH_METRES) {
    return {
      valid: false,
      error: `Verge segment length (${lengthM.toFixed(1)} m) is shorter than minimum allowed (${MIN_SEGMENT_LENGTH_METRES} m). Survey protocol requires at least a 10 m representative sample.`,
    };
  }
  if (lengthM > MAX_SEGMENT_LENGTH_METRES) {
    return {
      valid: false,
      error: `Verge segment length (${lengthM.toFixed(1)} m) exceeds maximum allowed (${MAX_SEGMENT_LENGTH_METRES} m). Please split long verges into separate segments.`,
    };
  }
  return { valid: true };
}

/**
 * Clamps length to boundary window [5, 500].
 */
export function clampSegmentLength(lengthM: number): number {
  return Math.max(MIN_SEGMENT_LENGTH_METRES, Math.min(MAX_SEGMENT_LENGTH_METRES, lengthM));
}

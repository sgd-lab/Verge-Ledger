import type { Position } from '../schemas/index.js';

/**
 * Coarsens a WGS84 coordinate pair [lon, lat] to 2 decimal places (~1 km grid).
 */
export function coarsenPosition(coord: Position, decimals = 2): Position {
  const factor = Math.pow(10, decimals);
  const lon = Math.round(coord[0] * factor) / factor;
  const lat = Math.round(coord[1] * factor) / factor;
  return [lon, lat];
}

/**
 * Coarsens a LineString coordinates array for sensitive taxa.
 * Preserves LineString integrity (at least 2 distinct positions) and deduplicates adjacent collapsed vertices.
 */
export function coarsenLineString(coordinates: Position[], decimals = 2): Position[] {
  if (!coordinates || coordinates.length === 0) {
    return [];
  }
  const coarsened: Position[] = [];

  for (const pt of coordinates) {
    const c = coarsenPosition(pt, decimals);
    const last = coarsened[coarsened.length - 1];
    if (!last || last[0] !== c[0] || last[1] !== c[1]) {
      coarsened.push(c);
    }
  }

  // RFC 7946 LineString constraint: Must have at least 2 positions
  if (coarsened.length === 1) {
    const first = coarsened[0];
    if (first) {
      const [cLon, cLat] = first;
      // Offset second point by 0.001 degrees (~70 m) to ensure valid 2-point geometry
      coarsened.push([
        Math.round((cLon + 0.001) * 1000) / 1000,
        Math.round((cLat + 0.001) * 1000) / 1000,
      ]);
    }
  }

  return coarsened;
}

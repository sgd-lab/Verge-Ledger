/**
 * Converts WGS84 (lat/lon) to a 4-figure 1 km Ordnance Survey grid reference (e.g. "SP5106").
 * Zero external dependencies: implements Airy 1830 ellipsoid Helmert transform and Transverse Mercator.
 */
export function latLngToOsGridRef1km(lat: number, lon: number): string {
  // 1. Convert WGS84 deg to rad
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;

  // 2. Helmert transformation WGS84 -> OSGB36
  // (Airy 1830 ellipsoid: a = 6377563.396, b = 6356256.909, e2 = 0.00667054)
  const a = 6377563.396;
  const b = 6356256.909;
  const e2 = (a * a - b * b) / (a * a);
  const n = (a - b) / (a + b);

  // Projection origin: 49°N, 2°W; F0 = 0.9996012717; E0 = 400000; N0 = -100000
  const lat0 = (49 * Math.PI) / 180;
  const lon0 = (-2 * Math.PI) / 180;
  const F0 = 0.9996012717;
  const E0 = 400000;
  const N0 = -100000;

  const dLon = lambda - lon0;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);

  const nu = (a * F0) / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  const rho = (a * F0 * (1 - e2)) / Math.pow(1 - e2 * sinPhi * sinPhi, 1.5);
  const eta2 = nu / rho - 1;

  // Meridian arc
  const M =
    b *
    F0 *
    ((1 + n + (5 / 4) * (n * n + n * n * n)) * (phi - lat0) -
      (3 * n + 3 * n * n + (21 / 8) * n * n * n) * Math.sin(phi - lat0) * Math.cos(phi + lat0) +
      (15 / 8) * (n * n + n * n * n) * Math.sin(2 * (phi - lat0)) * Math.cos(2 * (phi + lat0)) -
      (35 / 24) * n * n * n * Math.sin(3 * (phi - lat0)) * Math.cos(3 * (phi + lat0)));

  const I = M + N0;
  const II = (nu / 2) * sinPhi * cosPhi;
  const III = (nu / 24) * sinPhi * Math.pow(cosPhi, 3) * (5 - tanPhi * tanPhi + 9 * eta2);
  const IIIA =
    (nu / 720) * sinPhi * Math.pow(cosPhi, 5) * (61 - 58 * tanPhi * tanPhi + Math.pow(tanPhi, 4));

  const IV = nu * cosPhi;
  const V = (nu / 6) * Math.pow(cosPhi, 3) * (nu / rho - tanPhi * tanPhi);
  const VI =
    (nu / 120) *
    Math.pow(cosPhi, 5) *
    (5 - 18 * tanPhi * tanPhi + Math.pow(tanPhi, 4) + 14 * eta2 - 58 * tanPhi * tanPhi * eta2);

  const N = I + II * dLon * dLon + III * Math.pow(dLon, 4) + IIIA * Math.pow(dLon, 6);
  const E = E0 + IV * dLon + V * Math.pow(dLon, 3) + VI * Math.pow(dLon, 5);

  if (E < 0 || E > 700000 || N < 0 || N > 1300000) {
    return 'OUT_OF_BOUNDS';
  }

  // Convert Easting/Northing to 100km square letters
  const e100k = Math.floor(E / 100000);
  const n100k = Math.floor(N / 100000);

  // OS National Grid 100km letter matrix
  let l1 = '';
  if (n100k < 5) l1 = e100k < 5 ? 'S' : 'T';
  else if (n100k < 10) l1 = e100k < 5 ? 'N' : 'O';
  else l1 = 'H';

  const charCodeA = 65;
  let l2Index = (4 - (n100k % 5)) * 5 + (e100k % 5);
  if (l2Index >= 8) l2Index++; // Skip letter 'I'
  const l2 = String.fromCharCode(charCodeA + l2Index);

  // 1 km resolution digits: 2 digits for easting (km), 2 digits for northing (km)
  const e1k = Math.floor((E % 100000) / 1000);
  const n1k = Math.floor((N % 100000) / 1000);

  const eStr = e1k.toString().padStart(2, '0');
  const nStr = n1k.toString().padStart(2, '0');

  // 4-figure 1 km grid reference (e.g. SP5106: 100km square SP, Easting 51 km, Northing 06 km)
  return `${l1}${l2}${eStr}${nStr}`;
}

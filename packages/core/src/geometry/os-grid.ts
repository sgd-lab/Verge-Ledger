/**
 * Converts WGS84 (lat/lon) to a 4-figure 1 km Ordnance Survey grid reference (e.g. "TQ3080").
 * Zero external dependencies: implements GRS80 -> Airy 1830 7-parameter Helmert transform
 * and Transverse Mercator projection.
 */
export function latLngToOsGridRef1km(lat: number, lon: number): string {
  // 1. Convert WGS84 deg to rad
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;

  // 2. Convert WGS84 / GRS80 geodetic to 3D Cartesian coordinates (h = 0)
  const a_w = 6378137.0;
  const b_w = 6356752.314245;
  const e2_w = (a_w * a_w - b_w * b_w) / (a_w * a_w);

  const nu_w = a_w / Math.sqrt(1 - e2_w * Math.sin(phi) * Math.sin(phi));
  const X = nu_w * Math.cos(phi) * Math.cos(lambda);
  const Y = nu_w * Math.cos(phi) * Math.sin(lambda);
  const Z = nu_w * (1 - e2_w) * Math.sin(phi);

  // 3. Official OS 7-parameter Helmert datum transformation (WGS84 -> OSGB36)
  const tx = -446.448;
  const ty = 125.157;
  const tz = -542.06;
  const s = 20.4894e-6;
  const rx = (-0.1502 * Math.PI) / (180 * 3600);
  const ry = (-0.247 * Math.PI) / (180 * 3600);
  const rz = (-0.8421 * Math.PI) / (180 * 3600);

  const X_os = tx + (1 + s) * (X - rz * Y + ry * Z);
  const Y_os = ty + (1 + s) * (rz * X + Y - rx * Z);
  const Z_os = tz + (1 + s) * (-ry * X + rx * Y + Z);

  // 4. Convert 3D Cartesian to geodetic on Airy 1830 ellipsoid
  const a = 6377563.396;
  const b = 6356256.909;
  const e2 = (a * a - b * b) / (a * a);

  const p = Math.sqrt(X_os * X_os + Y_os * Y_os);
  let phi_os = Math.atan2(Z_os, p * (1 - e2));
  for (let i = 0; i < 10; i++) {
    const nu = a / Math.sqrt(1 - e2 * Math.sin(phi_os) * Math.sin(phi_os));
    phi_os = Math.atan2(Z_os + e2 * nu * Math.sin(phi_os), p);
  }
  const lambda_os = Math.atan2(Y_os, X_os);

  // 5. Transverse Mercator Projection to National Grid Easting/Northing
  const n = (a - b) / (a + b);
  const lat0 = (49 * Math.PI) / 180;
  const lon0 = (-2 * Math.PI) / 180;
  const F0 = 0.9996012717;
  const E0 = 400000;
  const N0 = -100000;

  const dLon = lambda_os - lon0;
  const sinPhi = Math.sin(phi_os);
  const cosPhi = Math.cos(phi_os);
  const tanPhi = Math.tan(phi_os);

  const nu = (a * F0) / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  const rho = (a * F0 * (1 - e2)) / Math.pow(1 - e2 * sinPhi * sinPhi, 1.5);
  const eta2 = nu / rho - 1;

  // Meridian arc
  const M =
    b *
    F0 *
    ((1 + n + (5 / 4) * (n * n + n * n * n)) * (phi_os - lat0) -
      (3 * n + 3 * n * n + (21 / 8) * n * n * n) *
        Math.sin(phi_os - lat0) *
        Math.cos(phi_os + lat0) +
      (15 / 8) *
        (n * n + n * n * n) *
        Math.sin(2 * (phi_os - lat0)) *
        Math.cos(2 * (phi_os + lat0)) -
      (35 / 24) * n * n * n * Math.sin(3 * (phi_os - lat0)) * Math.cos(3 * (phi_os + lat0)));

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

  let l1 = '';
  if (n100k < 5) l1 = e100k < 5 ? 'S' : 'T';
  else if (n100k < 10) l1 = e100k < 5 ? 'N' : 'O';
  else l1 = 'H';

  const charCodeA = 65;
  let l2Index = (4 - (n100k % 5)) * 5 + (e100k % 5);
  if (l2Index >= 8) l2Index++; // Skip letter 'I'
  const l2 = String.fromCharCode(charCodeA + l2Index);

  // 1 km resolution digits
  const e1k = Math.floor((E % 100000) / 1000);
  const n1k = Math.floor((N % 100000) / 1000);

  const eStr = e1k.toString().padStart(2, '0');
  const nStr = n1k.toString().padStart(2, '0');

  return `${l1}${l2}${eStr}${nStr}`;
}

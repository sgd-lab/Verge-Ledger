import { randomBytes } from 'node:crypto';

/**
 * Minimal Crockford Base32 ULID generator (26 characters: 10 time + 16 random).
 * Kept dependency-free: the API package does not list `ulid`, and ids only need
 * to satisfy the core UlidSchema (26 Crockford characters), not monotonicity.
 */
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeTime(timeMs: number): string {
  let value = timeMs;
  let out = '';
  for (let i = 0; i < 10; i += 1) {
    out = (CROCKFORD[value % 32] ?? '0') + out;
    value = Math.floor(value / 32);
  }
  return out;
}

export function generateUlid(): string {
  const random = randomBytes(16);
  let out = encodeTime(Date.now());
  for (const byte of random) {
    out += CROCKFORD[byte % 32] ?? '0';
  }
  return out.slice(0, 26);
}

import { monotonicFactory } from 'ulid';

/**
 * Monotonically increasing Crockford Base32 ULID generator.
 * Uses Web Crypto API when available for entropy.
 */
const prng =
  typeof crypto !== 'undefined' && crypto.getRandomValues
    ? () => {
        const buffer = new Uint32Array(1);
        crypto.getRandomValues(buffer);
        const val = buffer[0];
        return val !== undefined ? val / 0xffffffff : Math.random();
      }
    : undefined;

export const generateUlid = monotonicFactory(prng);

/**
 * Validates whether an ID conforms to the 26-char Crockford Base32 ULID specification.
 */
export function isValidUlid(id: string): boolean {
  return /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i.test(id);
}

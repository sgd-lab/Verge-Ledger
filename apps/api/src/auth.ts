import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/** One-time edit key shown only at workspace creation; never stored raw. */
export function generateEditKey(): string {
  return randomBytes(16).toString('base64url');
}

export interface EditKeyHash {
  hash: string;
  salt: string;
}

export function hashEditKey(editKey: string): EditKeyHash {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(editKey, salt, 64).toString('hex');
  return { hash, salt };
}

/** Constant-time comparison of a presented key against a stored scrypt hash. */
export function verifyEditKey(editKey: string, hash: string, salt: string): boolean {
  try {
    const candidate = scryptSync(editKey, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    if (candidate.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

/**
 * Constant-time comparison for the admin key. Both sides are hashed first so
 * differing lengths do not leak through an early length check.
 */
export function verifyAdminKey(presented: string, expected: string): boolean {
  const a = createHash('sha256').update(presented).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

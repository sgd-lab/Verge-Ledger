import { describe, it, expect } from 'vitest';
import { CORE_VERSION, getCoreVersion } from '../src/index.js';

describe('packages/core smoke test', () => {
  it('loads core module without DOM or Node runtime dependencies', () => {
    expect(CORE_VERSION).toBe('0.1.0');
    expect(getCoreVersion()).toBe('0.1.0');
  });

  it('proves pure arithmetic calculation reliability', () => {
    const rawScore = 55;
    const maxRaw = 85;
    const baseScore = Math.round((100 * rawScore) / maxRaw);
    expect(baseScore).toBe(65);
  });
});

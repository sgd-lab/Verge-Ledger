import { describe, it, expect } from 'vitest';
import { getSegmentStyle, VERGE_TIER_STYLES } from '../../src/components/map/map-styles';

describe('Map Styles & Dual-Encoding (WCAG 2.2 Color-Blind Accessibility)', () => {
  it('encodes tiers with distinct colors AND dash patterns', () => {
    // Ordinary: Dotted slate
    expect(VERGE_TIER_STYLES.ordinary.color).toBe('#64748B');
    expect(VERGE_TIER_STYLES.ordinary.dashArray).toBe('2, 6');

    // Promising: Dashed blue
    expect(VERGE_TIER_STYLES.promising.color).toBe('#0284C7');
    expect(VERGE_TIER_STYLES.promising.dashArray).toBe('8, 8');

    // Expert review: Solid gold
    expect(VERGE_TIER_STYLES.expert_review.color).toBe('#D97706');
    expect(VERGE_TIER_STYLES.expert_review.dashArray).toBeUndefined();

    // Demo: Dashed purple
    expect(VERGE_TIER_STYLES.demo.color).toBe('#7C3AED');
    expect(VERGE_TIER_STYLES.demo.dashArray).toBe('4, 4');
  });

  it('correctly applies demo styling when isDemo is true regardless of tier', () => {
    const style = getSegmentStyle(true, 'promising');
    expect(style.color).toBe('#7C3AED');
    expect(style.dashArray).toBe('4, 4');
  });

  it('applies unscored styling when tier is null', () => {
    const style = getSegmentStyle(false, null);
    expect(style.color).toBe('#059669');
  });
});

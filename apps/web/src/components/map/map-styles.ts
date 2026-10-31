import type { PathOptions } from 'leaflet';
import type { ScoreTier } from '@verge-ledger/core';

export interface VergeTierStyle {
  color: string;
  weight: number;
  dashArray?: string;
  opacity: number;
  tierLabel: string;
  badgeClass: string;
  description: string;
}

export const VERGE_TIER_STYLES: Record<ScoreTier | 'unscored' | 'demo', VergeTierStyle> = {
  expert_review: {
    color: '#D97706',
    weight: 4,
    dashArray: undefined,
    opacity: 0.95,
    tierLabel: 'Refer for expert review (Tier 1)',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-500',
    description: 'Solid gold line. High ecological value.',
  },
  promising: {
    color: '#0284C7',
    weight: 4,
    dashArray: '8, 8',
    opacity: 0.95,
    tierLabel: 'Promising verge (Tier 2)',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-500',
    description: 'Dashed blue line. Good forb diversity.',
  },
  ordinary: {
    color: '#64748B',
    weight: 4,
    dashArray: '2, 6',
    opacity: 0.95,
    tierLabel: 'Ordinary verge (Tier 3)',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-400',
    description: 'Dotted slate line. Standard highway management.',
  },
  unscored: {
    color: '#059669',
    weight: 3,
    dashArray: undefined,
    opacity: 0.9,
    tierLabel: 'Unscored / In-progress',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-500',
    description: 'Solid emerald line. New survey in progress.',
  },
  demo: {
    color: '#7C3AED',
    weight: 4,
    dashArray: '4, 4',
    opacity: 0.95,
    tierLabel: 'DEMO DATA (Synthetic)',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-500',
    description: 'Dashed purple line with DEMO watermark.',
  },
};

export function getSegmentStyle(isDemo: boolean, tier?: ScoreTier | null): PathOptions {
  if (isDemo) {
    const s = VERGE_TIER_STYLES.demo;
    return { color: s.color, weight: s.weight, dashArray: s.dashArray, opacity: s.opacity };
  }
  if (!tier) {
    const s = VERGE_TIER_STYLES.unscored;
    return { color: s.color, weight: s.weight, dashArray: s.dashArray, opacity: s.opacity };
  }
  const s = VERGE_TIER_STYLES[tier];
  return { color: s.color, weight: s.weight, dashArray: s.dashArray, opacity: s.opacity };
}

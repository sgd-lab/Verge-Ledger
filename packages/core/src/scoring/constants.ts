export const SCORING_VERSION = 'verge-triage-v1';

export const SCO_4_DISCLAIMER =
  'This is a quick volunteer triage, not an ecological survey or a Local Wildlife Site assessment. Scores use simple rules that have not yet been reviewed by an ecologist. If a verge scores highly or you recorded an orchid, ask your local Wildlife Trust or biological record centre to check it.';

export const FORB_RICHNESS_POINTS: Record<string, number> = {
  '0': 0,
  '1_2': 8,
  '3_5': 18,
  '6_9': 28,
  '10_14': 35,
  '15plus': 40,
};

export const SWARD_STRUCTURE_POINTS: Record<string, number> = {
  medium_mixed: 15,
  short_uniform: 8,
  tall_rank: 3,
};

export const MANAGEMENT_FLAGS = {
  CUTTINGS_LEFT: 'CUTTINGS_LEFT',
  MAY_JUNE_CUT: 'MAY_JUNE_CUT',
  RANK_GROWTH: 'RANK_GROWTH',
  NO_FLAGS: 'NO_FLAGS',
  ORCHID_RECORDED: 'ORCHID_RECORDED',
} as const;

export const MANAGEMENT_FLAG_MESSAGES: Record<string, string> = {
  CUTTINGS_LEFT: 'Cuttings left on the verge return nutrients and favour coarse grasses.',
  MAY_JUNE_CUT:
    'Guidance suggests early summer cuts reduce flowering and seed set where the aim is wildflowers.',
  RANK_GROWTH: 'Long-uncut or uncollected rank swards can form thatch and reduce diversity.',
  NO_FLAGS: 'No management flags triggered.',
  ORCHID_RECORDED: 'Orchid recorded: refer to local Wildlife Trust.',
};

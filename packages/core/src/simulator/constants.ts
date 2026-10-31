export const SIMULATOR_VERSION = 'verge-simulator-v1';

export const SIMULATOR_DISCLAIMER =
  'This ranks options against published wildflower-verge guidance. It does not assess road safety. Visibility cuts stay.';

/**
 * 12-Month Biodiversity Alignment Scale.
 * 0 = Worst time to cut (destructive to wildflowers, best cut to drop!)
 * 1 = Low alignment (moderate impact)
 * 2 = Good alignment (early grass suppression or late tidy)
 * 3 = Peak meadow window (seed-set and flowering, preserve at all costs!)
 */
export const MONTH_ALIGNMENT_SCALE: Record<number, number> = {
  1: 1, // January
  2: 2, // February (fits Pattern B early cut)
  3: 2, // March (fits Pattern B early cut)
  4: 1, // April (spring growth)
  5: 0, // May (worst time: cuts flowers before blooming/seed-set)
  6: 1, // June (reduces seed-set)
  7: 2, // July (mid-July onward fits meadow cut)
  8: 3, // August (core meadow cut window, peak value!)
  9: 3, // September (core meadow cut window, peak value!)
  10: 2, // October (tidy cut post-flowering)
  11: 2, // November (late tidy cut)
  12: 2, // December (winter tidy)
};

export const MONTH_NAMES: Record<number, string> = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
};

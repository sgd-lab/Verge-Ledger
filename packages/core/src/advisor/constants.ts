import type {
  CutterHeightGuidance,
  RefugeGuidance,
  RegimeRecommendation,
  SafetyOverlay,
} from './types.js';

export const ADVICE_VERSION = 'verge-advice-v1';

export const SAFETY_DISCLAIMER =
  'Highway safety rules take priority. Agree any change with your highway authority. Visibility splays and sightlines must be maintained at all times.';

export const SAFETY_OVERLAY: SafetyOverlay = {
  swatheWidthMeters: 1.2,
  description:
    'Maintain a 1 working width swathe (~1.0–1.2 m) along the immediate road edge on rural roads.',
  junctionsAndBendsNote:
    'Visibility splays at junctions and forward sightlines on bends must never be compromised.',
  mandatoryRule:
    'Highway safety rules take priority. Agree any change with your highway authority.',
};

export const REFUGE_GUIDANCE: RefugeGuidance = {
  refugePercentage: '10% to 20%',
  description:
    'Leave a 10% to 20% uncut margin in rotation to provide overwintering habitat for invertebrates and small mammals.',
  placement: 'Back of verge adjacent to boundary hedge, ditch, or fence line.',
  rotationSchedule: 'Rotated every 2 to 3 years to prevent scrub encroachment.',
};

export const CUTTER_HEIGHT_GUIDANCE: CutterHeightGuidance = {
  minHeightCm: 8,
  description: 'Raise cutter bar / flail head to at least 8–10 cm (80–100 mm) above the ground.',
  benefits: [
    'Prevents root crown scalping and exposure of bare soil to opportunistic weed colonisation.',
    'Dramatically reduces strike mortality for sheltering amphibians (toads, frogs), reptiles (slow worms), and small mammals.',
  ],
};

export const REGIMES: Record<'R1' | 'RA' | 'RB' | 'RU', RegimeRecommendation> = {
  R1: {
    regimeId: 'R1',
    name: 'Single late cut',
    cuttingMonths: [8, 9],
    monthsDescription: 'August to September',
    cuttingsHandling: 'Collect and remove',
    rationale:
      'Recommended when operational or budgetary limits permit only one cut per year. Late summer mowing allows spring and summer wildflowers to set seed. Cuttings removal prevents soil enrichment.',
    sourceCitations: ['Plantlife Good Verge Guide (2021)'],
  },
  RA: {
    regimeId: 'RA',
    name: 'Meadow pattern A',
    cuttingMonths: [7, 8, 9, 10, 11, 12],
    monthsDescription: 'Cut 1: Mid-July to September; Cut 2: October to December',
    cuttingsHandling: 'Collect and remove',
    rationale:
      'Replicates traditional hay meadow management. The late summer cut allows flowering and seed drop, while the late autumn tidy cut removes regrowth and prevents thatch.',
    sourceCitations: ['Plantlife Managing Grassland Road Verges (2020)'],
  },
  RB: {
    regimeId: 'RB',
    name: 'Meadow pattern B',
    cuttingMonths: [2, 3, 9, 10],
    monthsDescription: 'Cut 1: February to March; Cut 2: September to October',
    cuttingsHandling: 'Collect and remove',
    rationale:
      'For verges dominated by vigorous early grasses. A late winter cut suppresses competitive grasses without disturbing ground-nesting birds, followed by an autumn cut post-flowering.',
    sourceCitations: ['Plantlife Managing Grassland Road Verges (2020)'],
  },
  RU: {
    regimeId: 'RU',
    name: 'Urban short flowering lawn',
    cuttingMonths: [4, 5, 6, 7, 8, 9],
    monthsDescription: 'Every 6 to 8 weeks (April to September) to 3–6 cm',
    cuttingsHandling: 'Collect and remove where possible',
    rationale:
      'Designed for built-up and amenity areas demanding a tidy appearance. Mowing to 3–6 cm allows low-growing wildflowers (trefoils, clovers, selfheal) to re-flower between cuts.',
    sourceCitations: ['Plantlife Road Verge Guide (2021)'],
  },
};

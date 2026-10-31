import { z } from 'zod';
import { IsoDateSchema } from './common.js';

export const IndicatorGroupEnum = z.enum([
  'forb',
  'legume',
  'orchid',
  'semi_parasite',
  'grass_indicator',
  'nutrient_enrichment',
]);
export type IndicatorGroup = z.infer<typeof IndicatorGroupEnum>;

export const ReviewStatusEnum = z.enum(['needs_expert_review', 'reviewed']);
export type ReviewStatus = z.infer<typeof ReviewStatusEnum>;

export const IndicatorSpeciesSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'Must be kebab-case identifier'),
    commonName: z.string().min(1),
    scientificName: z.string().min(1),
    group: IndicatorGroupEnum,
    weight: z.number().int().min(0).max(3),
    sensitive: z.boolean().default(false),
    notes: z.string(),
    sourceUrl: z.string().url(),
    sourceRetrievedAt: IsoDateSchema,
    reviewStatus: ReviewStatusEnum.default('needs_expert_review'),
  })
  .strict();

export type IndicatorSpecies = z.infer<typeof IndicatorSpeciesSchema>;

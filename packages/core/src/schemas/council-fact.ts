import { z } from 'zod';
import { IsoDateSchema, IsoDateTimeSchema, UlidSchema } from './common.js';

export const CouncilFactKeyEnum = z.enum([
  'ruralCutsPerYear',
  'urbanCutsPerYear',
  'firstCutMonth',
  'cuttingsPolicy',
  'designatedScheme',
  'designatedCount',
  'designatedLengthKm',
  'other',
]);
export type CouncilFactKey = z.infer<typeof CouncilFactKeyEnum>;

export const CouncilFactStatusEnum = z.enum(['unverified', 'verified']);
export type CouncilFactStatus = z.infer<typeof CouncilFactStatusEnum>;

export const CouncilFactSchema = z
  .object({
    id: UlidSchema,
    councilId: z.string().min(1),
    key: CouncilFactKeyEnum,
    value: z.union([z.string(), z.number(), z.boolean()]),
    sourceUrl: z.string().url(),
    sourceRetrievedAt: IsoDateSchema,
    status: CouncilFactStatusEnum,
    submittedAt: IsoDateTimeSchema,
    reviewedAt: IsoDateTimeSchema.nullable().default(null),
  })
  .strict();

export type CouncilFact = z.infer<typeof CouncilFactSchema>;

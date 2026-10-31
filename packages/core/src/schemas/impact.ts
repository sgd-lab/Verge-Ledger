import { z } from 'zod';
import { IsoDateTimeSchema } from './common.js';

export const ImpactCounterKeyEnum = z.enum([
  'kmSurveyed',
  'segmentsScored',
  'segmentsFlagged',
  'packsGenerated',
  'requestsGenerated',
  'activeWorkspaces',
]);
export type ImpactCounterKey = z.infer<typeof ImpactCounterKeyEnum>;

export const ImpactCountersSchema = z
  .object({
    key: ImpactCounterKeyEnum,
    value: z.number().int().nonnegative(),
    updatedAt: IsoDateTimeSchema,
  })
  .strict();

export type ImpactCounters = z.infer<typeof ImpactCountersSchema>;

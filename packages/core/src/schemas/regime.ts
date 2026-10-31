import { z } from 'zod';
import { IsoDateSchema } from './common.js';

export const RegimeIdEnum = z.enum(['R1', 'RA', 'RB', 'RU']);
export type RegimeId = z.infer<typeof RegimeIdEnum>;

export const RegimeGuidanceSchema = z
  .object({
    id: RegimeIdEnum,
    name: z.string().min(1),
    months: z.string().min(1),
    description: z.string().min(1),
    conditions: z.string().min(1),
    sourceUrls: z.array(z.string().url()).min(1),
    sourceRetrievedAt: IsoDateSchema,
  })
  .strict();

export type RegimeGuidance = z.infer<typeof RegimeGuidanceSchema>;

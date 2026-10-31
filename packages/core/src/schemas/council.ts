import { z } from 'zod';
import { IsoDateTimeSchema } from './common.js';

export const CouncilTypeEnum = z.enum(['county', 'unitary', 'district', 'parish', 'other']);
export type CouncilType = z.infer<typeof CouncilTypeEnum>;

export const CouncilSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: CouncilTypeEnum,
    region: z.string().min(1),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .strict();

export type Council = z.infer<typeof CouncilSchema>;

import { z } from 'zod';
import { IsoDateTimeSchema, UlidSchema } from './common.js';

export const PhotoMimeEnum = z.enum(['image/jpeg', 'image/png', 'image/webp']);
export type PhotoMime = z.infer<typeof PhotoMimeEnum>;

export const PhotoSchema = z
  .object({
    id: UlidSchema,
    observationId: UlidSchema,
    blob: z.unknown().optional(),
    mime: PhotoMimeEnum,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    createdAt: IsoDateTimeSchema,
  })
  .strict();

export type Photo = z.infer<typeof PhotoSchema>;

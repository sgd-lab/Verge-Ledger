import { z } from 'zod';
import { IsoDateTimeSchema, LineStringGeometrySchema, UlidSchema } from './common.js';

export const RoadClassEnum = z.enum(['A', 'B', 'C', 'U', 'unknown']);
export type RoadClass = z.infer<typeof RoadClassEnum>;

export const SettingEnum = z.enum(['rural', 'urban']);
export type Setting = z.infer<typeof SettingEnum>;

export const WidthBandEnum = z.enum(['lt1_5', '1_5_to_3', 'gt3']);
export type WidthBand = z.infer<typeof WidthBandEnum>;

export const SideEnum = z.enum(['left', 'right', 'both', 'unknown']);
export type Side = z.infer<typeof SideEnum>;

export const VergeSegmentSchema = z
  .object({
    id: UlidSchema,
    workspaceId: UlidSchema,
    geometry: LineStringGeometrySchema,
    lengthM: z.number().min(5).max(500),
    roadClass: RoadClassEnum,
    setting: SettingEnum,
    widthBand: WidthBandEnum,
    side: SideEnum,
    roadName: z.string().nullable().default(null),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
    deletedAt: IsoDateTimeSchema.nullable().default(null),
    isDemo: z.boolean().default(false),
  })
  .strict();

export type VergeSegment = z.infer<typeof VergeSegmentSchema>;

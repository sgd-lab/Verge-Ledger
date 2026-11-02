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

/** Optional physical attributes. All optional so existing segments still validate. */
export const SlopeEnum = z.enum(['flat', 'gentle', 'steep', 'unknown']);
export type Slope = z.infer<typeof SlopeEnum>;

export const ShadeEnum = z.enum(['open', 'partial', 'shaded', 'unknown']);
export type Shade = z.infer<typeof ShadeEnum>;

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
    soilType: z.string().min(1).max(100).optional(),
    slope: SlopeEnum.optional(),
    shade: ShadeEnum.optional(),
    footwayPresence: z.boolean().optional(),
    sightlineSplay: z.boolean().optional(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
    deletedAt: IsoDateTimeSchema.nullable().default(null),
    isDemo: z.boolean().default(false),
  })
  .strict();

export type VergeSegment = z.infer<typeof VergeSegmentSchema>;

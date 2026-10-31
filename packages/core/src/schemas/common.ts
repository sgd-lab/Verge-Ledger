import { z } from 'zod';

/**
 * 26-character Crockford Base32 ULID regex.
 * Excludes I, L, O, U to avoid transcription ambiguity.
 */
export const UlidSchema = z
  .string()
  .regex(/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i, 'Invalid ULID format');

export const IsoDateTimeSchema = z.string().datetime({ offset: true });
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

/**
 * WGS84 GeoJSON coordinate pair: [longitude, latitude]
 */
export const PositionSchema = z.tuple([
  z.number().min(-180).max(180), // Longitude
  z.number().min(-90).max(90), // Latitude
]);

export const LineStringGeometrySchema = z
  .object({
    type: z.literal('LineString'),
    coordinates: z.array(PositionSchema).min(2),
  })
  .strict();

export type Position = z.infer<typeof PositionSchema>;
export type LineStringGeometry = z.infer<typeof LineStringGeometrySchema>;

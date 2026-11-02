import { z } from 'zod';
import {
  CouncilFactKeyEnum,
  IsoDateSchema,
  IsoDateTimeSchema,
  SurveyObservationSchema,
  VergeSegmentSchema,
} from '@verge-ledger/core';

export const CreateWorkspaceBodySchema = z
  .object({
    name: z.string().min(1).max(100),
    isDemo: z.boolean().default(false),
  })
  .strict();

export const SyncBodySchema = z
  .object({
    since: IsoDateTimeSchema.nullable().optional(),
    segments: z.array(VergeSegmentSchema).default([]),
    observations: z.array(SurveyObservationSchema).default([]),
  })
  .strict();

export const ExportQuerySchema = z
  .object({
    format: z.enum(['geojson', 'csv']).default('geojson'),
  })
  .strict();

export const CouncilsQuerySchema = z
  .object({
    verifiedOnly: z.enum(['true', 'false']).default('true'),
  })
  .strict();

export const ProposeFactBodySchema = z
  .object({
    key: CouncilFactKeyEnum,
    value: z.union([z.string(), z.number(), z.boolean()]),
    sourceUrl: z.string().url(),
    sourceRetrievedAt: IsoDateSchema,
  })
  .strict();

export const ReviewFactBodySchema = z
  .object({
    decision: z.enum(['verified', 'rejected']),
  })
  .strict();

export const ImpactEventBodySchema = z
  .object({
    counter: z.enum(['packsGenerated', 'requestsGenerated']),
    increment: z.number().int().min(1).max(1000).default(1),
  })
  .strict();

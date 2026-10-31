import { z } from 'zod';
import { IsoDateTimeSchema, UlidSchema } from './common.js';

export const ForbCountBandEnum = z.enum(['0', '1_2', '3_5', '6_9', '10_14', '15plus']);
export type ForbCountBand = z.infer<typeof ForbCountBandEnum>;

export const SwardStructureEnum = z.enum(['short_uniform', 'medium_mixed', 'tall_rank']);
export type SwardStructure = z.infer<typeof SwardStructureEnum>;

export const CutStateEnum = z.enum(['uncut', 'cut_recent', 'unknown']);
export type CutState = z.infer<typeof CutStateEnum>;

export const CuttingsStateEnum = z.enum(['removed', 'left', 'na']);
export type CuttingsState = z.infer<typeof CuttingsStateEnum>;

export const ScoreTierEnum = z.enum(['ordinary', 'promising', 'expert_review']);
export type ScoreTier = z.infer<typeof ScoreTierEnum>;

export const ScoreTierLabelEnum = z.enum([
  'Ordinary verge',
  'Promising verge',
  'Refer for expert review',
]);
export type ScoreTierLabel = z.infer<typeof ScoreTierLabelEnum>;

export const ScoreConfidenceEnum = z.enum(['low', 'medium']);
export type ScoreConfidence = z.infer<typeof ScoreConfidenceEnum>;

export const ScoreResultSchema = z
  .object({
    rawScore: z.number().int().min(0).max(85),
    baseScore: z.number().int().min(0).max(100),
    finalScore: z.number().int().min(0).max(100),
    subscores: z
      .object({
        richness: z.number().int().min(0).max(40),
        indicators: z.number().int().min(0).max(30),
        sward: z.number().int().min(0).max(15),
        nutrientPenalty: z.number().int().min(0).max(20),
      })
      .strict(),
    tier: ScoreTierEnum,
    tierLabel: ScoreTierLabelEnum,
    tierLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    badgeCode: z.enum(['bronze', 'silver', 'gold']),
    confidence: ScoreConfidenceEnum,
    flags: z.array(z.string()),
    breakdown: z.array(z.string()),
    disclaimer: z.string(),
  })
  .strict();

export type ScoreResult = z.infer<typeof ScoreResultSchema>;

export const SurveyObservationSchema = z
  .object({
    id: UlidSchema,
    segmentId: UlidSchema,
    observedAt: IsoDateTimeSchema,
    forbCountBand: ForbCountBandEnum,
    indicatorIds: z.array(z.string()),
    nutrientDominantIds: z.array(z.string()),
    swardStructure: SwardStructureEnum,
    cutState: CutStateEnum,
    cuttingsState: CuttingsStateEnum,
    lastCutMonth: z.number().int().min(1).max(12).nullable().default(null),
    cutsPerYear: z.number().int().min(0).max(20).nullable().optional(),
    notes: z.string().max(1000).nullable().default(null),
    photoIds: z.array(UlidSchema).max(3).default([]),
    scoringVersion: z.literal('verge-triage-v1'),
    scoreResult: ScoreResultSchema.nullable().optional(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
    deletedAt: IsoDateTimeSchema.nullable().default(null),
    isDemo: z.boolean().default(false),
  })
  .strict();

export type SurveyObservation = z.infer<typeof SurveyObservationSchema>;

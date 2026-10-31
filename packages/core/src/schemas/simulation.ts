import { z } from 'zod';

export const CutItemSchema = z
  .object({
    id: z.string().optional(),
    month: z.number().int().min(1).max(12),
    label: z.string().optional(),
    safetyCritical: z.boolean().default(false),
  })
  .strict();

export type CutItem = z.infer<typeof CutItemSchema>;

export const SimulationCostInputsSchema = z
  .object({
    costPerCutPerKm: z.number().positive().optional(),
    fuelLitersPerCutPerKm: z.number().positive().optional(),
    kmOfRoad: z.number().positive().optional(),
    vergeLengthKm: z.number().positive().optional(),
  })
  .strict();

export type SimulationCostInputs = z.infer<typeof SimulationCostInputsSchema>;

export const SimulatorTierEnum = z.enum([
  'ordinary',
  'promising',
  'expert_review',
  'Ordinary verge',
  'Promising verge',
  'Refer for expert review',
  'unknown',
]);
export type SimulatorTier = z.infer<typeof SimulatorTierEnum>;

export const SimulationParamsSchema = z
  .object({
    currentCuts: z.array(CutItemSchema).min(1),
    tier: SimulatorTierEnum,
    cuttingsRemovable: z.enum(['yes', 'no', 'unknown']),
    cutsToRemove: z.number().int().min(1).max(10),
    costInputs: SimulationCostInputsSchema.optional(),
  })
  .strict();

export type SimulationParams = z.infer<typeof SimulationParamsSchema>;

export const IndicativeSavingsSchema = z
  .object({
    costSavedGbp: z.number().optional(),
    fuelSavedLitres: z.number().optional(),
    carbonSavedKg: z.number().optional(),
    operationalReductionPercent: z.number(),
    label: z.string(),
  })
  .strict();

export type IndicativeSavings = z.infer<typeof IndicativeSavingsSchema>;

export const RankedOptionSchema = z
  .object({
    rank: z.number().int().positive(),
    cutsDropped: z.array(CutItemSchema),
    remainingCuts: z.array(CutItemSchema),
    sumAlignmentRemoved: z.number(),
    recommended: z.boolean(),
    recommendationReason: z.string(),
    warnings: z.array(z.string()),
    savings: IndicativeSavingsSchema.optional(),
  })
  .strict();

export type RankedOption = z.infer<typeof RankedOptionSchema>;

export const SimulationResultSchema = z
  .object({
    status: z.enum(['success', 'no_valid_options']),
    options: z.array(RankedOptionSchema),
    summaryMessage: z.string(),
    safetyDisclaimer: z.string(),
  })
  .strict();

export type SimulationResult = z.infer<typeof SimulationResultSchema>;

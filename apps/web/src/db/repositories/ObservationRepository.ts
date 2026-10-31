import {
  SurveyObservationSchema,
  type SurveyObservation,
  calculateTriageScore,
} from '@verge-ledger/core';
import { db } from '../schema';
import { generateUlid } from '../../lib/id';

export class ObservationRepository {
  async listBySegment(segmentId: string, includeDeleted = false): Promise<SurveyObservation[]> {
    let collection = db.surveyObservations.where('segmentId').equals(segmentId);
    if (!includeDeleted) {
      collection = collection.filter((o) => !o.deletedAt);
    }
    return collection.sortBy('observedAt');
  }

  async getById(id: string): Promise<SurveyObservation | undefined> {
    return db.surveyObservations.get(id);
  }

  async create(
    data: Omit<SurveyObservation, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { id?: string },
  ): Promise<SurveyObservation> {
    const now = new Date().toISOString();

    // Pure deterministic score computation if scoreResult not precomputed
    const scoreResult =
      data.scoreResult ??
      calculateTriageScore({
        forbCountBand: data.forbCountBand,
        indicatorIds: data.indicatorIds,
        nutrientDominantIds: data.nutrientDominantIds,
        swardStructure: data.swardStructure,
        cutState: data.cutState,
        cuttingsState: data.cuttingsState,
        lastCutMonth: data.lastCutMonth,
      });

    const record: SurveyObservation = {
      ...data,
      id: data.id ?? generateUlid(),
      scoreResult,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isDemo: data.isDemo ?? false,
    };

    const validated = SurveyObservationSchema.parse(record);
    await db.surveyObservations.add(validated);
    return validated;
  }

  async update(id: string, updates: Partial<SurveyObservation>): Promise<SurveyObservation> {
    const existing = await db.surveyObservations.get(id);
    if (!existing) {
      throw new Error(`Observation with id ${id} not found`);
    }

    const merged = { ...existing, ...updates };

    // Re-evaluate score if any scoring attributes were updated
    const scoreResult = calculateTriageScore({
      forbCountBand: merged.forbCountBand,
      indicatorIds: merged.indicatorIds,
      nutrientDominantIds: merged.nutrientDominantIds,
      swardStructure: merged.swardStructure,
      cutState: merged.cutState,
      cuttingsState: merged.cuttingsState,
      lastCutMonth: merged.lastCutMonth,
    });

    const updated: SurveyObservation = {
      ...merged,
      scoreResult,
      updatedAt: new Date().toISOString(),
    };

    const validated = SurveyObservationSchema.parse(updated);
    await db.surveyObservations.put(validated);
    return validated;
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await db.surveyObservations.update(id, { deletedAt: now, updatedAt: now });
  }

  async hardDelete(id: string): Promise<void> {
    await db.transaction('rw', [db.surveyObservations, db.photos], async () => {
      await db.photos.where('observationId').equals(id).delete();
      await db.surveyObservations.delete(id);
    });
  }
}

export const observationRepo = new ObservationRepository();

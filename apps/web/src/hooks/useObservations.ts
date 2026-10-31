import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { observationRepo } from '../db/repositories/ObservationRepository';
import type { SurveyObservation } from '@verge-ledger/core';

export function useObservations(segmentId?: string) {
  const observations = useLiveQuery(() => {
    if (!segmentId) return [];
    return db.surveyObservations
      .where('segmentId')
      .equals(segmentId)
      .filter((o) => !o.deletedAt)
      .sortBy('observedAt');
  }, [segmentId]);

  const createObservation = async (
    data: Omit<SurveyObservation, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ) => {
    return observationRepo.create(data);
  };

  const updateObservation = async (id: string, updates: Partial<SurveyObservation>) => {
    return observationRepo.update(id, updates);
  };

  const deleteObservation = async (id: string) => {
    return observationRepo.softDelete(id);
  };

  return {
    observations: observations ?? [],
    createObservation,
    updateObservation,
    deleteObservation,
    isLoading: observations === undefined,
  };
}

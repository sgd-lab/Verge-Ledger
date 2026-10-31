import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { segmentRepo } from '../db/repositories/SegmentRepository';
import type { VergeSegment } from '@verge-ledger/core';

export function useSegments(workspaceId?: string) {
  const segments = useLiveQuery(() => {
    if (!workspaceId) return [];
    return db.vergeSegments
      .where('workspaceId')
      .equals(workspaceId)
      .filter((s) => !s.deletedAt)
      .sortBy('createdAt');
  }, [workspaceId]);

  const createSegment = async (
    data: Omit<VergeSegment, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ) => {
    return segmentRepo.create(data);
  };

  const updateSegment = async (id: string, updates: Partial<VergeSegment>) => {
    return segmentRepo.update(id, updates);
  };

  const deleteSegment = async (id: string) => {
    return segmentRepo.softDelete(id);
  };

  return {
    segments: segments ?? [],
    createSegment,
    updateSegment,
    deleteSegment,
    isLoading: segments === undefined,
  };
}

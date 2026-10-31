import { VergeSegmentSchema, type VergeSegment } from '@verge-ledger/core';
import { db } from '../schema';
import { generateUlid } from '../../lib/id';

export class SegmentRepository {
  async listByWorkspace(workspaceId: string, includeDeleted = false): Promise<VergeSegment[]> {
    let collection = db.vergeSegments.where('workspaceId').equals(workspaceId);
    if (!includeDeleted) {
      collection = collection.filter((s) => !s.deletedAt);
    }
    return collection.sortBy('createdAt');
  }

  async getById(id: string): Promise<VergeSegment | undefined> {
    return db.vergeSegments.get(id);
  }

  async create(
    data: Omit<VergeSegment, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { id?: string },
  ): Promise<VergeSegment> {
    const now = new Date().toISOString();
    const record: VergeSegment = {
      ...data,
      id: data.id ?? generateUlid(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isDemo: data.isDemo ?? false,
    };

    const validated = VergeSegmentSchema.parse(record);
    await db.vergeSegments.add(validated);
    return validated;
  }

  async update(id: string, updates: Partial<VergeSegment>): Promise<VergeSegment> {
    const existing = await db.vergeSegments.get(id);
    if (!existing) {
      throw new Error(`Segment with id ${id} not found`);
    }

    const updated: VergeSegment = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const validated = VergeSegmentSchema.parse(updated);
    await db.vergeSegments.put(validated);
    return validated;
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await db.transaction('rw', [db.vergeSegments, db.surveyObservations], async () => {
      await db.vergeSegments.update(id, { deletedAt: now, updatedAt: now });
      await db.surveyObservations
        .where('segmentId')
        .equals(id)
        .modify({ deletedAt: now, updatedAt: now });
    });
  }

  async hardDelete(id: string): Promise<void> {
    await db.transaction('rw', [db.vergeSegments, db.surveyObservations, db.photos], async () => {
      const obs = await db.surveyObservations.where('segmentId').equals(id).toArray();
      for (const o of obs) {
        await db.photos.where('observationId').equals(o.id).delete();
      }
      await db.surveyObservations.where('segmentId').equals(id).delete();
      await db.vergeSegments.delete(id);
    });
  }
}

export const segmentRepo = new SegmentRepository();

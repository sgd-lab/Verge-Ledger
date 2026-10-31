import { WorkspaceSchema, type Workspace } from '@verge-ledger/core';
import { db } from '../schema';
import { generateUlid } from '../../lib/id';

export class WorkspaceRepository {
  async list(): Promise<Workspace[]> {
    return db.workspaces.toCollection().sortBy('createdAt');
  }

  async getById(id: string): Promise<Workspace | undefined> {
    return db.workspaces.get(id);
  }

  async create(data: {
    name: string;
    isDemo?: boolean;
    syncEnabled?: boolean;
    id?: string;
  }): Promise<Workspace> {
    const now = new Date().toISOString();
    const record: Workspace = {
      id: data.id ?? generateUlid(),
      name: data.name.trim(),
      createdAt: now,
      updatedAt: now,
      isDemo: data.isDemo ?? false,
      serverId: null,
      syncEnabled: data.syncEnabled ?? false,
    };

    const validated = WorkspaceSchema.parse(record);
    await db.workspaces.add(validated);
    return validated;
  }

  async update(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const existing = await db.workspaces.get(id);
    if (!existing) {
      throw new Error(`Workspace with id ${id} not found`);
    }

    const updated: Workspace = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const validated = WorkspaceSchema.parse(updated);
    await db.workspaces.put(validated);
    return validated;
  }

  async delete(id: string): Promise<void> {
    await db.transaction(
      'rw',
      [db.workspaces, db.vergeSegments, db.surveyObservations, db.photos],
      async () => {
        const segments = await db.vergeSegments.where('workspaceId').equals(id).toArray();
        for (const seg of segments) {
          const obs = await db.surveyObservations.where('segmentId').equals(seg.id).toArray();
          for (const o of obs) {
            await db.photos.where('observationId').equals(o.id).delete();
          }
          await db.surveyObservations.where('segmentId').equals(seg.id).delete();
        }
        await db.vergeSegments.where('workspaceId').equals(id).delete();
        await db.workspaces.delete(id);
      },
    );
  }
}

export const workspaceRepo = new WorkspaceRepository();

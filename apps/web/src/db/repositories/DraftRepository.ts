import { db, type LocalDraftRecord } from '../schema';

export class DraftRepository {
  async getDraft(id = 'current-survey-draft'): Promise<LocalDraftRecord | undefined> {
    return db.localDrafts.get(id);
  }

  async saveDraft(
    step: number,
    data: Record<string, unknown>,
    id = 'current-survey-draft',
  ): Promise<void> {
    const record: LocalDraftRecord = {
      id,
      step,
      data,
      updatedAt: new Date().toISOString(),
    };
    await db.localDrafts.put(record);
  }

  async clearDraft(id = 'current-survey-draft'): Promise<void> {
    await db.localDrafts.delete(id);
  }
}

export const draftRepo = new DraftRepository();

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { draftRepo } from '../db/repositories/DraftRepository';

export function useDraftSurvey(draftId = 'current-survey-draft') {
  const draft = useLiveQuery(() => db.localDrafts.get(draftId), [draftId]);

  const saveDraft = async (step: number, data: Record<string, unknown>) => {
    await draftRepo.saveDraft(step, data, draftId);
  };

  const clearDraft = async () => {
    await draftRepo.clearDraft(draftId);
  };

  return {
    draft,
    hasDraft: draft !== undefined,
    saveDraft,
    clearDraft,
    isLoading: draft === undefined,
  };
}

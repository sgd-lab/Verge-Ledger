import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CouncilFactRecord } from '../db/schema';
import { workspaceRepo } from '../db/repositories/WorkspaceRepository';
import type { SurveyObservation, VergeSegment, Workspace } from '@verge-ledger/core';

/** Live lists of everything stored locally, across all workspaces. */
export function useSurveyData(): {
  workspaces: Workspace[];
  segments: VergeSegment[];
  observations: SurveyObservation[];
  councilFacts: CouncilFactRecord[];
  isLoading: boolean;
} {
  const workspaces = useLiveQuery(() => db.workspaces.toCollection().sortBy('createdAt'), []);
  const segments = useLiveQuery(
    () => db.vergeSegments.filter((s) => !s.deletedAt).sortBy('createdAt'),
    [],
  );
  const observations = useLiveQuery(
    () => db.surveyObservations.filter((o) => !o.deletedAt).sortBy('observedAt'),
    [],
  );
  const councilFacts = useLiveQuery(() => db.councilFacts.toCollection().sortBy('authorityName'), []);
  return {
    workspaces: workspaces ?? [],
    segments: segments ?? [],
    observations: observations ?? [],
    councilFacts: councilFacts ?? [],
    isLoading:
      workspaces === undefined ||
      segments === undefined ||
      observations === undefined ||
      councilFacts === undefined,
  };
}

/** Return the first workspace, creating a plain local one when none exists yet. */
export async function ensureWorkspace(): Promise<Workspace> {
  const existing = await workspaceRepo.list();
  const first = existing[0];
  if (first) return first;
  return workspaceRepo.create({ name: 'My verges' });
}

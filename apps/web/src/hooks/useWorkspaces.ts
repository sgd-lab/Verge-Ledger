import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { workspaceRepo } from '../db/repositories/WorkspaceRepository';

export function useWorkspaces() {
  const workspaces = useLiveQuery(() => db.workspaces.toCollection().sortBy('createdAt'), []);

  const activeWorkspaceId = useLiveQuery(async () => {
    const setting = await db.appSettings.get('activeWorkspaceId');
    return (setting?.value as string) || null;
  }, []);

  const activeWorkspace = workspaces?.find((w) => w.id === activeWorkspaceId) ?? workspaces?.[0];

  const setActiveWorkspaceId = async (id: string) => {
    await db.appSettings.put({ key: 'activeWorkspaceId', value: id });
  };

  const createWorkspace = async (name: string, isDemo = false) => {
    const created = await workspaceRepo.create({ name, isDemo });
    await setActiveWorkspaceId(created.id);
    return created;
  };

  const deleteWorkspace = async (id: string) => {
    await workspaceRepo.delete(id);
    if (activeWorkspaceId === id) {
      const remaining = workspaces?.filter((w) => w.id !== id);
      if (remaining && remaining.length > 0) {
        const first = remaining[0];
        if (first) await setActiveWorkspaceId(first.id);
      } else {
        await db.appSettings.delete('activeWorkspaceId');
      }
    }
  };

  return {
    workspaces: workspaces ?? [],
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspaceId,
    createWorkspace,
    deleteWorkspace,
    isLoading: workspaces === undefined,
  };
}

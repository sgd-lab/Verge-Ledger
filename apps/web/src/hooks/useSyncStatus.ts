import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export type SyncState = 'local-only' | 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncStatusInfo {
  state: SyncState;
  label: string;
  isOnline: boolean;
  syncEnabled: boolean;
  lastSyncedAt: string | null;
  errorMessage: string | null;
}

export function useSyncStatus(workspaceId?: string): SyncStatusInfo {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [isSyncing] = useState<boolean>(false);
  const [errorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const workspace = useLiveQuery(
    () => (workspaceId ? db.workspaces.get(workspaceId) : undefined),
    [workspaceId],
  );

  const lastSyncedSetting = useLiveQuery(
    () => (workspaceId ? db.appSettings.get(`lastSyncedAt_${workspaceId}`) : undefined),
    [workspaceId],
  );

  const syncEnabled = workspace?.syncEnabled ?? false;
  const lastSyncedAt = (lastSyncedSetting?.value as string) || null;

  let state: SyncState = 'local-only';
  let label = 'Local Only';

  if (!syncEnabled) {
    state = 'local-only';
    label = 'Local Only';
  } else if (!isOnline) {
    state = 'offline';
    label = 'Offline';
  } else if (isSyncing) {
    state = 'syncing';
    label = 'Syncing...';
  } else if (errorMessage) {
    state = 'error';
    label = 'Sync Error';
  } else {
    state = 'synced';
    label = 'Synced';
  }

  return {
    state,
    label,
    isOnline,
    syncEnabled,
    lastSyncedAt,
    errorMessage,
  };
}

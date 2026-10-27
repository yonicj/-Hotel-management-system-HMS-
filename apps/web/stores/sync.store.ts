import { create } from 'zustand';

interface SyncStore {
  pendingMutationsCount: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  setSyncStatus: (isSyncing: boolean, count: number) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  pendingMutationsCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  setSyncStatus: (isSyncing, count) => set({ isSyncing, pendingMutationsCount: count }),
}));

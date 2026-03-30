export type SyncStatus = "synced" | "syncing" | "offline" | "conflict" | "error";

export interface CloudDocument {
  id: string;
  userId: string;
  title: string;
  markdown: string;
  source: "blank" | "imported" | "recovered" | "cloud";
  version: number;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
}

export interface CloudDocumentVersion {
  id: string;
  docId: string;
  userId: string;
  markdown: string;
  version: number;
  createdAt: number;
}

export interface SyncEvent {
  id: string;
  docId: string;
  userId: string;
  deviceId: string;
  baseVersion: number;
  nextVersion: number;
  markdown: string;
  createdAt: number;
}

export interface SyncConflict {
  docId: string;
  currentVersion: number;
  currentMarkdown: string;
  currentTitle: string;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt?: number;
  pendingCount: number;
  conflict?: SyncConflict;
}

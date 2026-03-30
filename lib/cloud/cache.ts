import type { StoredDocument } from "@/types/document";

const WORKSPACE_CACHE_KEY = "super-markdown-workbench:cloud-workspace-cache";
const DOCUMENT_CACHE_PREFIX = "super-markdown-workbench:cloud-doc:";

interface WorkspaceCache {
  recentDocs: StoredDocument[];
  updatedAt: number;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getCachedWorkspace() {
  if (!canUseStorage()) {
    return null;
  }

  return readJson<WorkspaceCache>(window.localStorage.getItem(WORKSPACE_CACHE_KEY));
}

export function saveCachedWorkspace(recentDocs: StoredDocument[]) {
  if (!canUseStorage()) {
    return;
  }

  const payload: WorkspaceCache = {
    recentDocs,
    updatedAt: Date.now(),
  };

  window.localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(payload));
}

export function getCachedDocument(docId: string) {
  if (!canUseStorage()) {
    return null;
  }

  return readJson<StoredDocument>(window.localStorage.getItem(`${DOCUMENT_CACHE_PREFIX}${docId}`));
}

export function saveCachedDocument(document: StoredDocument) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    `${DOCUMENT_CACHE_PREFIX}${document.id}`,
    JSON.stringify(document),
  );
}

export function removeCachedDocument(docId: string) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(`${DOCUMENT_CACHE_PREFIX}${docId}`);
}

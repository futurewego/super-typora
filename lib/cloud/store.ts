import type { CloudDevice, CloudSession, UserAccount } from "@/types/account";
import type {
  CloudDocument,
  CloudDocumentVersion,
  SyncConflict,
  SyncEvent,
} from "@/types/sync";

interface CloudStoreState {
  accountsByEmail: Map<string, UserAccount>;
  accountsById: Map<string, UserAccount>;
  sessions: Map<string, CloudSession>;
  devices: Map<string, CloudDevice>;
  documents: Map<string, CloudDocument>;
  versionsByDocId: Map<string, CloudDocumentVersion[]>;
  events: SyncEvent[];
}

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const globalState = globalThis as typeof globalThis & {
  __superMarkdownCloudStore?: CloudStoreState;
};

function createEmptyStore(): CloudStoreState {
  return {
    accountsByEmail: new Map(),
    accountsById: new Map(),
    sessions: new Map(),
    devices: new Map(),
    documents: new Map(),
    versionsByDocId: new Map(),
    events: [],
  };
}

function getStore() {
  globalState.__superMarkdownCloudStore ??= createEmptyStore();
  return globalState.__superMarkdownCloudStore;
}

function createId(prefix: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function resetCloudStore() {
  globalState.__superMarkdownCloudStore = createEmptyStore();
}

export function getOrCreateAccount(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const store = getStore();
  const existing = store.accountsByEmail.get(normalizedEmail);

  if (existing) {
    const updated = { ...existing, lastSeenAt: Date.now() };
    store.accountsByEmail.set(normalizedEmail, updated);
    store.accountsById.set(updated.id, updated);
    return updated;
  }

  const now = Date.now();
  const account: UserAccount = {
    id: createId("acct"),
    email: normalizedEmail,
    createdAt: now,
    lastSeenAt: now,
  };

  store.accountsByEmail.set(normalizedEmail, account);
  store.accountsById.set(account.id, account);
  return account;
}

export function createSession(email: string, deviceId: string) {
  const store = getStore();
  const account = getOrCreateAccount(email);
  const now = Date.now();
  const session: CloudSession = {
    id: createId("sess"),
    userId: account.id,
    deviceId,
    createdAt: now,
    expiresAt: now + DEFAULT_TTL_MS,
  };

  const device: CloudDevice = {
    id: deviceId,
    userId: account.id,
    name: "Browser device",
    createdAt: now,
    lastSeenAt: now,
  };

  store.sessions.set(session.id, session);
  store.devices.set(device.id, device);

  return { account, session, device };
}

export function getSession(sessionId: string) {
  const store = getStore();
  return store.sessions.get(sessionId);
}

export function getAccountById(userId: string) {
  return getStore().accountsById.get(userId);
}

export function listDevices(userId: string) {
  return [...getStore().devices.values()].filter((device) => device.userId === userId);
}

export function touchDevice(userId: string, deviceId: string) {
  const store = getStore();
  const existing = store.devices.get(deviceId);
  const now = Date.now();

  if (!existing) {
    const device: CloudDevice = {
      id: deviceId,
      userId,
      name: "Browser device",
      createdAt: now,
      lastSeenAt: now,
    };

    store.devices.set(deviceId, device);
    return device;
  }

  const next = { ...existing, lastSeenAt: now };
  store.devices.set(deviceId, next);
  return next;
}

export function listCloudDocuments(userId: string) {
  return [...getStore().documents.values()]
    .filter((document) => document.userId === userId)
    .sort((left, right) => right.lastOpenedAt - left.lastOpenedAt);
}

export function getCloudDocument(userId: string, docId: string) {
  const document = getStore().documents.get(docId);

  if (!document || document.userId !== userId) {
    return undefined;
  }

  return document;
}

export function createCloudDocument(input: {
  id?: string;
  userId: string;
  title: string;
  markdown: string;
  source?: "blank" | "imported" | "recovered" | "cloud";
}) {
  const now = Date.now();
  const document: CloudDocument = {
    id: input.id ?? createId("doc"),
    userId: input.userId,
    title: input.title,
    markdown: input.markdown,
    source: input.source ?? "cloud",
    version: 1,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };

  const store = getStore();
  store.documents.set(document.id, document);
  store.versionsByDocId.set(document.id, [recordVersion(document, now)]);

  return document;
}

function recordVersion(document: CloudDocument, createdAt: number) {
  const version: CloudDocumentVersion = {
    id: createId("ver"),
    docId: document.id,
    userId: document.userId,
    markdown: document.markdown,
    version: document.version,
    createdAt,
  };

  return version;
}

export function listCloudVersions(userId: string, docId: string) {
  return (getStore().versionsByDocId.get(docId) ?? []).filter(
    (version) => version.userId === userId,
  );
}

export function updateCloudDocument(input: {
  userId: string;
  docId: string;
  title?: string;
  markdown?: string;
  source?: "blank" | "imported" | "recovered" | "cloud";
  baseVersion?: number;
  lastOpenedAt?: number;
}) {
  const store = getStore();
  const current = store.documents.get(input.docId);

  if (!current || current.userId !== input.userId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (
    typeof input.baseVersion === "number" &&
    input.baseVersion !== current.version
  ) {
    const conflict: SyncConflict = {
      docId: current.id,
      currentVersion: current.version,
      currentMarkdown: current.markdown,
      currentTitle: current.title,
    };

    return { ok: false as const, reason: "conflict" as const, conflict };
  }

  const now = Date.now();
  const nextDocument: CloudDocument = {
    ...current,
    title: input.title ?? current.title,
    markdown: input.markdown ?? current.markdown,
    source: input.source ?? current.source,
    version: current.version + 1,
    updatedAt: now,
    lastOpenedAt: input.lastOpenedAt ?? current.lastOpenedAt,
  };

  const nextVersions = [...(store.versionsByDocId.get(current.id) ?? [])];
  nextVersions.push(recordVersion(nextDocument, now));

  store.documents.set(current.id, nextDocument);
  store.versionsByDocId.set(current.id, nextVersions);

  return { ok: true as const, document: nextDocument };
}

export function recordSyncEvent(input: {
  userId: string;
  deviceId: string;
  docId: string;
  baseVersion: number;
  nextVersion: number;
  markdown: string;
}) {
  const event: SyncEvent = {
    id: createId("evt"),
    userId: input.userId,
    deviceId: input.deviceId,
    docId: input.docId,
    baseVersion: input.baseVersion,
    nextVersion: input.nextVersion,
    markdown: input.markdown,
    createdAt: Date.now(),
  };

  getStore().events.push(event);
  return event;
}

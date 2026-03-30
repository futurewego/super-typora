import type { UserAccount, CloudSession } from "@/types/account";
import type { CloudDocument, CloudDocumentVersion, SyncEvent } from "@/types/sync";
import { getOrCreateDeviceId } from "@/lib/utils/device-id";

interface ApiErrorPayload {
  error: string;
  conflict?: unknown;
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function loginAccount(email: string) {
  return requestJson<{ account: UserAccount; session: CloudSession }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, deviceId: getOrCreateDeviceId() }),
    },
  );
}

export async function logoutAccount() {
  await requestJson<{ ok: true }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentAccount() {
  return requestJson<{ account: UserAccount | null }>("/api/me");
}

export async function listCloudDocuments() {
  return requestJson<{ documents: CloudDocument[] }>("/api/documents");
}

export async function getCloudDocument(docId: string) {
  return requestJson<{ document: CloudDocument }>(`/api/documents/${docId}`);
}

export async function createCloudDocument(input: {
  title: string;
  markdown: string;
  source?: "blank" | "imported" | "recovered" | "cloud";
}) {
  return requestJson<{ document: CloudDocument }>("/api/documents", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCloudDocument(
  docId: string,
  input: {
    title?: string;
    markdown?: string;
    source?: "blank" | "imported" | "recovered" | "cloud";
    baseVersion?: number;
    lastOpenedAt?: number;
  },
) {
  return requestJson<{ document: CloudDocument }>(`/api/documents/${docId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function listCloudVersions(docId: string) {
  return requestJson<{ versions: CloudDocumentVersion[] }>(
    `/api/documents/${docId}/versions`,
  );
}

export async function appendSyncEvent(input: {
  docId: string;
  baseVersion: number;
  nextVersion: number;
  markdown: string;
}) {
  return requestJson<{ event: SyncEvent }>("/api/sync/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

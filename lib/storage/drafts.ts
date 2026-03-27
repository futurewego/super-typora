import { getWorkbenchDb } from "@/lib/storage/db";
import type { DraftSnapshot } from "@/types/document";

export async function saveDraft(snapshot: DraftSnapshot) {
  const database = await getWorkbenchDb();
  await database.put("drafts", snapshot);
  return snapshot;
}

export async function getDraft(docId: string) {
  const database = await getWorkbenchDb();
  return database.get("drafts", docId);
}

export async function listDrafts() {
  const database = await getWorkbenchDb();
  return database.getAll("drafts");
}

export async function clearDraft(docId: string) {
  const database = await getWorkbenchDb();
  await database.delete("drafts", docId);
}

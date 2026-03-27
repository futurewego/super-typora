import { getWorkbenchDb, resetWorkbenchDatabase } from "@/lib/storage/db";
import type {
  CreateDocumentInput,
  StoredDocument,
  UpdateDocumentInput,
} from "@/types/document";

function createDocumentId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function createDocument(
  input: CreateDocumentInput,
): Promise<StoredDocument> {
  const now = Date.now();
  const document: StoredDocument = {
    id: createDocumentId(),
    title: input.title,
    markdown: input.markdown,
    source: input.source,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };

  const database = await getWorkbenchDb();
  await database.put("documents", document);

  return document;
}

export async function getDocument(id: string) {
  const database = await getWorkbenchDb();
  return database.get("documents", id);
}

export async function updateDocument(
  id: string,
  patch: UpdateDocumentInput,
): Promise<StoredDocument> {
  const database = await getWorkbenchDb();
  const current = await database.get("documents", id);

  if (!current) {
    throw new Error(`Document not found: ${id}`);
  }

  const nextDocument: StoredDocument = {
    ...current,
    ...patch,
    updatedAt: patch.updatedAt ?? Date.now(),
    lastOpenedAt: patch.lastOpenedAt ?? current.lastOpenedAt,
  };

  await database.put("documents", nextDocument);
  return nextDocument;
}

export async function listRecentDocuments(limit = 10) {
  const database = await getWorkbenchDb();
  const documents = await database.getAll("documents");

  return documents
    .sort((left, right) => right.lastOpenedAt - left.lastOpenedAt)
    .slice(0, limit);
}

export { resetWorkbenchDatabase };

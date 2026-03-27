import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { DraftSnapshot, StoredDocument } from "@/types/document";

interface WorkbenchDB extends DBSchema {
  documents: {
    key: string;
    value: StoredDocument;
  };
  drafts: {
    key: string;
    value: DraftSnapshot;
  };
}

const DB_NAME = "super-markdown-workbench";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WorkbenchDB>> | undefined;

export function getWorkbenchDb() {
  if (!dbPromise) {
    dbPromise = openDB<WorkbenchDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("documents")) {
          database.createObjectStore("documents", { keyPath: "id" });
        }

        if (!database.objectStoreNames.contains("drafts")) {
          database.createObjectStore("drafts", { keyPath: "docId" });
        }
      },
    });
  }

  return dbPromise;
}

export async function resetWorkbenchDatabase() {
  if (dbPromise) {
    const database = await dbPromise;
    database.close();
  }

  dbPromise = undefined;
  await deleteDB(DB_NAME);
}

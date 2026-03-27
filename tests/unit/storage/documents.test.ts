import { beforeEach, describe, expect, it } from "vitest";

import {
  createDocument,
  getDocument,
  listRecentDocuments,
  resetWorkbenchDatabase,
  updateDocument,
} from "@/lib/storage/documents";

describe("documents repository", () => {
  beforeEach(async () => {
    await resetWorkbenchDatabase();
  });

  it("creates and retrieves a document", async () => {
    const document = await createDocument({
      title: "Draft A",
      markdown: "# Draft A",
      source: "blank",
    });

    const stored = await getDocument(document.id);

    expect(stored).toMatchObject({
      id: document.id,
      title: "Draft A",
      markdown: "# Draft A",
      source: "blank",
    });
  });

  it("lists recent documents by last opened time descending", async () => {
    const first = await createDocument({
      title: "First",
      markdown: "# First",
      source: "blank",
    });
    const second = await createDocument({
      title: "Second",
      markdown: "# Second",
      source: "imported",
    });

    await updateDocument(first.id, { lastOpenedAt: second.lastOpenedAt + 1000 });

    const documents = await listRecentDocuments();

    expect(documents.map((document) => document.title)).toEqual([
      "First",
      "Second",
    ]);
  });
});

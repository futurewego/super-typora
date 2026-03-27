import { beforeEach, describe, expect, it } from "vitest";

import {
  clearDraft,
  getDraft,
  listDrafts,
  saveDraft,
} from "@/lib/storage/drafts";
import { resetWorkbenchDatabase } from "@/lib/storage/documents";

describe("drafts repository", () => {
  beforeEach(async () => {
    await resetWorkbenchDatabase();
  });

  it("stores and retrieves draft snapshots by doc id", async () => {
    await saveDraft({ docId: "doc-1", markdown: "# Draft", savedAt: 111 });

    const draft = await getDraft("doc-1");

    expect(draft).toEqual({ docId: "doc-1", markdown: "# Draft", savedAt: 111 });
  });

  it("clears a draft and removes it from the draft list", async () => {
    await saveDraft({ docId: "doc-1", markdown: "# Draft", savedAt: 111 });
    await clearDraft("doc-1");

    expect(await getDraft("doc-1")).toBeUndefined();
    expect(await listDrafts()).toEqual([]);
  });
});

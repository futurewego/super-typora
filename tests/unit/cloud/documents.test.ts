import { beforeEach, describe, expect, it } from "vitest";

import {
  createCloudDocument,
  getCloudDocument,
  listCloudDocuments,
  listCloudVersions,
  resetCloudStore,
  updateCloudDocument,
} from "@/lib/cloud/store";

describe("cloud documents", () => {
  beforeEach(() => {
    resetCloudStore();
  });

  it("creates a versioned cloud document", () => {
    const document = createCloudDocument({
      userId: "user-1",
      title: "Notes",
      markdown: "# Notes",
    });

    expect(getCloudDocument("user-1", document.id)).toEqual(document);
    expect(listCloudDocuments("user-1")).toEqual([document]);
    expect(listCloudVersions("user-1", document.id)).toHaveLength(1);
  });

  it("increments version on update and rejects stale writes", () => {
    const document = createCloudDocument({
      userId: "user-1",
      title: "Notes",
      markdown: "# Notes",
    });

    const updated = updateCloudDocument({
      userId: "user-1",
      docId: document.id,
      markdown: "# Updated",
      baseVersion: 1,
    });

    expect(updated).toMatchObject({ ok: true });
    if (updated.ok) {
      expect(updated.document.version).toBe(2);
    }

    const conflict = updateCloudDocument({
      userId: "user-1",
      docId: document.id,
      markdown: "# Stale",
      baseVersion: 1,
    });

    expect(conflict).toMatchObject({ ok: false, reason: "conflict" });
  });
});

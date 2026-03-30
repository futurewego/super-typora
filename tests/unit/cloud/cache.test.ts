import { beforeEach, describe, expect, it } from "vitest";

import {
  getCachedDocument,
  getCachedWorkspace,
  saveCachedDocument,
  saveCachedWorkspace,
} from "@/lib/cloud/cache";

describe("cloud cache", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores and restores workspace and document cache", () => {
    saveCachedWorkspace([
      {
        id: "doc-1",
        title: "Cached",
        markdown: "# Cached",
        source: "cloud",
        createdAt: 1,
        updatedAt: 2,
        lastOpenedAt: 3,
      },
    ]);

    saveCachedDocument({
      id: "doc-1",
      title: "Cached",
      markdown: "# Cached",
      source: "cloud",
      createdAt: 1,
      updatedAt: 2,
      lastOpenedAt: 3,
    });

    expect(getCachedWorkspace()?.recentDocs[0].title).toBe("Cached");
    expect(getCachedDocument("doc-1")?.markdown).toBe("# Cached");
  });
});

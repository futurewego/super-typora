import { beforeEach, describe, expect, it } from "vitest";

import {
  createCloudDocument,
  recordSyncEvent,
  resetCloudStore,
} from "@/lib/cloud/store";

describe("cloud sync", () => {
  beforeEach(() => {
    resetCloudStore();
  });

  it("records a sync event for a document change", () => {
    const document = createCloudDocument({
      userId: "user-1",
      title: "Notes",
      markdown: "# Notes",
    });

    const event = recordSyncEvent({
      userId: "user-1",
      deviceId: "device-1",
      docId: document.id,
      baseVersion: 1,
      nextVersion: 2,
      markdown: "# Updated",
    });

    expect(event.docId).toBe(document.id);
    expect(event.nextVersion).toBe(2);
  });
});

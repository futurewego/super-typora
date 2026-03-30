import { beforeEach, describe, expect, it } from "vitest";

import {
  createSession,
  getAccountById,
  getSession,
  listDevices,
  resetCloudStore,
} from "@/lib/cloud/store";

describe("cloud session", () => {
  beforeEach(() => {
    resetCloudStore();
  });

  it("creates an account session and device record", () => {
    const { account, session, device } = createSession(
      "marvin@example.com",
      "device-1",
    );

    expect(account.email).toBe("marvin@example.com");
    expect(getSession(session.id)).toEqual(session);
    expect(getAccountById(account.id)).toEqual(account);
    expect(listDevices(account.id)).toEqual([device]);
  });
});

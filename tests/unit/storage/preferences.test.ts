import { beforeEach, describe, expect, it } from "vitest";

import {
  getPreferences,
  resetPreferences,
  savePreferences,
} from "@/lib/storage/preferences";

describe("preferences storage", () => {
  beforeEach(() => {
    resetPreferences();
  });

  it("returns default preferences when nothing is saved", () => {
    expect(getPreferences()).toEqual({
      theme: "light",
      language: "zh",
    });
  });

  it("persists updated preferences independently", () => {
    savePreferences({ theme: "dark", language: "en" });

    expect(getPreferences()).toEqual({
      theme: "dark",
      language: "en",
    });
  });
});

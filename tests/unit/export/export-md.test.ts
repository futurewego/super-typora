import { describe, expect, it } from "vitest";

import { buildMarkdownDownload } from "@/lib/export/export-md";

describe("buildMarkdownDownload", () => {
  it("builds a markdown download payload with md extension", () => {
    const result = buildMarkdownDownload("Notes", "# Hello");

    expect(result.fileName).toBe("Notes.md");
    expect(result.mimeType).toBe("text/markdown;charset=utf-8");
    expect(result.content).toBe("# Hello");
  });
});

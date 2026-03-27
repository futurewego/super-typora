import { describe, expect, it } from "vitest";

import { buildHtmlDocument } from "@/lib/export/export-html";

describe("buildHtmlDocument", () => {
  it("wraps rendered markdown in a full html document", () => {
    const html = buildHtmlDocument("Notes", "<h1>Hello</h1>");

    expect(html).toContain("<title>Notes</title>");
    expect(html).toContain("<h1>Hello</h1>");
  });
});

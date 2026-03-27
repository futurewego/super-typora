import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EditorShell } from "@/components/editor/editor-shell";

vi.mock("@/components/editor/markdown-editor", () => ({
  MarkdownEditor: ({ value }: { value: string }) => (
    <textarea aria-label="Markdown Editor" value={value} readOnly />
  ),
}));

describe("fullscreen modes", () => {
  it("supports editor fullscreen mode", async () => {
    const user = userEvent.setup();

    render(
      <EditorShell
        initialDocument={{
          id: "doc-1",
          title: "Draft",
          markdown: "# Draft",
          source: "blank",
          createdAt: 1,
          updatedAt: 1,
          lastOpenedAt: 1,
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /编辑区全屏/i }));

    expect(screen.getByRole("heading", { name: /^编辑区$/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /^预览区$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /导出 markdown/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /退出全屏/i })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.getByRole("heading", { name: /^预览区$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /导出 markdown/i })).toBeInTheDocument();
  });
});

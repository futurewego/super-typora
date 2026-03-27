import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EditorShell } from "@/components/editor/editor-shell";

vi.mock("@/components/editor/markdown-editor", () => ({
  MarkdownEditor: ({ value }: { value: string }) => (
    <textarea aria-label="Markdown Editor" value={value} readOnly />
  ),
}));

describe("responsive editor layout", () => {
  it("renders a two-pane layout without outline controls", () => {
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

    expect(
      screen.queryByRole("heading", { name: /^outline$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /hide outline/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("resize-handle-editor-preview")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^预览区$/i })).toBeInTheDocument();
  });

  it("supports preview fullscreen mode", async () => {
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

    await user.click(screen.getByRole("button", { name: /预览区全屏/i }));

    expect(
      screen.queryByRole("heading", { name: /^编辑区$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /退出全屏/i })).toBeInTheDocument();
  });
});

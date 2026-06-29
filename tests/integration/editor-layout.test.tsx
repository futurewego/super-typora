import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { EditorShell } from "@/components/editor/editor-shell";
import { useEditorStore } from "@/stores/editor-store";

vi.mock("@/components/editor/markdown-editor", () => ({
  MarkdownEditor: ({ value }: { value: string }) => (
    <textarea aria-label="Markdown Editor" value={value} readOnly />
  ),
}));

vi.mock("@/components/editor/preview-pane", () => ({
  PreviewPane: ({ markdown }: { markdown: string }) => (
    <div data-testid="preview-pane">{markdown}</div>
  ),
}));

const doc = {
  id: "doc-1",
  title: "Draft",
  markdown: "# Hello",
  source: "blank" as const,
  createdAt: 1,
  updatedAt: 1,
  lastOpenedAt: 1,
};

describe("editor layout (split / editor-only / preview-only)", () => {
  beforeEach(() => {
    useEditorStore.setState({ layoutMode: "split" });
    window.localStorage.removeItem("super-markdown-workbench:layout");
  });

  it("split shows editor + preview + resize handle", () => {
    render(<EditorShell initialDocument={doc} />);
    expect(screen.getByLabelText(/markdown editor/i)).toBeInTheDocument();
    expect(screen.getByTestId("preview-pane")).toBeInTheDocument();
    expect(
      screen.getByTestId("resize-handle-editor-preview"),
    ).toBeInTheDocument();
  });

  it("toolbar switches to editor-only and preview-only", async () => {
    const user = userEvent.setup();
    render(<EditorShell initialDocument={doc} />);

    await user.click(screen.getByRole("button", { name: /editor only/i }));
    expect(screen.getByLabelText(/markdown editor/i)).toBeInTheDocument();
    expect(screen.queryByTestId("preview-pane")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("resize-handle-editor-preview"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /preview only/i }));
    expect(screen.getByTestId("preview-pane")).toBeInTheDocument();
    expect(screen.queryByLabelText(/markdown editor/i)).not.toBeInTheDocument();
  });

  it("dragging the handle to the right edge hides the preview", () => {
    render(<EditorShell initialDocument={doc} />);
    const grid = screen.getByTestId("editor-grid");
    Object.defineProperty(grid, "getBoundingClientRect", {
      value: () => ({ left: 0, width: 1000, top: 0, height: 600 }),
    });
    const handle = screen.getByTestId("resize-handle-editor-preview");
    fireEvent.mouseDown(handle, { clientX: 500 });
    fireEvent.mouseMove(window, { clientX: 980 }); // 贴右边缘
    fireEvent.mouseUp(window);
    expect(useEditorStore.getState().layoutMode).toBe("editor");
  });
});

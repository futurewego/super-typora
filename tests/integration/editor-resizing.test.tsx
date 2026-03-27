import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditorShell } from "@/components/editor/editor-shell";
import { resetPreferences } from "@/lib/storage/preferences";

vi.mock("@/components/editor/markdown-editor", () => ({
  MarkdownEditor: ({ value }: { value: string }) => (
    <textarea aria-label="Markdown Editor" value={value} readOnly />
  ),
}));

describe("editor resizing", () => {
  beforeEach(() => {
    resetPreferences();
    window.localStorage.removeItem("super-markdown-workbench:layout");
  });

  it("allows dragging the editor-preview divider and persists the widths", () => {
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

    const grid = screen.getByTestId("editor-grid");
    const handle = screen.getByTestId("resize-handle-editor-preview");

    expect(grid.getAttribute("style") ?? "").toContain("minmax(320px, 1fr)");

    fireEvent.mouseDown(handle, { clientX: 500 });
    fireEvent.mouseMove(window, { clientX: 620 });
    fireEvent.mouseUp(window);

    expect(grid.style.gridTemplateColumns).toContain("440px");
    expect(window.localStorage.getItem("super-markdown-workbench:layout")).toContain(
      '"editorWidth":440',
    );
  });
});

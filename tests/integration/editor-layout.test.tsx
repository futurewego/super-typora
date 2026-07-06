import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EditorShell } from "@/components/editor/editor-shell";

vi.mock("@/components/editor/wysiwyg-editor", () => ({
  WysiwygEditor: ({ value }: { value: string }) => (
    <textarea aria-label="WYSIWYG Editor" value={value} readOnly />
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

describe("editor layout (single WYSIWYG preview)", () => {
  it("renders only the single editable preview — no source editor, no split", () => {
    render(<EditorShell initialDocument={doc} />);

    expect(screen.getByLabelText(/wysiwyg editor/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/markdown editor/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("preview-pane"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("resize-handle-editor-preview"),
    ).not.toBeInTheDocument();
  });
});

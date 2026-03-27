import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { EditorShell } from "@/components/editor/editor-shell";

vi.mock("@/components/editor/markdown-editor", () => ({
  MarkdownEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      aria-label="Markdown Editor"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

describe("markdown editor", () => {
  it("marks the document dirty after typing", async () => {
    const user = userEvent.setup();

    render(
      <EditorShell
        initialDocument={{
          id: "doc-1",
          title: "Draft",
          markdown: "# Hello",
          source: "blank",
          createdAt: 1,
          updatedAt: 1,
          lastOpenedAt: 1,
        }}
      />,
    );

    await user.click(screen.getByLabelText(/markdown editor/i));
    await user.keyboard("\nNew line");

    expect(screen.getByText(/未保存/i)).toBeInTheDocument();
  });
});

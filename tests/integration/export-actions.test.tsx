import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditorShell } from "@/components/editor/editor-shell";

vi.mock("@/components/editor/markdown-editor", () => ({
  MarkdownEditor: ({
    value,
  }: {
    value: string;
  }) => <textarea aria-label="Markdown Editor" value={value} readOnly />,
}));

describe("export actions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("triggers markdown and html downloads from the toolbar", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-download");
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    render(
      <EditorShell
        initialDocument={{
          id: "doc-1",
          title: "Export Draft",
          markdown: "# Export Draft",
          source: "blank",
          createdAt: 1,
          updatedAt: 1,
          lastOpenedAt: 1,
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /导出 markdown/i }));
    await user.click(screen.getByRole("button", { name: /导出 html/i }));

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalledTimes(2);
      expect(clickSpy).toHaveBeenCalledTimes(2);
      expect(revokeObjectURL).toHaveBeenCalledTimes(2);
    });
  });
});

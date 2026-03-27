import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditorShell } from "@/components/editor/editor-shell";
import { WorkbenchShell } from "@/components/workbench/workbench-shell";
import { resetPreferences } from "@/lib/storage/preferences";

vi.mock("@/components/editor/markdown-editor", () => ({
  MarkdownEditor: ({ value }: { value: string }) => (
    <textarea aria-label="Markdown Editor" value={value} readOnly />
  ),
}));

describe("language and theme preferences", () => {
  beforeEach(() => {
    resetPreferences();
    document.documentElement.dataset.theme = "light";
  });

  it("toggles workbench copy between chinese and english", async () => {
    render(
      <WorkbenchShell
        recentDocs={[]}
        onCreate={() => {}}
        onImport={() => {}}
        onRecover={() => {}}
        onOpenDocument={() => {}}
        onToggleLanguage={() => {}}
        language="zh"
      />,
    );

    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /新建文档/i })).toBeInTheDocument();
  });

  it("toggles theme and remembers the preference", async () => {
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

    await user.click(screen.getByRole("button", { name: /深色模式/i }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(
      window.localStorage.getItem("super-markdown-workbench:preferences"),
    ).toContain('"theme":"dark"');
  });

  it("toggles editor copy between chinese and english", async () => {
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

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByRole("button", { name: /export markdown/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "中文" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /preview/i })).toBeInTheDocument();
  });
});

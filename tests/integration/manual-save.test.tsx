import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { EditorShell } from "@/components/editor/editor-shell";

const mocks = vi.hoisted(() => ({
  createCloudDocument: vi.fn(async () => ({
    document: {
      id: "local-doc-1",
      userId: "user-1",
      title: "Untitled",
      markdown: "# Untitled\nMore",
      source: "blank",
      version: 1,
      createdAt: 2,
      updatedAt: 2,
      lastOpenedAt: 2,
    },
  })),
}));

vi.mock("@/lib/cloud/http", () => ({
  createCloudDocument: mocks.createCloudDocument,
  updateCloudDocument: vi.fn(),
}));

vi.mock("@/lib/storage/documents", () => ({
  updateDocument: vi.fn(async (_id: string, patch: { title?: string; markdown?: string; updatedAt?: number; lastOpenedAt?: number }) => ({
    id: "local-doc-1",
    title: patch.title ?? "Untitled",
    markdown: patch.markdown ?? "# Untitled",
    source: "blank",
    createdAt: 1,
    updatedAt: patch.updatedAt ?? 1,
    lastOpenedAt: patch.lastOpenedAt ?? 1,
  })),
  createDocument: vi.fn(),
  listRecentDocuments: vi.fn(),
  getDocument: vi.fn(),
  resetWorkbenchDatabase: vi.fn(),
}));

vi.mock("@/lib/storage/drafts", () => ({
  saveDraft: vi.fn(),
}));

vi.mock("@/lib/storage/preferences", () => ({
  getPreferences: () => ({ language: "zh", theme: "light" }),
  savePreferences: vi.fn(),
}));

vi.mock("@/lib/theme/apply-theme", () => ({
  applyTheme: vi.fn(),
}));

vi.mock("@/lib/export/export-md", () => ({
  downloadMarkdown: vi.fn(),
}));

vi.mock("@/lib/export/export-html", () => ({
  downloadHtml: vi.fn(),
}));

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

describe("manual save", () => {
  it("uploads a local draft when save is clicked", async () => {
    const user = userEvent.setup();

    render(
      <EditorShell
        initialDocument={{
          id: "local-doc-1",
          title: "Untitled",
          markdown: "# Untitled",
          source: "blank",
          createdAt: 1,
          updatedAt: 1,
          lastOpenedAt: 1,
        }}
      />,
    );

    await user.type(screen.getByLabelText(/markdown editor/i), "\nMore");
    await user.click(screen.getByRole("button", { name: /保存/i }));

    expect(mocks.createCloudDocument).toHaveBeenCalledWith({
      id: "local-doc-1",
      title: "Untitled",
      markdown: "# Untitled\nMore",
      source: "blank",
    });
  });
});

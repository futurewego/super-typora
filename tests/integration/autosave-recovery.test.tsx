import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditorShell } from "@/components/editor/editor-shell";
import { getDraft } from "@/lib/storage/drafts";
import {
  createDocument,
  resetWorkbenchDatabase,
} from "@/lib/storage/documents";

vi.mock("@/lib/cloud/http", () => ({
  updateCloudDocument: vi.fn(async (_docId: string, input: { markdown?: string }) => ({
    document: {
      id: "doc-1",
      userId: "user-1",
      title: "Draft",
      markdown: input.markdown ?? "# Start",
      source: "cloud",
      version: 2,
      createdAt: 1,
      updatedAt: 2,
      lastOpenedAt: 2,
    },
  })),
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

describe("autosave and recovery", () => {
  beforeEach(async () => {
    await resetWorkbenchDatabase();
  });

  it("autosaves edits and returns to saved state", async () => {
    const document = await createDocument({
      title: "Draft",
      markdown: "# Start",
      source: "blank",
    });

    render(<EditorShell initialDocument={document} />);

    fireEvent.change(screen.getByLabelText(/markdown editor/i), {
      target: { value: "# Start\nMore" },
    });

    expect(screen.getByText(/未保存/i)).toBeInTheDocument();

    await waitFor(async () => {
      expect(screen.getByText(/已保存/i)).toBeInTheDocument();
      expect((await getDraft(document.id))?.markdown).toBe("# Start\nMore");
    }, { timeout: 2000 });
  });
});

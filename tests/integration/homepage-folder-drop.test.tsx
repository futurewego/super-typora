import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";

const push = vi.fn();

type FileEntryMock = {
  isFile: true;
  isDirectory: false;
  file: (callback: (file: File) => void) => void;
};

type DirectoryEntryMock = {
  isFile: false;
  isDirectory: true;
  createReader: () => {
    readEntries: (callback: (entries: DropEntryMock[]) => void) => void;
  };
};

type DropEntryMock = FileEntryMock | DirectoryEntryMock;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/cloud/http", () => ({
  getCurrentAccount: vi.fn(async () => ({
    account: { id: "user-1", email: "marvin@example.com" },
  })),
  listCloudDocuments: vi.fn(async () => ({ documents: [] })),
  createCloudDocument: vi.fn(async ({ title, markdown }: { title: string; markdown: string }) => ({
    document: {
      id: `${title}-id`,
      userId: "user-1",
      title,
      markdown,
      source: "imported",
      version: 1,
      createdAt: 1,
      updatedAt: 1,
      lastOpenedAt: 1,
    },
  })),
  updateCloudDocument: vi.fn(),
  logoutAccount: vi.fn(),
}));

vi.mock("@/lib/storage/preferences", () => ({
  getPreferences: () => ({ language: "zh", theme: "light", editorWidth: 50 }),
  savePreferences: vi.fn(),
}));

vi.mock("@/lib/storage/drafts", () => ({
  getDraft: vi.fn(),
  listDrafts: vi.fn().mockResolvedValue([]),
  saveDraft: vi.fn(),
}));

vi.mock("@/lib/utils/file", () => ({
  isMarkdownFile: (file: File) =>
    file.name.toLowerCase().endsWith(".md") ||
    file.type === "text/markdown" ||
    file.type === "text/plain",
  readMarkdownFile: vi.fn(async (file: File) => ({
    title: file.name.replace(/\.md$/i, ""),
    markdown: await file.text(),
  })),
}));

function createFileEntry(file: File) {
  return {
    isFile: true,
    isDirectory: false,
    file: (callback: (file: File) => void) => callback(file),
  } satisfies FileEntryMock;
}

function createDirectoryEntry(children: DropEntryMock[]) {
  let readCount = 0;

  return {
    isFile: false,
    isDirectory: true,
    createReader: () => ({
      readEntries: (callback: (entries: DropEntryMock[]) => void) => {
        readCount += 1;
        callback(readCount === 1 ? children : []);
      },
    }),
  } satisfies DirectoryEntryMock;
}

describe("homepage folder import", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("imports markdown files when a folder is dropped", async () => {
    render(<HomePage />);

    const zone = await screen.findByTestId("project-import-zone");

    const first = new File(["# One"], "one.md", { type: "text/markdown" });
    const second = new File(["# Two"], "two.md", { type: "text/markdown" });

    fireEvent.drop(zone, {
      dataTransfer: {
        items: [
          {
            kind: "file",
            webkitGetAsEntry: () =>
              createDirectoryEntry([createFileEntry(first), createFileEntry(second)]),
          },
        ],
        files: [],
      },
    });

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/editor/one-id");
    });
  });
});

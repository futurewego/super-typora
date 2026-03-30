import { describe, expect, it } from "vitest";

import { collectMarkdownFilesFromDrop } from "@/lib/utils/import-drop";

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

function createFile(name: string, type = "text/markdown") {
  return new File([`# ${name}`], name, { type });
}

function createFileEntry(file: File) {
  return {
    isFile: true,
    isDirectory: false,
    file: (callback: (file: File) => void) => callback(file),
  } satisfies FileEntryMock;
}

function createDirectoryEntry(name: string, children: DropEntryMock[]) {
  let readCount = 0;

  return {
    isFile: false,
    isDirectory: true,
    name,
    createReader: () => ({
      readEntries: (callback: (entries: DropEntryMock[]) => void) => {
        readCount += 1;
        callback(readCount === 1 ? children : []);
      },
    }),
  } satisfies DirectoryEntryMock;
}

describe("collectMarkdownFilesFromDrop", () => {
  it("collects markdown files from nested directory drops", async () => {
    const folder = createDirectoryEntry("project", [
      createFileEntry(createFile("readme.md")),
      createDirectoryEntry("docs", [
        createFileEntry(createFile("spec.MD")),
        createFileEntry(createFile("image.png", "image/png")),
      ]),
    ]);

    const result = await collectMarkdownFilesFromDrop({
      items: [
        { kind: "file", getAsFile: () => createFile("draft.md") },
        { kind: "file", webkitGetAsEntry: () => folder },
      ],
      files: [createFile("notes.md")],
    });

    expect(result.map((file) => file.name).sort()).toEqual([
      "draft.md",
      "readme.md",
      "spec.MD",
    ]);
  });

  it("falls back to plain files when entries are unavailable", async () => {
    const result = await collectMarkdownFilesFromDrop({
      items: [],
      files: [createFile("notes.md"), createFile("todo.bin", "application/octet-stream")],
    });

    expect(result.map((file) => file.name)).toEqual(["notes.md"]);
  });
});

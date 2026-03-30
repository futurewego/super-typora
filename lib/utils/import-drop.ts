import { isMarkdownFile } from "@/lib/utils/file";

type FileSystemFileEntryLike = {
  isFile: true;
  isDirectory: false;
  file: (callback: (file: File) => void) => void;
};

type FileSystemDirectoryEntryLike = {
  isFile: false;
  isDirectory: true;
  createReader: () => {
    readEntries: (callback: (entries: DropEntryLike[]) => void) => void;
  };
};

type DropEntryLike = FileSystemFileEntryLike | FileSystemDirectoryEntryLike;

type DropItemLike = {
  kind: string;
  webkitGetAsEntry?: () => DropEntryLike | null;
  getAsFile?: () => File | null;
};

type DropSourceLike = {
  items?: ArrayLike<DropItemLike>;
  files?: ArrayLike<File>;
};

async function readDirectoryEntries(entry: FileSystemDirectoryEntryLike) {
  const reader = entry.createReader();
  const entries: DropEntryLike[] = [];

  while (true) {
    const batch = await new Promise<DropEntryLike[]>((resolve) => {
      reader.readEntries((nextEntries) => {
        resolve(nextEntries);
      });
    });

    if (batch.length === 0) {
      break;
    }

    entries.push(...batch);
  }

  return entries;
}

async function collectFilesFromEntry(entry: DropEntryLike): Promise<File[]> {
  if (entry.isFile) {
    return await new Promise<File[]>((resolve) => {
      entry.file((file) => {
        resolve(isMarkdownFile(file) ? [file] : []);
      });
    });
  }

  const children = await readDirectoryEntries(entry);
  const nested = await Promise.all(children.map((child) => collectFilesFromEntry(child)));

  return nested.flat();
}

export async function collectMarkdownFilesFromDrop(source: DropSourceLike) {
  const collectedFromItems: File[] = [];

  for (const item of Array.from(source.items ?? [])) {
    const entry = item.webkitGetAsEntry?.();

    if (entry) {
      collectedFromItems.push(...(await collectFilesFromEntry(entry)));
      continue;
    }

    const file = item.getAsFile?.();

    if (file && isMarkdownFile(file)) {
      collectedFromItems.push(file);
    }
  }

  if (collectedFromItems.length > 0) {
    return collectedFromItems;
  }

  return Array.from(source.files ?? []).filter(isMarkdownFile);
}

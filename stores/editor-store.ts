import { create } from "zustand";

import type { StoredDocument } from "@/types/document";

export type SaveState = "dirty" | "saving" | "saved" | "error";

interface EditorStore {
  document: StoredDocument | null;
  title: string;
  markdown: string;
  saveState: SaveState;
  hydrateFromDocument: (document: StoredDocument) => void;
  setTitle: (title: string) => void;
  setMarkdown: (markdown: string) => void;
  setSaveState: (saveState: SaveState) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  document: null,
  title: "",
  markdown: "",
  saveState: "saved",
  hydrateFromDocument: (document) => {
    set({
      document,
      title: document.title,
      markdown: document.markdown,
      saveState: "saved",
    });
  },
  setTitle: (title) => {
    set({ title });
  },
  setMarkdown: (markdown) => {
    set({ markdown });
  },
  setSaveState: (saveState) => {
    set({ saveState });
  },
}));

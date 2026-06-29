import { create } from "zustand";

import type { StoredDocument } from "@/types/document";

export type SaveState = "dirty" | "saving" | "saved" | "error";
export type EditMode = "wysiwyg" | "source";

interface EditorStore {
  document: StoredDocument | null;
  title: string;
  markdown: string;
  saveState: SaveState;
  hydrateFromDocument: (document: StoredDocument) => void;
  setTitle: (title: string) => void;
  setMarkdown: (markdown: string) => void;
  setSaveState: (saveState: SaveState) => void;
  // 文件抽屉开合：☰ 按钮（toolbar/空状态）与抽屉本体在不同子树，用 store 共享
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  // 编辑模式：所见即所得（默认）↔ 纯 markdown 源码
  editMode: EditMode;
  setEditMode: (mode: EditMode) => void;
  toggleEditMode: () => void;
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
  drawerOpen: false,
  openDrawer: () => {
    set({ drawerOpen: true });
  },
  closeDrawer: () => {
    set({ drawerOpen: false });
  },
  toggleDrawer: () => {
    set((state) => ({ drawerOpen: !state.drawerOpen }));
  },
  editMode: "wysiwyg",
  setEditMode: (editMode) => {
    set({ editMode });
  },
  toggleEditMode: () => {
    set((state) => ({
      editMode: state.editMode === "wysiwyg" ? "source" : "wysiwyg",
    }));
  },
}));

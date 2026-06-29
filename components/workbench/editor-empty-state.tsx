"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { useWorkspaceActions } from "@/lib/hooks/use-workspace-actions";
import { getMessages } from "@/lib/i18n/messages";
import { getPreferences } from "@/lib/storage/preferences";
import { collectMarkdownFilesFromDrop } from "@/lib/utils/import-drop";
import { useEditorStore } from "@/stores/editor-store";

/**
 * 无文档时的工作区空状态（替代原 "Document not found" 死胡同卡片）。
 * 非营销：☰ 打开抽屉 + 新建/打开按钮 + 拖拽导入区。
 */
export function EditorEmptyState() {
  const openDrawer = useEditorStore((state) => state.openDrawer);
  const { createNewDocument, openFileDialog, importFiles } = useWorkspaceActions();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const copy = getMessages(getPreferences().language);

  async function handleOpen() {
    const handled = await openFileDialog();
    if (!handled) {
      fileInputRef.current?.click();
    }
  }

  async function handleImportInput(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    await importFiles(files);
  }

  function isFileDrop(event: DragEvent<HTMLDivElement>) {
    return Boolean(event.dataTransfer.items?.length || event.dataTransfer.files?.length);
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!isFileDrop(event)) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!isFileDrop(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!isFileDrop(event)) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (!isFileDrop(event)) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    const files = await collectMarkdownFilesFromDrop(
      event.dataTransfer as unknown as Parameters<typeof collectMarkdownFilesFromDrop>[0],
    );
    await importFiles(files);
  }

  return (
    <main className="flex flex-1 flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,text/markdown,text/plain"
        multiple
        className="hidden"
        onChange={(event) => {
          void handleImportInput(event);
        }}
      />

      {/* 可拖拽标题栏：左侧留交通灯，☰ 打开抽屉 */}
      <header className="titlebar flex items-center pl-20 pr-4">
        <button
          type="button"
          onClick={openDrawer}
          aria-label="Open files"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--muted)] transition-colors hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--foreground)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(event) => {
          void handleDrop(event);
        }}
        className={`flex flex-1 items-center justify-center px-8 pb-16 transition-colors ${
          isDragging ? "bg-[color:var(--accent-soft)]" : ""
        }`}
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="text-base text-[color:var(--muted)]">{copy.noDocuments}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void createNewDocument();
              }}
              className="flex items-center gap-1.5 rounded-md bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {copy.createDocument}
            </button>
            <button
              type="button"
              onClick={() => {
                void handleOpen();
              }}
              className="flex items-center gap-1.5 rounded-md border border-[color:var(--line)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--accent-soft)]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              {copy.openFile}
            </button>
          </div>
          <p className="text-xs text-[color:var(--muted)]">
            {copy.importMarkdown} · ⌘\
          </p>
        </div>
      </div>
    </main>
  );
}

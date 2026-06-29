"use client";

import { useEffect, useRef, type ChangeEvent } from "react";

import { useRecentDocuments } from "@/lib/hooks/use-recent-documents";
import { useWorkspaceActions } from "@/lib/hooks/use-workspace-actions";
import { getMessages } from "@/lib/i18n/messages";
import { getPreferences } from "@/lib/storage/preferences";
import { useEditorStore } from "@/stores/editor-store";

/**
 * 可呼出的左侧文件抽屉（覆盖式，非布局列）。
 * ☰ 触发 / Esc 或点遮罩关闭。数据复用 useRecentDocuments，动作复用 useWorkspaceActions。
 */
export function FileDrawer() {
  const drawerOpen = useEditorStore((state) => state.drawerOpen);
  const closeDrawer = useEditorStore((state) => state.closeDrawer);
  const { recentDocs, recoverableDraft, reload } = useRecentDocuments();
  const { createNewDocument, openFileDialog, importFiles, recoverDraft, openDocument } =
    useWorkspaceActions();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const copy = getMessages(getPreferences().language);

  // 抽屉打开时刷新最近文档，保证看到最新列表
  useEffect(() => {
    if (drawerOpen) {
      reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

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

  return (
    <>
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

      {/* 遮罩 */}
      <div
        aria-hidden={!drawerOpen}
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 bg-black/25 transition-opacity duration-200 ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* 抽屉面板 */}
      <aside
        className={`app-no-drag fixed left-0 top-0 z-50 flex h-full w-[286px] flex-col border-r border-[color:var(--line)] bg-[color:var(--surface-strong)] shadow-[var(--shadow)] transition-transform duration-200 ease-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 顶部留白给交通灯 + 标题 */}
        <div className="flex h-[52px] items-center justify-between px-4 pt-2">
          <span className="pl-14 text-sm font-semibold text-[color:var(--foreground)]">
            {copy.recentDocuments}
          </span>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--muted)] transition-colors hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--foreground)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* 动作区 */}
        <div className="flex gap-2 px-3 pb-3">
          <button
            type="button"
            onClick={() => {
              void createNewDocument();
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[color:var(--accent)] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
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
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[color:var(--line)] px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--accent-soft)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            {copy.openFile}
          </button>
        </div>

        {/* 最近文档列表 */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {recentDocs.length > 0 ? (
            <ul className="space-y-0.5">
              {recentDocs.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => {
                      closeDrawer();
                      void openDocument(doc.id);
                    }}
                    title={`${copy.sourceLabels[doc.source]} · ${new Date(doc.updatedAt).toLocaleString()}`}
                    className="block w-full truncate rounded-md px-2.5 py-2 text-left text-sm text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--accent-soft)]"
                  >
                    {doc.title || "Untitled"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2.5 py-6 text-center text-sm text-[color:var(--muted)]">
              {copy.noDocuments}
            </p>
          )}
        </div>

        {/* 可恢复草稿 */}
        {recoverableDraft ? (
          <div className="border-t border-[color:var(--line)] px-3 py-3">
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                void recoverDraft(recoverableDraft.docId);
              }}
              className="block w-full truncate text-left text-sm text-[color:var(--accent)] hover:underline"
            >
              {copy.continueDraft} · {recoverableDraft.title}
            </button>
          </div>
        ) : null}
      </aside>
    </>
  );
}

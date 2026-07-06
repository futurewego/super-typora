"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { useRecentDocuments } from "@/lib/hooks/use-recent-documents";
import { useWorkspaceActions } from "@/lib/hooks/use-workspace-actions";
import { getMessages } from "@/lib/i18n/messages";
import { getPreferences } from "@/lib/storage/preferences";
import { collectMarkdownFilesFromDrop } from "@/lib/utils/import-drop";
import { useEditorStore } from "@/stores/editor-store";

/**
 * 无文档时的工作区空状态。
 * 品牌标识 + 高对比标题 + 新建/打开 + 最近文档记录 + 拖拽导入区。
 */
export function EditorEmptyState() {
  const openDrawer = useEditorStore((state) => state.openDrawer);
  const { createNewDocument, openFileDialog, importFiles, openDocument } =
    useWorkspaceActions();
  const { recentDocs } = useRecentDocuments();
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
        <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
          {/* 品牌标识 */}
          <div className="flex flex-col items-center gap-3">
            <BrandMark />
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)]">
                superTypora
              </h1>
              <p className="text-sm text-[color:var(--muted)]">{copy.noDocuments}</p>
            </div>
          </div>

          {/* 主操作 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void createNewDocument();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {copy.createDocument}
            </button>
            <button
              type="button"
              onClick={() => {
                void handleOpen();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-5 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--accent-soft)]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              {copy.openFile}
            </button>
          </div>

          {/* 最近文档记录 */}
          {recentDocs.length > 0 ? (
            <div className="w-full text-left">
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                {copy.recentDocuments}
              </h2>
              <ul className="flex flex-col gap-0.5 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-1.5">
                {recentDocs.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => {
                        void openDocument(doc.id);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[color:var(--accent-soft)]"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[color:var(--muted)]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                      </svg>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[color:var(--foreground)]">
                        {doc.title || "Untitled"}
                      </span>
                      <span className="shrink-0 text-xs text-[color:var(--muted)]">
                        {formatWhen(doc.lastOpenedAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-xs text-[color:var(--muted)]">
            {copy.importMarkdown} · ⌘\
          </p>
        </div>
      </div>
    </main>
  );
}

/** 品牌标记：深色圆角方块 + 蓝色 S + 白色 ↓，与应用图标一致。 */
function BrandMark() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-gradient-to-b from-[#252e39] to-[#0a0d11] shadow-md">
      <svg viewBox="0 0 1024 1024" className="h-9 w-9" aria-hidden>
        <defs>
          <linearGradient id="empty-brand-blue" x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#62acff" />
            <stop offset="1" stopColor="#0a84ff" />
          </linearGradient>
        </defs>
        <text
          x="455"
          y="690"
          textAnchor="middle"
          fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
          fontSize="600"
          fontWeight="800"
          fontStyle="italic"
          fill="url(#empty-brand-blue)"
        >
          S
        </text>
        <g stroke="#eef5ff" strokeWidth="72" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M726 452 L726 690" />
          <path d="M641 605 L726 700 L811 605" />
        </g>
      </svg>
    </div>
  );
}

/** 最近文档时间：今天显示时:分，否则显示短日期。 */
function formatWhen(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

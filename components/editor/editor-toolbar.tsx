"use client";

import { useCallback, useRef, useState } from "react";

import type { AppLanguage } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/messages";
import { SaveIndicator } from "@/components/editor/save-indicator";
import type { SaveState } from "@/stores/editor-store";
import { useEditorStore } from "@/stores/editor-store";

interface EditorToolbarProps {
  title: string;
  saveState: SaveState;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onExportMarkdown: () => void;
  onExportHtml: () => void;
  onToggleLanguage: () => void;
  language: AppLanguage;
  // 编辑/只读模式切换：默认只读预览，点击进入编辑
  isEditing: boolean;
  onToggleEdit: () => void;
}

const buttonClass =
  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-[color:var(--muted)] transition-colors hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--foreground)]";

export function EditorToolbar({
  title,
  saveState,
  onTitleChange,
  onSave,
  onExportMarkdown,
  onExportHtml,
  onToggleLanguage,
  language,
  isEditing,
  onToggleEdit,
}: EditorToolbarProps) {
  const copy = getMessages(language);
  const toggleDrawer = useEditorStore((state) => state.toggleDrawer);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 复制全文：抓取所见即所得编辑区(.milkdown)的富文本，优先 text/html，降级纯文本
  const handleCopy = useCallback(async () => {
    if (typeof document === "undefined") {
      return;
    }
    const node = document.querySelector(".milkdown") as HTMLElement | null;
    if (!node) {
      return;
    }
    const html = node.innerHTML;
    const text = node.innerText;

    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
      copiedTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板权限被拒时静默失败，不打断编辑
    }
  }, []);

  return (
    <header className="flex items-center gap-2 border-b border-[color:var(--line)] px-3 py-2">
      {/* ☰ 抽屉切换（macOS 侧栏惯例，最左） */}
      <button
        type="button"
        onClick={toggleDrawer}
        aria-label="Toggle files"
        className="flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--muted)] transition-colors hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--foreground)]"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <input
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-base font-semibold tracking-[-0.01em] outline-none"
      />

      <div className="flex items-center gap-1">
        {/* 编辑/预览模式切换：默认只读，编辑态用 accent 实底高亮 */}
        <button
          type="button"
          onClick={onToggleEdit}
          aria-pressed={isEditing}
          title={
            isEditing
              ? language === "zh"
                ? "退出编辑（预览）"
                : "Preview"
              : language === "zh"
                ? "进入编辑"
                : "Edit"
          }
          className={
            isEditing
              ? "flex items-center gap-1.5 rounded-md bg-[color:var(--accent)] px-2.5 py-1.5 text-sm text-white transition-colors"
              : buttonClass
          }
        >
          {isEditing ? (
            <>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {language === "zh" ? "预览" : "Preview"}
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              {language === "zh" ? "编辑" : "Edit"}
            </>
          )}
        </button>
        {/* 复制全文（富文本） */}
        <button
          type="button"
          onClick={() => {
            void handleCopy();
          }}
          aria-label="Copy content"
          title={
            copied
              ? language === "zh"
                ? "已复制"
                : "Copied"
              : language === "zh"
                ? "复制全文"
                : "Copy"
          }
          className={buttonClass}
        >
          {copied ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
        <button type="button" onClick={onToggleLanguage} className={buttonClass}>
          {copy.languageSwitch}
        </button>
        <button type="button" onClick={onSave} className={buttonClass}>
          {copy.toolbar.save}
        </button>
        <button type="button" onClick={onExportHtml} className={buttonClass}>
          {copy.toolbar.exportHtml}
        </button>
        <button type="button" onClick={onExportMarkdown} className={buttonClass}>
          {copy.toolbar.exportMarkdown}
        </button>
        <SaveIndicator saveState={saveState} language={language} />
      </div>
    </header>
  );
}

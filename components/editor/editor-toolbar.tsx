"use client";

import type { AppLanguage } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/messages";
import { SaveIndicator } from "@/components/editor/save-indicator";
import type { LayoutMode, SaveState } from "@/stores/editor-store";
import { useEditorStore } from "@/stores/editor-store";

interface EditorToolbarProps {
  title: string;
  saveState: SaveState;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onExportMarkdown: () => void;
  onExportHtml: () => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onSetLayoutMode: (mode: LayoutMode) => void;
  theme: "light" | "dark";
  language: AppLanguage;
  layoutMode: LayoutMode;
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
  onToggleTheme,
  onToggleLanguage,
  onSetLayoutMode,
  theme,
  language,
  layoutMode,
}: EditorToolbarProps) {
  const copy = getMessages(language);
  const toggleDrawer = useEditorStore((state) => state.toggleDrawer);

  const segClass = (active: boolean) =>
    `flex h-7 w-8 items-center justify-center rounded transition-colors ${
      active
        ? "bg-[color:var(--surface-strong)] text-[color:var(--accent)] shadow-sm"
        : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
    }`;

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
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "light" ? copy.toolbar.darkMode : copy.toolbar.lightMode}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--muted)] transition-colors hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--foreground)]"
        >
          {theme === "light" ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </button>
        {/* 布局三态：仅编辑 / 并排 / 仅预览 */}
        <div className="flex items-center gap-0.5 rounded-md bg-[color:var(--accent-soft)] p-0.5">
          <button
            type="button"
            onClick={() => onSetLayoutMode("editor")}
            aria-label="Editor only"
            title="Editor only"
            className={segClass(layoutMode === "editor")}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="5" width="16" height="14" rx="2" />
              <path d="M8 9h8M8 13h6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onSetLayoutMode("split")}
            aria-label="Split view"
            title="Split view"
            className={segClass(layoutMode === "split")}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="5" width="16" height="14" rx="2" />
              <path d="M12 5v14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onSetLayoutMode("preview")}
            aria-label="Preview only"
            title="Preview only"
            className={segClass(layoutMode === "preview")}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
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

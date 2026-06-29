"use client";

import type { AppLanguage } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/messages";
import { SaveIndicator } from "@/components/editor/save-indicator";
import type { EditMode, SaveState } from "@/stores/editor-store";
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
  onToggleEditMode: () => void;
  theme: "light" | "dark";
  language: AppLanguage;
  editMode: EditMode;
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
  onToggleEditMode,
  theme,
  language,
  editMode,
}: EditorToolbarProps) {
  const copy = getMessages(language);
  const toggleDrawer = useEditorStore((state) => state.toggleDrawer);

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
        {/* 所见即所得 ↔ markdown 源码 切换 */}
        <button
          type="button"
          onClick={onToggleEditMode}
          aria-label={editMode === "wysiwyg" ? "Source mode" : "Preview mode"}
          title={editMode === "wysiwyg" ? "Source mode" : "Preview mode"}
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--accent-soft)] ${
            editMode === "source"
              ? "text-[color:var(--accent)]"
              : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13 6l-2 12" />
          </svg>
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

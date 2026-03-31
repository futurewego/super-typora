import type { AppLanguage } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/messages";
import { SaveIndicator } from "@/components/editor/save-indicator";
import type { SaveState } from "@/stores/editor-store";

interface EditorToolbarProps {
  title: string;
  saveState: SaveState;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onExportMarkdown: () => void;
  onExportHtml: () => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onEditorFullscreen: () => void;
  onPreviewFullscreen: () => void;
  onExitFullscreen: () => void;
  theme: "light" | "dark";
  language: AppLanguage;
  fullscreenMode: "none" | "editor" | "preview";
}

export function EditorToolbar({
  title,
  saveState,
  onTitleChange,
  onSave,
  onExportMarkdown,
  onExportHtml,
  onToggleTheme,
  onToggleLanguage,
  onEditorFullscreen,
  onPreviewFullscreen,
  onExitFullscreen,
  theme,
  language,
  fullscreenMode,
}: EditorToolbarProps) {
  const copy = getMessages(language);

  return (
    <header className="flex flex-col gap-4 border-b border-[color:var(--line)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0 flex-1">
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="w-full bg-transparent text-2xl font-semibold tracking-[-0.05em] outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onToggleLanguage}
          className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]"
        >
          {copy.languageSwitch}
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]"
        >
          {copy.toolbar.save}
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]"
        >
          {theme === "light" ? copy.toolbar.darkMode : copy.toolbar.lightMode}
        </button>
        {fullscreenMode === "none" ? (
          <>
            <button
              type="button"
              onClick={onEditorFullscreen}
              className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]"
            >
              {copy.toolbar.editorFullscreen}
            </button>
            <button
              type="button"
              onClick={onPreviewFullscreen}
              className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]"
            >
              {copy.toolbar.previewFullscreen}
            </button>
            <button
              type="button"
              onClick={onExportHtml}
              className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]"
            >
              {copy.toolbar.exportHtml}
            </button>
            <button
              type="button"
              onClick={onExportMarkdown}
              className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]"
            >
              {copy.toolbar.exportMarkdown}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onExitFullscreen}
            className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]"
          >
            {copy.toolbar.exitFullscreen}
          </button>
        )}
        <SaveIndicator saveState={saveState} language={language} />
      </div>
    </header>
  );
}

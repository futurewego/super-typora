"use client";

import { useEffect, useState } from "react";

import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { PreviewPane } from "@/components/editor/preview-pane";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { downloadHtml } from "@/lib/export/export-html";
import { downloadMarkdown } from "@/lib/export/export-md";
import { saveCachedDocument } from "@/lib/cloud/cache";
import { updateCloudDocument } from "@/lib/cloud/http";
import type { AppLanguage } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/messages";
import { saveDraft } from "@/lib/storage/drafts";
import { getPreferences, savePreferences } from "@/lib/storage/preferences";
import { applyTheme } from "@/lib/theme/apply-theme";
import { debounce } from "@/lib/utils/debounce";
import { useEditorStore } from "@/stores/editor-store";
import type { StoredDocument } from "@/types/document";

interface EditorShellProps {
  initialDocument: StoredDocument;
}

interface EditorLayoutState {
  editorWidth?: number;
}

const LAYOUT_STORAGE_KEY = "super-markdown-workbench:layout";
const DEFAULT_EDITOR_MIN = 320;
const DEFAULT_PREVIEW_MIN = 320;

function readLayoutState(): EditorLayoutState {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as EditorLayoutState;
  } catch {
    return {};
  }
}

function writeLayoutState(nextState: EditorLayoutState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(nextState));
}

export function EditorShell({ initialDocument }: EditorShellProps) {
  const [theme, setTheme] = useState<"light" | "dark">(
    () => getPreferences().theme,
  );
  const [language, setLanguage] = useState<AppLanguage>(
    () => getPreferences().language,
  );
  const [layout, setLayout] = useState<EditorLayoutState>(() => readLayoutState());
  const [fullscreenMode, setFullscreenMode] = useState<"none" | "editor" | "preview">("none");

  const title = useEditorStore((state) => state.title);
  const markdown = useEditorStore((state) => state.markdown);
  const saveState = useEditorStore((state) => state.saveState);
  const document = useEditorStore((state) => state.document);
  const hydrateFromDocument = useEditorStore(
    (state) => state.hydrateFromDocument,
  );
  const setTitle = useEditorStore((state) => state.setTitle);
  const setMarkdown = useEditorStore((state) => state.setMarkdown);
  const setSaveState = useEditorStore((state) => state.setSaveState);

  const copy = getMessages(language);

  useEffect(() => {
    hydrateFromDocument(initialDocument);
  }, [hydrateFromDocument, initialDocument]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreenMode("none");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    writeLayoutState(layout);
  }, [layout]);

  useEffect(() => {
    if (!document) {
      return;
    }

    const hasPendingChanges =
      title !== document.title || markdown !== document.markdown;

    if (!hasPendingChanges) {
      return;
    }

    const saveLater = debounce(async () => {
      try {
        setSaveState("saving");
        const savedAt = Date.now();

        await saveDraft({
          docId: document.id,
          markdown,
          savedAt,
        });

        const { document: savedDocument } = await updateCloudDocument(
          document.id,
          {
            title,
            markdown,
            baseVersion: document.version,
            lastOpenedAt: savedAt,
          },
        );

        hydrateFromDocument(savedDocument);
        saveCachedDocument(savedDocument);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 500);

    saveLater();

    return () => {
      saveLater.cancel();
    };
  }, [document, hydrateFromDocument, markdown, setSaveState, title]);

  function beginResize(event: React.MouseEvent<HTMLDivElement>) {
    if (fullscreenMode !== "none") {
      return;
    }

    event.preventDefault();

    const startX = event.clientX;
    const startEditorWidth = layout.editorWidth ?? DEFAULT_EDITOR_MIN;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setLayout((current) => ({
        ...current,
        editorWidth: Math.max(DEFAULT_EDITOR_MIN, startEditorWidth + delta),
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  const baseColumns = layout.editorWidth
    ? `${layout.editorWidth}px 10px minmax(${DEFAULT_PREVIEW_MIN}px, 1fr)`
    : `minmax(${DEFAULT_EDITOR_MIN}px, 1fr) 10px minmax(${DEFAULT_PREVIEW_MIN}px, 1fr)`;

  const gridTemplateColumns =
    fullscreenMode === "editor"
      ? "minmax(0, 1fr)"
      : fullscreenMode === "preview"
        ? "minmax(0, 1fr)"
        : baseColumns;

  return (
    <main className="flex flex-1 px-4 py-6 sm:px-6 lg:px-10">
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] shadow-[var(--shadow)] backdrop-blur-xl">
        <EditorToolbar
          title={title}
          saveState={saveState}
          theme={theme}
          language={language}
          fullscreenMode={fullscreenMode}
          onExportMarkdown={() => {
            downloadMarkdown(title, markdown);
          }}
          onExportHtml={() => {
            void downloadHtml(title, markdown);
          }}
          onToggleTheme={() => {
            const nextTheme = theme === "light" ? "dark" : "light";
            setTheme(nextTheme);
            savePreferences({ theme: nextTheme });
            applyTheme(nextTheme);
          }}
          onToggleLanguage={() => {
            const nextLanguage = language === "zh" ? "en" : "zh";
            setLanguage(nextLanguage);
            savePreferences({ language: nextLanguage });
          }}
          onEditorFullscreen={() => {
            setFullscreenMode("editor");
          }}
          onPreviewFullscreen={() => {
            setFullscreenMode("preview");
          }}
          onExitFullscreen={() => {
            setFullscreenMode("none");
          }}
          onTitleChange={(nextTitle) => {
            setTitle(nextTitle);
            setSaveState("dirty");
          }}
        />
        <div
          data-testid="editor-grid"
          className={`grid flex-1 items-stretch gap-0 px-4 py-4 sm:px-5 sm:py-5 ${
            fullscreenMode === "none" ? "" : "bg-[color:var(--surface-strong)]"
          }`}
          style={{ gridTemplateColumns }}
        >
          {fullscreenMode !== "preview" ? (
            <section className="min-w-0 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
              <div className="flex items-center justify-between border-b border-[color:var(--line)] pb-3">
                <h2 className="text-sm font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  {copy.panels.editor}
                </h2>
                <span className="font-mono text-xs text-[color:var(--muted)]">{copy.panels.draft}</span>
              </div>
              <div className="pt-4">
                <MarkdownEditor
                  value={markdown}
                  onChange={(nextMarkdown) => {
                    setMarkdown(nextMarkdown);
                    setSaveState("dirty");
                  }}
                />
              </div>
            </section>
          ) : null}

          {fullscreenMode === "none" ? (
            <div className="flex items-center justify-center px-1.5">
              <div
                role="separator"
                aria-orientation="vertical"
                data-testid="resize-handle-editor-preview"
                onMouseDown={beginResize}
                className="h-full min-h-24 w-2 cursor-col-resize rounded-full bg-[color:var(--line)] transition-colors hover:bg-[color:var(--accent)]"
              />
            </div>
          ) : null}

          {fullscreenMode !== "editor" ? <PreviewPane markdown={markdown} title={copy.panels.preview} meta={copy.panels.live} /> : null}
        </div>
      </section>
    </main>
  );
}

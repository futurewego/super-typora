"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { PreviewPane } from "@/components/editor/preview-pane";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { downloadHtml } from "@/lib/export/export-html";
import { downloadMarkdown } from "@/lib/export/export-md";
import { saveCachedDocument } from "@/lib/cloud/cache";
import { createCloudDocument, updateCloudDocument } from "@/lib/cloud/http";
import type { AppLanguage } from "@/lib/i18n/messages";
import { saveDraft } from "@/lib/storage/drafts";
import { updateDocument } from "@/lib/storage/documents";
import { getPreferences, savePreferences } from "@/lib/storage/preferences";
import { applyTheme } from "@/lib/theme/apply-theme";
import { debounce } from "@/lib/utils/debounce";
import { getElectronAPI, isElectron } from "@/lib/utils/is-electron";
import { useEditorStore } from "@/stores/editor-store";
import type { StoredDocument } from "@/types/document";

interface EditorShellProps {
  initialDocument: StoredDocument;
}

interface EditorLayoutState {
  editorWidth?: number;
}

const LAYOUT_STORAGE_KEY = "super-markdown-workbench:layout";
const MIN_PANE = 320;
// 拖到距边缘这么近时，自动隐藏对侧栏（切到单栏态）
const HIDE_THRESHOLD = 140;

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
  const toggleDrawer = useEditorStore((state) => state.toggleDrawer);
  const layoutMode = useEditorStore((state) => state.layoutMode);
  const setLayoutMode = useEditorStore((state) => state.setLayoutMode);
  const handleSaveRef = useRef<() => void>(() => {});
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [editorWidth, setEditorWidth] = useState<number | undefined>(
    () => readLayoutState().editorWidth,
  );

  useEffect(() => {
    hydrateFromDocument(initialDocument);
  }, [hydrateFromDocument, initialDocument]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl+\ 开合文件抽屉
      if ((event.metaKey || event.ctrlKey) && event.key === "\\") {
        event.preventDefault();
        toggleDrawer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleDrawer]);

  // Cmd/Ctrl+S 保存（Web 与桌面通用）+ 桌面菜单「Save」
  useEffect(() => {
    const handleSaveShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSaveRef.current();
      }
    };

    window.addEventListener("keydown", handleSaveShortcut);
    const cleanupMenuSave = getElectronAPI()?.onMenuSave(() => {
      handleSaveRef.current();
    });

    return () => {
      window.removeEventListener("keydown", handleSaveShortcut);
      cleanupMenuSave?.();
    };
  }, []);

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

        const savedDocument = await updateDocument(document.id, {
          title,
          markdown,
          updatedAt: savedAt,
          lastOpenedAt: savedAt,
        });

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

  async function handleSave() {
    if (!document) {
      return;
    }

    try {
      setSaveState("saving");
      const savedAt = Date.now();

      await saveDraft({
        docId: document.id,
        markdown,
        savedAt,
      });

      const localSaved = await updateDocument(document.id, {
        title,
        markdown,
        updatedAt: savedAt,
        lastOpenedAt: savedAt,
      });

      // 桌面端：保存写回磁盘原文件；无 filePath 时弹「另存为」
      if (isElectron()) {
        const electronAPI = getElectronAPI();
        let nextDocument = localSaved;

        if (electronAPI) {
          if (document.filePath) {
            await electronAPI.writeFile(document.filePath, markdown);
          } else {
            const result = await electronAPI.saveFileAs(
              `${title || "untitled"}.md`,
              markdown,
            );
            if (!result.canceled && result.path) {
              nextDocument = await updateDocument(document.id, {
                filePath: result.path,
                title: result.name ?? title,
              });
            }
          }
        }

        hydrateFromDocument(nextDocument);
        saveCachedDocument(nextDocument);
        setSaveState("saved");
        return;
      }

      // Web：本地来源文档不同步云端
      if (document.source === "local") {
        hydrateFromDocument(localSaved);
        saveCachedDocument(localSaved);
        setSaveState("saved");
        return;
      }

      // Web 云端同步：失败也不影响已完成的本地保存
      try {
        const { document: cloudSaved } = document.version
          ? await updateCloudDocument(document.id, {
              title,
              markdown,
              baseVersion: document.version,
              lastOpenedAt: savedAt,
            })
          : await createCloudDocument({
              id: document.id,
              title,
              markdown,
              source: document.source,
            });

        // 仅合并云端的 version / updatedAt，保留本地 source / filePath
        const nextDocument = {
          ...localSaved,
          version: cloudSaved.version,
          updatedAt: cloudSaved.updatedAt,
        };

        hydrateFromDocument(nextDocument);
        saveCachedDocument(nextDocument);
        setSaveState("saved");
      } catch {
        hydrateFromDocument(localSaved);
        saveCachedDocument(localSaved);
        setSaveState("saved");
      }
    } catch {
      setSaveState("error");
    }
  }

  // 保持最新的 handleSave 引用，供快捷键 / 菜单事件调用，避免闭包过期
  handleSaveRef.current = handleSave;

  // editorWidth 持久化
  useEffect(() => {
    writeLayoutState({ editorWidth });
  }, [editorWidth]);

  // 拖拽分割线：调整左栏宽度；拖到边缘则隐藏对侧栏（切单栏）
  function beginResize(event: ReactMouseEvent<HTMLDivElement>) {
    event.preventDefault();
    const container = gridRef.current;
    if (!container) {
      return;
    }
    const rect = container.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const offset = moveEvent.clientX - rect.left;
      if (offset < HIDE_THRESHOLD) {
        setLayoutMode("preview"); // 贴左：隐藏编辑栏
        return;
      }
      if (offset > rect.width - HIDE_THRESHOLD) {
        setLayoutMode("editor"); // 贴右：隐藏预览栏
        return;
      }
      setLayoutMode("split");
      setEditorWidth(
        Math.max(MIN_PANE, Math.min(offset, rect.width - MIN_PANE)),
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  const gridTemplateColumns =
    layoutMode === "split"
      ? editorWidth
        ? `${editorWidth}px 12px minmax(${MIN_PANE}px, 1fr)`
        : `minmax(${MIN_PANE}px, 1fr) 12px minmax(${MIN_PANE}px, 1fr)`
      : "minmax(0, 1fr)";

  return (
    <main className="flex flex-1 flex-col">
      <header className="titlebar flex items-center justify-center px-24">
        <span className="max-w-[60%] truncate text-xs font-medium text-[color:var(--muted)]">
          {title || "Untitled"}
        </span>
      </header>
      <section className="editor-canvas flex flex-1 flex-col overflow-hidden bg-[color:var(--surface)]">
        <EditorToolbar
          title={title}
          saveState={saveState}
          theme={theme}
          language={language}
          layoutMode={layoutMode}
          onSetLayoutMode={setLayoutMode}
          onExportMarkdown={() => {
            downloadMarkdown(title, markdown);
          }}
          onExportHtml={() => {
            void downloadHtml(title, markdown);
          }}
          onSave={() => {
            void handleSave();
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
          onTitleChange={(nextTitle) => {
            setTitle(nextTitle);
            setSaveState("dirty");
          }}
        />
        <div
          ref={gridRef}
          data-testid="editor-grid"
          data-layout-mode={layoutMode}
          className="grid min-h-0 flex-1 items-stretch gap-0 px-4 py-4"
          style={{ gridTemplateColumns }}
        >
          {layoutMode !== "preview" ? (
            <section className="flex min-h-0 min-w-0 flex-col rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
              <div className="min-h-0 flex-1">
                <MarkdownEditor
                  value={markdown}
                  theme={theme}
                  onChange={(nextMarkdown) => {
                    setMarkdown(nextMarkdown);
                    setSaveState("dirty");
                  }}
                />
              </div>
            </section>
          ) : null}

          {layoutMode === "split" ? (
            <div className="flex items-center justify-center px-1">
              <div
                role="separator"
                aria-orientation="vertical"
                data-testid="resize-handle-editor-preview"
                onMouseDown={beginResize}
                className="h-full min-h-24 w-1.5 cursor-col-resize rounded-full bg-[color:var(--line)] transition-colors hover:bg-[color:var(--accent)]"
              />
            </div>
          ) : null}

          {layoutMode !== "editor" ? (
            <div className="min-h-0 min-w-0 overflow-auto">
              <PreviewPane markdown={markdown} />
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

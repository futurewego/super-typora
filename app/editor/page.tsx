"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { EditorShell } from "@/components/editor/editor-shell";
import { EditorEmptyState } from "@/components/workbench/editor-empty-state";
import { FileDrawer } from "@/components/workbench/file-drawer";
import { getCachedDocument, saveCachedDocument } from "@/lib/cloud/cache";
import { getCloudDocument, updateCloudDocument } from "@/lib/cloud/http";
import {
  createDocument,
  findDocumentByFilePath,
  getDocument,
  updateDocument,
} from "@/lib/storage/documents";
import { getElectronAPI, isElectron } from "@/lib/utils/is-electron";
import type { StoredDocument } from "@/types/document";

function EditorContent() {
  const searchParams = useSearchParams();
  // 多窗口：每个窗口从自己的 URL 自初始化，三种形态互斥
  const docId = searchParams.get("docId");
  const isNew = searchParams.get("new");
  const filePath = searchParams.get("filePath");
  const [document, setDocument] = useState<StoredDocument | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(
    "loading",
  );
  // 防止 StrictMode / 重渲染重复初始化（尤其 ?new 会重复建空文档）
  const initedRef = useRef(false);

  useEffect(() => {
    async function loadDocument(id: string) {
      // 本地优先：先取本地 IndexedDB 文档
      const localDocument = await getDocument(id);

      // 桌面端或本地来源文档：直接走本地，完全不依赖云端
      if (isElectron() || localDocument?.source === "local") {
        if (localDocument) {
          setDocument(localDocument);
          setStatus("ready");
        } else {
          setStatus("missing");
        }
        return;
      }

      // Web 云端路径：云端优先，失败或缺失时回退本地
      try {
        const cachedDocument = getCachedDocument(id);

        if (cachedDocument) {
          setDocument(cachedDocument);
          setStatus("ready");
        }

        const { document: nextDocument } = await getCloudDocument(id);

        if (!nextDocument) {
          if (localDocument) {
            setDocument(localDocument);
            setStatus("ready");
            return;
          }
          setStatus("missing");
          return;
        }

        const { document: openedDocument } = await updateCloudDocument(id, {
          lastOpenedAt: Date.now(),
          baseVersion: nextDocument.version,
        });

        await createDocument({
          id: openedDocument.id,
          title: openedDocument.title,
          markdown: openedDocument.markdown,
          source: openedDocument.source,
          version: openedDocument.version,
        }).catch(async () => {
          await updateDocument(openedDocument.id, {
            title: openedDocument.title,
            markdown: openedDocument.markdown,
            source: openedDocument.source,
            version: openedDocument.version,
            updatedAt: openedDocument.updatedAt,
            lastOpenedAt: openedDocument.lastOpenedAt,
          });
        });

        setDocument(openedDocument);
        saveCachedDocument(openedDocument);
        setStatus("ready");
      } catch {
        if (localDocument) {
          setDocument(localDocument);
          setStatus("ready");
          return;
        }

        setStatus("missing");
      }
    }

    // ?new=1：建空白文档，回写 URL 为 ?docId= 以支持刷新恢复
    async function createBlank() {
      const doc = await createDocument({
        title: "Untitled",
        markdown: "# Untitled\n",
        source: "blank",
      });
      window.history.replaceState(null, "", `?docId=${doc.id}`);
      getElectronAPI()?.registerWindow({ docId: doc.id });
      setDocument(doc);
      setStatus("ready");
    }

    // ?filePath=（桌面）：读盘 + 按路径去重建档，回写 URL 为 ?docId=
    async function loadFromFilePath(targetPath: string) {
      const electronAPI = getElectronAPI();
      if (!electronAPI) {
        setStatus("missing");
        return;
      }
      const file = await electronAPI.readFile(targetPath);
      const existing = await findDocumentByFilePath(targetPath);
      const doc = existing
        ? await updateDocument(existing.id, { lastOpenedAt: Date.now() })
        : await createDocument({
            title: file.name.replace(/\.(md|markdown|txt)$/i, ""),
            markdown: file.content,
            source: "local",
            filePath: file.path,
          });
      window.history.replaceState(null, "", `?docId=${doc.id}`);
      electronAPI.registerWindow({ docId: doc.id, filePath: targetPath });
      setDocument(doc);
      setStatus("ready");
    }

    if (initedRef.current) {
      return;
    }
    initedRef.current = true;

    if (docId) {
      void loadDocument(docId);
    } else if (isNew === "1") {
      void createBlank();
    } else if (filePath) {
      void loadFromFilePath(filePath);
    } else {
      setStatus("missing");
    }
  }, [docId, isNew, filePath]);

  if (status === "loading") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-12 text-[color:var(--muted)]">
        Loading editor...
      </main>
    );
  }

  if (status === "missing" || !document) {
    return <EditorEmptyState />;
  }

  return <EditorShell initialDocument={document} />;
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <main className="flex flex-1 items-center justify-center px-6 py-12 text-[color:var(--muted)]">
        Loading editor...
      </main>
    }>
      <EditorContent />
      {/* 抽屉常驻：编辑器视图与空状态都能呼出 */}
      <FileDrawer />
    </Suspense>
  );
}

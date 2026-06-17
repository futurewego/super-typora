"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { EditorShell } from "@/components/editor/editor-shell";
import { getCachedDocument, saveCachedDocument } from "@/lib/cloud/cache";
import { getCloudDocument, updateCloudDocument } from "@/lib/cloud/http";
import { createDocument, getDocument, updateDocument } from "@/lib/storage/documents";
import { isElectron } from "@/lib/utils/is-electron";
import type { StoredDocument } from "@/types/document";

function EditorContent() {
  const searchParams = useSearchParams();
  const docId = searchParams.get("docId");
  const [document, setDocument] = useState<StoredDocument | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(
    "loading",
  );

  useEffect(() => {
    async function loadDocument(id: string) {
      // 本地优先：先取本地 IndexedDB 文档
      const localDocument = await getDocument(id);

      // 桌面端或本地来源文档：直接走本地，完全不依赖云端
      // （避免离线/无后端时云端 fetch 卡死或误判 "missing"）
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

    if (docId) {
      void loadDocument(docId);
    } else {
      setStatus("missing");
    }
  }, [docId]);

  if (status === "loading") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-12 text-[color:var(--muted)]">
        Loading editor...
      </main>
    );
  }

  if (status === "missing" || !document) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-12 text-center">
        <div className="space-y-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-6 py-8 shadow-[var(--shadow)]">
          <h1 className="text-2xl font-semibold tracking-[-0.05em]">Document not found</h1>
          <p className="text-sm leading-7 text-[color:var(--muted)]">
            The requested document could not be loaded from your workspace.
          </p>
        </div>
      </main>
    );
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
    </Suspense>
  );
}

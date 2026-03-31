"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { EditorShell } from "@/components/editor/editor-shell";
import { getCachedDocument, saveCachedDocument } from "@/lib/cloud/cache";
import { getCloudDocument, updateCloudDocument } from "@/lib/cloud/http";
import { createDocument, getDocument, updateDocument } from "@/lib/storage/documents";
import type { StoredDocument } from "@/types/document";

export default function EditorPage() {
  const params = useParams<{ docId: string }>();
  const [document, setDocument] = useState<StoredDocument | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(
    "loading",
  );

  useEffect(() => {
    async function loadDocument(docId: string) {
      try {
        const cachedDocument = getCachedDocument(docId);

        if (cachedDocument) {
          setDocument(cachedDocument);
          setStatus("ready");
        }

        const { document: nextDocument } = await getCloudDocument(docId);

        if (!nextDocument) {
          setStatus("missing");
          return;
        }

        const { document: openedDocument } = await updateCloudDocument(docId, {
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
        const localDocument = await getDocument(docId);

        if (localDocument) {
          setDocument(localDocument);
          setStatus("ready");
          return;
        }

        setStatus("missing");
      }
    }

    if (params.docId) {
      void loadDocument(params.docId);
    }
  }, [params.docId]);

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
            The requested cloud document could not be loaded from your workspace.
          </p>
        </div>
      </main>
    );
  }

  return <EditorShell initialDocument={document} />;
}

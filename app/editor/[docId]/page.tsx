"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { EditorShell } from "@/components/editor/editor-shell";
import { getDocument, updateDocument } from "@/lib/storage/documents";
import type { StoredDocument } from "@/types/document";

export default function EditorPage() {
  const params = useParams<{ docId: string }>();
  const [document, setDocument] = useState<StoredDocument | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(
    "loading",
  );

  useEffect(() => {
    async function loadDocument(docId: string) {
      const nextDocument = await getDocument(docId);

      if (!nextDocument) {
        setStatus("missing");
        return;
      }

      const openedDocument = await updateDocument(docId, {
        lastOpenedAt: Date.now(),
      });

      setDocument(openedDocument);
      setStatus("ready");
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
            The requested local document could not be loaded from browser storage.
          </p>
        </div>
      </main>
    );
  }

  return <EditorShell initialDocument={document} />;
}

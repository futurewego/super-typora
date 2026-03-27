"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { WorkbenchShell } from "@/components/workbench/workbench-shell";
import type { AppLanguage } from "@/lib/i18n/messages";
import { getDraft, listDrafts } from "@/lib/storage/drafts";
import {
  createDocument,
  getDocument,
  listRecentDocuments,
  updateDocument,
} from "@/lib/storage/documents";
import { getPreferences, savePreferences } from "@/lib/storage/preferences";
import { readMarkdownFile } from "@/lib/utils/file";
import type { StoredDocument } from "@/types/document";

interface RecoverableDraftState {
  docId: string;
  title: string;
}

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [language, setLanguage] = useState<AppLanguage>(() => getPreferences().language);
  const [recentDocs, setRecentDocs] = useState<StoredDocument[]>([]);
  const [recoverableDraft, setRecoverableDraft] =
    useState<RecoverableDraftState>();

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      void (async () => {
        const documents = await listRecentDocuments();

        if (cancelled) {
          return;
        }

        setRecentDocs(documents);

        const drafts = await listDrafts();
        const latestDraft = drafts.sort((left, right) => right.savedAt - left.savedAt)[0];

        if (!latestDraft) {
          setRecoverableDraft(undefined);
          return;
        }

        const document = await getDocument(latestDraft.docId);

        if (!document || cancelled) {
          setRecoverableDraft(undefined);
          return;
        }

        setRecoverableDraft({
          docId: latestDraft.docId,
          title: document.title,
        });
      })();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate() {
    const document = await createDocument({
      title: "Untitled",
      markdown: "# Untitled\n",
      source: "blank",
    });

    router.push(`/editor/${document.id}`);
  }

  function handleImportRequest() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const imported = await readMarkdownFile(file);
    const document = await createDocument({
      title: imported.title,
      markdown: imported.markdown,
      source: "imported",
    });

    event.target.value = "";
    router.push(`/editor/${document.id}`);
  }

  async function handleRecover() {
    if (!recoverableDraft) {
      return;
    }

    const draft = await getDraft(recoverableDraft.docId);

    if (!draft) {
      return;
    }

    await updateDocument(recoverableDraft.docId, {
      markdown: draft.markdown,
      source: "recovered",
      lastOpenedAt: Date.now(),
    });

    router.push(`/editor/${recoverableDraft.docId}`);
  }

  async function handleOpenDocument(docId: string) {
    await updateDocument(docId, {
      lastOpenedAt: Date.now(),
    });

    router.push(`/editor/${docId}`);
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,text/markdown,text/plain"
        className="hidden"
        onChange={(event) => {
          void handleImportFile(event);
        }}
      />
      <WorkbenchShell
        recentDocs={recentDocs}
        recoverableDraftTitle={recoverableDraft?.title}
        onCreate={() => {
          void handleCreate();
        }}
        onImport={handleImportRequest}
        onRecover={() => {
          void handleRecover();
        }}
        onOpenDocument={(docId) => {
          void handleOpenDocument(docId);
        }}
        onToggleLanguage={() => {
          const nextLanguage = language === "zh" ? "en" : "zh";
          setLanguage(nextLanguage);
          savePreferences({ language: nextLanguage });
        }}
        language={language}
      />
    </>
  );
}

"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";

import { WorkbenchShell } from "@/components/workbench/workbench-shell";
import type { AppLanguage } from "@/lib/i18n/messages";
import {
  getCurrentAccount,
  listCloudDocuments,
  logoutAccount,
  updateCloudDocument,
} from "@/lib/cloud/http";
import {
  getCachedWorkspace,
  saveCachedDocument,
  saveCachedWorkspace,
} from "@/lib/cloud/cache";
import { getDraft, listDrafts } from "@/lib/storage/drafts";
import {
  createDocument,
  listRecentDocuments,
  updateDocument,
} from "@/lib/storage/documents";
import { getPreferences, savePreferences } from "@/lib/storage/preferences";
import { collectMarkdownFilesFromDrop } from "@/lib/utils/import-drop";
import { readMarkdownFile } from "@/lib/utils/file";
import type { StoredDocument } from "@/types/document";

interface RecoverableDraftState {
  docId: string;
  title: string;
}

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const [language, setLanguage] = useState<AppLanguage>(() => getPreferences().language);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [recentDocs, setRecentDocs] = useState<StoredDocument[]>([]);
  const [recoverableDraft, setRecoverableDraft] =
    useState<RecoverableDraftState>();
  const [isDraggingImport, setIsDraggingImport] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      void (async () => {
        try {
          const cachedWorkspace = getCachedWorkspace();
          if (cachedWorkspace?.recentDocs.length) {
            setRecentDocs(cachedWorkspace.recentDocs);
          }

          const { account } = await getCurrentAccount();

          if (cancelled) {
            return;
          }

          setAccountEmail(account?.email ?? null);

          if (!account) {
            setIsLoadingAccount(false);
            return;
          }

          const { documents } = await listCloudDocuments();
          const localDocuments = await listRecentDocuments();

          if (cancelled) {
            return;
          }

          const mergedDocs: StoredDocument[] = [...documents];
          for (const localDocument of localDocuments) {
            if (!mergedDocs.some((item) => item.id === localDocument.id)) {
              mergedDocs.push(localDocument);
            }
          }

          mergedDocs.sort((left, right) => right.lastOpenedAt - left.lastOpenedAt);

          setRecentDocs(mergedDocs);
          saveCachedWorkspace(mergedDocs);
          mergedDocs.forEach((document) => {
            saveCachedDocument(document);
          });

          const drafts = await listDrafts();
          const latestDraft = drafts.sort((left, right) => right.savedAt - left.savedAt)[0];

          if (!latestDraft) {
            setRecoverableDraft(undefined);
            setIsLoadingAccount(false);
            return;
          }

          const document = documents.find((item) => item.id === latestDraft.docId);

          if (!document || cancelled) {
            setRecoverableDraft(undefined);
            setIsLoadingAccount(false);
            return;
          }

          setRecoverableDraft({
            docId: latestDraft.docId,
            title: document.title,
          });
          setIsLoadingAccount(false);
        } catch {
          if (!cancelled) {
            setAccountEmail(null);
            setIsLoadingAccount(false);
          }
        }
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

    saveCachedDocument(document);

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

  async function handleImportFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    let firstDocumentId: string | undefined;

    for (const file of files) {
      const imported = await readMarkdownFile(file);
      const document = await createDocument({
        title: imported.title,
        markdown: imported.markdown,
        source: "imported",
      });

      saveCachedDocument(document);

      firstDocumentId ??= document.id;
    }

    if (firstDocumentId) {
      router.push(`/editor/${firstDocumentId}`);
    }
  }

  function isFileDrop(event: DragEvent<HTMLDivElement>) {
    return Boolean(event.dataTransfer.items?.length || event.dataTransfer.files?.length);
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!isFileDrop(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDraggingImport(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!isFileDrop(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!isFileDrop(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDraggingImport(false);
    }
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (!isFileDrop(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingImport(false);

    const files = await collectMarkdownFilesFromDrop(
      event.dataTransfer as unknown as Parameters<typeof collectMarkdownFilesFromDrop>[0],
    );
    await handleImportFiles(files);
  }

  async function handleRecover() {
    if (!recoverableDraft) {
      return;
    }

    const draft = await getDraft(recoverableDraft.docId);

    if (!draft) {
      return;
    }

    try {
      const localDocument = await updateDocument(recoverableDraft.docId, {
        markdown: draft.markdown,
        source: "recovered",
        lastOpenedAt: Date.now(),
      });

      if (localDocument.version) {
        await updateCloudDocument(recoverableDraft.docId, {
          markdown: draft.markdown,
          source: "recovered",
          lastOpenedAt: Date.now(),
        });
      }
    } catch {
      await updateCloudDocument(recoverableDraft.docId, {
        markdown: draft.markdown,
        source: "recovered",
        lastOpenedAt: Date.now(),
      });
    }

    router.push(`/editor/${recoverableDraft.docId}`);
  }

  async function handleOpenDocument(docId: string) {
    try {
      const localDocument = await updateDocument(docId, {
        lastOpenedAt: Date.now(),
      });

      if (localDocument.version) {
        await updateCloudDocument(docId, {
          lastOpenedAt: Date.now(),
        });
      }
    } catch {
      await updateCloudDocument(docId, {
        lastOpenedAt: Date.now(),
      });
    }

    router.push(`/editor/${docId}`);
  }

  if (isLoadingAccount && recentDocs.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-12 text-[color:var(--muted)]">
        Loading workspace...
      </main>
    );
  }

  if (!isLoadingAccount && !accountEmail) {
    return (
      <main className="grain flex flex-1 items-center justify-center px-6 py-12">
        <section className="w-full max-w-2xl rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow)] backdrop-blur-xl">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Cloud workspace
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-[color:var(--foreground)]">
              Sign in to sync your Markdown workspace
            </h1>
            <p className="max-w-xl text-base leading-8 text-[color:var(--muted)]">
              Your cloud workspace is ready once you log in. Documents, versions, and sync
              state will stay consistent across devices.
            </p>
            <button
              type="button"
              onClick={() => {
                router.push("/login");
              }}
              className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--surface)]"
            >
              Go to login
            </button>
          </div>
        </section>
      </main>
    );
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
      <div
        data-testid="project-import-zone"
        className="contents"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(event) => {
          void handleDrop(event);
        }}
      >
        <WorkbenchShell
          accountEmail={accountEmail}
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
          onSignOut={() => {
            void (async () => {
              await logoutAccount();
              router.refresh();
            })();
          }}
          language={language}
        />
      </div>
      {isDraggingImport ? (
        <div className="pointer-events-none fixed inset-4 z-50 rounded-[2rem] border border-dashed border-[color:var(--accent)] bg-[color:var(--accent-soft)]/80 p-6 text-sm font-medium text-[color:var(--foreground)] backdrop-blur-md">
          Drop folder or markdown files to import
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

import { listRecentDocuments } from "@/lib/storage/documents";
import { listDrafts } from "@/lib/storage/drafts";
import type { StoredDocument } from "@/types/document";

export interface RecoverableDraft {
  docId: string;
  title: string;
}

/**
 * 本地优先的最近文档 + 可恢复草稿读取。
 * 抽屉（file-drawer）与空状态（editor-empty-state）共用，避免重复取数逻辑。
 */
export function useRecentDocuments() {
  const [recentDocs, setRecentDocs] = useState<StoredDocument[]>([]);
  const [recoverableDraft, setRecoverableDraft] = useState<
    RecoverableDraft | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const docs = await listRecentDocuments();
        if (cancelled) {
          return;
        }
        setRecentDocs(docs);

        const drafts = await listDrafts();
        const latest = drafts.sort((a, b) => b.savedAt - a.savedAt)[0];
        const draftDoc = latest
          ? docs.find((doc) => doc.id === latest.docId)
          : undefined;

        if (cancelled) {
          return;
        }
        setRecoverableDraft(
          latest && draftDoc
            ? { docId: latest.docId, title: draftDoc.title }
            : undefined,
        );
      } catch (error) {
        console.error("Failed to load recent documents:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return {
    recentDocs,
    recoverableDraft,
    loading,
    reload: () => setReloadKey((key) => key + 1),
  };
}

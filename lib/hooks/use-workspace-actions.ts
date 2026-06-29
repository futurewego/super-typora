"use client";

import { useRouter } from "next/navigation";

import { createDocument, updateDocument } from "@/lib/storage/documents";
import { getDraft } from "@/lib/storage/drafts";
import { readMarkdownFile } from "@/lib/utils/file";
import { getElectronAPI } from "@/lib/utils/is-electron";

/**
 * 工作区动作（本地优先）。从原 app/page.tsx 迁出，供抽屉与空状态共用。
 * 桌面端纯本地：去掉云端 updateCloudDocument 分支。
 */
export function useWorkspaceActions() {
  const router = useRouter();

  async function createNewDocument() {
    const doc = await createDocument({
      title: "Untitled",
      markdown: "# Untitled\n",
      source: "blank",
    });
    router.push(`/editor?docId=${doc.id}`);
  }

  /**
   * 打开文件：桌面端弹原生对话框（经主进程 open-file 流程，带 filePath 可存回磁盘）。
   * 返回 false 表示非桌面端，调用方应回退到 web 导入。
   */
  async function openFileDialog(): Promise<boolean> {
    const electronAPI = getElectronAPI();
    if (electronAPI) {
      await electronAPI.openFile();
      return true;
    }
    return false;
  }

  async function importFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    let firstDocumentId: string | undefined;
    for (const file of files) {
      const imported = await readMarkdownFile(file);
      const doc = await createDocument({
        title: imported.title,
        markdown: imported.markdown,
        source: "imported",
      });
      firstDocumentId ??= doc.id;
    }

    if (firstDocumentId) {
      router.push(`/editor?docId=${firstDocumentId}`);
    }
  }

  async function recoverDraft(docId: string) {
    const draft = await getDraft(docId);
    if (!draft) {
      return;
    }
    await updateDocument(docId, {
      markdown: draft.markdown,
      source: "recovered",
      lastOpenedAt: Date.now(),
    });
    router.push(`/editor?docId=${docId}`);
  }

  async function openDocument(docId: string) {
    await updateDocument(docId, { lastOpenedAt: Date.now() });
    router.push(`/editor?docId=${docId}`);
  }

  return {
    createNewDocument,
    openFileDialog,
    importFiles,
    recoverDraft,
    openDocument,
  };
}

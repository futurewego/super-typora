"use client";

import { createDocument, updateDocument } from "@/lib/storage/documents";
import { getDraft } from "@/lib/storage/drafts";
import { readMarkdownFile } from "@/lib/utils/file";
import { getElectronAPI } from "@/lib/utils/is-electron";

/**
 * 工作区动作（多窗口版）。
 * "打开文档" = 桌面端请求主进程开新 BrowserWindow / web 端 window.open 开新标签
 * （具名 target `st-doc-<id>` 天然去重聚焦，同源共享 IndexedDB 保证数据一致）。
 * 每个 editor 窗口从自己的 URL(?docId / ?filePath / ?new=1)自初始化，见 app/editor/page.tsx。
 */
export function useWorkspaceActions() {
  // 在新窗口(桌面)或新标签(web)打开一个已存在的文档
  function openDocInWindowOrTab(docId: string) {
    const electronAPI = getElectronAPI();
    if (electronAPI) {
      void electronAPI.openDocWindow(docId);
    } else {
      window.open(`/editor?docId=${docId}`, `st-doc-${docId}`);
    }
  }

  // 新建空白文档：桌面开新窗口 / web 开新标签，实际建档交给 editor 页 ?new=1 分支
  async function createNewDocument() {
    const electronAPI = getElectronAPI();
    if (electronAPI) {
      void electronAPI.newDocWindow();
    } else {
      window.open("/editor?new=1", "st-new");
    }
  }

  /**
   * 打开文件：桌面端弹原生对话框（主进程在新窗口打开选中文件）。
   * 返回 false 表示非桌面端，调用方回退到 web 导入。
   */
  async function openFileDialog(): Promise<boolean> {
    const electronAPI = getElectronAPI();
    if (electronAPI) {
      await electronAPI.openFile();
      return true;
    }
    return false;
  }

  // 导入 markdown：每篇都建档并各开一个窗口/标签
  async function importFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }
    for (const file of files) {
      const imported = await readMarkdownFile(file);
      const doc = await createDocument({
        title: imported.title,
        markdown: imported.markdown,
        source: "imported",
      });
      openDocInWindowOrTab(doc.id);
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
    openDocInWindowOrTab(docId);
  }

  async function openDocument(docId: string) {
    await updateDocument(docId, { lastOpenedAt: Date.now() });
    openDocInWindowOrTab(docId);
  }

  return {
    createNewDocument,
    openFileDialog,
    importFiles,
    recoverDraft,
    openDocument,
  };
}

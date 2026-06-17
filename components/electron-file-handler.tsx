"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getElectronAPI } from "@/lib/utils/is-electron";
import {
  createDocument,
  findDocumentByFilePath,
  updateDocument,
} from "@/lib/storage/documents";

export function ElectronFileHandler() {
  const router = useRouter();

  useEffect(() => {
    const electronAPI = getElectronAPI();
    if (!electronAPI) {
      return;
    }

    const handleOpenFile = async (filePath: string) => {
      try {
        const fileData = await electronAPI.readFile(filePath);

        // 同一文件已建过档：更新内容并复用，避免重复文档
        const existing = await findDocumentByFilePath(fileData.path);
        if (existing) {
          await updateDocument(existing.id, {
            markdown: fileData.content,
            lastOpenedAt: Date.now(),
          });
          router.push(`/editor?docId=${existing.id}`);
          return;
        }

        const newDoc = await createDocument({
          title: fileData.name,
          markdown: fileData.content,
          source: "local",
          filePath: fileData.path,
        });

        router.push(`/editor?docId=${newDoc.id}`);
      } catch (error) {
        console.error("Failed to open file via Electron:", error);
      }
    };

    const cleanup = electronAPI.onOpenFile(handleOpenFile);
    return cleanup;
  }, [router]);

  return null;
}

"use client";

import { useEffect } from "react";

import { getElectronAPI } from "@/lib/utils/is-electron";

/**
 * 桌面端标记：给 <html> 加 .electron 类，使 vibrancy 透明样式只作用于 Electron、
 * 不破坏 web 构建。文件打开逻辑已迁移到 app/editor/page.tsx 的 ?filePath 分支（多窗口）。
 */
export function ElectronFileHandler() {
  useEffect(() => {
    if (!getElectronAPI()) {
      return;
    }
    document.documentElement.classList.add("electron");
  }, []);

  return null;
}

import type { ElectronAPI } from "@/types/electron";

/**
 * 判断当前是否运行在 Electron 桌面端（渲染进程）。
 * preload 通过 contextBridge 注入 window.electronAPI.isElectron。
 */
export function isElectron(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean((window as Window & { electronAPI?: ElectronAPI }).electronAPI?.isElectron)
  );
}

export function getElectronAPI(): ElectronAPI | null {
  if (typeof window === "undefined") {
    return null;
  }
  return (window as Window & { electronAPI?: ElectronAPI }).electronAPI ?? null;
}

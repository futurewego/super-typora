const { contextBridge, ipcRenderer } = require("electron");

// 通过 contextBridge 暴露受控、类型安全的 API，替代不可靠的 window.require。
// contextIsolation:true + nodeIntegration:false 下渲染进程只能访问这里白名单的方法。
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,

  // 主进程通知渲染进程打开某个文件（文件关联 / 菜单 Open / 拖拽）
  onOpenFile(callback) {
    const listener = (_event, filePath) => callback(filePath);
    ipcRenderer.on("open-file", listener);
    return () => ipcRenderer.removeListener("open-file", listener);
  },

  // 菜单 / 快捷键触发的保存
  onMenuSave(callback) {
    const listener = () => callback();
    ipcRenderer.on("menu-save", listener);
    return () => ipcRenderer.removeListener("menu-save", listener);
  },

  openFile() {
    return ipcRenderer.invoke("open-file-dialog");
  },

  readFile(filePath) {
    return ipcRenderer.invoke("read-file", filePath);
  },

  writeFile(filePath, content) {
    return ipcRenderer.invoke("write-file", filePath, content);
  },

  saveFileAs(suggestedName, content) {
    return ipcRenderer.invoke("save-file-as", suggestedName, content);
  },
});

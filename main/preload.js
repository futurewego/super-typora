const { contextBridge, ipcRenderer } = require("electron");

// 通过 contextBridge 暴露受控、类型安全的 API，替代不可靠的 window.require。
// contextIsolation:true + nodeIntegration:false 下渲染进程只能访问这里白名单的方法。
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,

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

  // 多窗口：在新窗口打开某文档 / 新建文档 / 登记去重键
  openDocWindow(docId) {
    return ipcRenderer.invoke("win:open-doc", docId);
  },
  newDocWindow() {
    return ipcRenderer.invoke("win:new");
  },
  registerWindow(info) {
    ipcRenderer.send("win:register", info);
  },
});

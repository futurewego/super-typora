const {
  app,
  BrowserWindow,
  protocol,
  net,
  ipcMain,
  dialog,
  Menu,
} = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

const isDev = !app.isPackaged;
// 静态导出产物目录（next build with output:'export' -> out/）
const OUT_DIR = path.join(__dirname, "..", "out");

let mainWindow = null;
let fileToOpen = null;

// 自定义 app:// 协议：以 host 为 root 提供 out/ 下的静态文件。
// 解决 file:// 下 Next 的绝对资源路径（/_next/...）无法解析的问题。
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

function resolveStaticFile(pathname) {
  // pathname 形如 /_next/static/x.js 或 /editor 或 /
  let rel = decodeURIComponent(pathname).replace(/^\/+/, "");
  if (rel === "") {
    rel = "index.html";
  }

  let filePath = path.join(OUT_DIR, rel);

  // 目录或无扩展名时，尝试 .html / index.html（适配 Next 静态导出布局）
  if (!path.extname(filePath)) {
    if (fs.existsSync(`${filePath}.html`)) {
      filePath = `${filePath}.html`;
    } else if (fs.existsSync(path.join(filePath, "index.html"))) {
      filePath = path.join(filePath, "index.html");
    } else {
      filePath = `${filePath}.html`;
    }
  }

  // 防目录穿越
  if (!filePath.startsWith(OUT_DIR)) {
    return path.join(OUT_DIR, "index.html");
  }
  return filePath;
}

function registerAppProtocol() {
  protocol.handle("app", async (request) => {
    const { pathname } = new URL(request.url);
    let filePath = resolveStaticFile(pathname);

    // SPA 兜底：请求的页面文件不存在时回退到 index.html，交给客户端路由
    if (!fs.existsSync(filePath)) {
      filePath = path.join(OUT_DIR, "index.html");
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function sendOpenFile(filePath) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send("open-file", filePath);
  } else {
    fileToOpen = filePath;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3001");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL("app://app/index.html");
  }

  mainWindow.webContents.on("did-finish-load", () => {
    if (fileToOpen) {
      mainWindow.webContents.send("open-file", fileToOpen);
      fileToOpen = null;
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac
      ? [{ role: "appMenu" }]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "Open…",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const result = await dialog.showOpenDialog({
              properties: ["openFile"],
              filters: [
                { name: "Markdown", extensions: ["md", "markdown", "txt"] },
              ],
            });
            if (!result.canceled && result.filePaths[0]) {
              sendOpenFile(result.filePaths[0]);
            }
          },
        },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("menu-save");
            }
          },
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// macOS：通过文件关联 / 拖拽到 Dock 打开文件
app.on("will-finish-launching", () => {
  app.on("open-file", (event, filePath) => {
    event.preventDefault();
    sendOpenFile(filePath);
  });
});

// Windows/Linux：启动参数中的文件路径
if (!isDev && process.platform !== "darwin" && process.argv.length >= 2) {
  const arg = process.argv[process.argv.length - 1];
  if (arg && fs.existsSync(arg)) {
    fileToOpen = arg;
  }
}

app.whenReady().then(() => {
  registerAppProtocol();
  buildMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ---- IPC：本地文件读写 ----

// 渲染进程「打开」按钮触发的原生文件选择对话框
ipcMain.handle("open-file-dialog", async () => {
  const result = await dialog.showOpenDialog(mainWindow ?? undefined, {
    properties: ["openFile"],
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
  });
  if (!result.canceled && result.filePaths[0]) {
    sendOpenFile(result.filePaths[0]);
    return { opened: true };
  }
  return { opened: false };
});

ipcMain.handle("read-file", async (_event, filePath) => {
  const content = fs.readFileSync(filePath, "utf-8");
  const stats = fs.statSync(filePath);
  return {
    content,
    name: path.basename(filePath),
    path: filePath,
    lastModified: stats.mtimeMs,
  };
});

ipcMain.handle("write-file", async (_event, filePath, content) => {
  fs.writeFileSync(filePath, content, "utf-8");
  const stats = fs.statSync(filePath);
  return { success: true, path: filePath, lastModified: stats.mtimeMs };
});

ipcMain.handle("save-file-as", async (_event, suggestedName, content) => {
  const result = await dialog.showSaveDialog(mainWindow ?? undefined, {
    defaultPath: suggestedName || "untitled.md",
    filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  fs.writeFileSync(result.filePath, content, "utf-8");
  const stats = fs.statSync(result.filePath);
  return {
    canceled: false,
    path: result.filePath,
    name: path.basename(result.filePath),
    lastModified: stats.mtimeMs,
  };
});

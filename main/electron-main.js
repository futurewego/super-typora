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

// 多窗口管理：键 `doc:<id>` / `file:<absPath>` -> BrowserWindow，用于去重聚焦
const editorWindows = new Map();
let launcherWindow = null; // 首页/启动器窗口（index.html）
let cascadeOffset = 0; // 新窗口级联偏移
const pendingFiles = []; // app ready 前收到的 open-file 暂存

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

// 所有窗口共用的基础选项（hiddenInset 交通灯 + 毛玻璃 + 安全沙箱）
const BASE_WINDOW_OPTIONS = {
  width: 1200,
  height: 800,
  minWidth: 720,
  minHeight: 480,
  titleBarStyle: "hiddenInset",
  // macOS 原生毛玻璃：透出桌面壁纸的 Finder/Notes 质感
  vibrancy: "under-window",
  // active：窗口失焦时毛玻璃不变灰
  visualEffectState: "active",
  // 透明 ARGB，让 vibrancy 透出（不可用默认不透明白）
  backgroundColor: "#00000000",
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false,
  },
};

// 把 target 转成 editor 页的 route（URL 即窗口唯一真相）
function editorRoute(target) {
  if (target.docId) {
    return `editor?docId=${encodeURIComponent(target.docId)}`;
  }
  if (target.filePath) {
    return `editor?filePath=${encodeURIComponent(target.filePath)}`;
  }
  return "editor?new=1";
}

function loadRoute(win, route) {
  if (isDev) {
    win.loadURL(`http://localhost:3001/${route}`);
    win.webContents.openDevTools();
  } else {
    win.loadURL(`app://app/${route}`);
  }
}

// 打开/聚焦一个文档窗口。target = { docId? | filePath? | isNew? }
function createEditorWindow(target = {}) {
  const key = target.docId
    ? `doc:${target.docId}`
    : target.filePath
      ? `file:${target.filePath}`
      : null;

  // 去重：同一文档/文件已有窗口则聚焦而非新开
  if (key && editorWindows.has(key)) {
    const existing = editorWindows.get(key);
    if (existing && !existing.isDestroyed()) {
      existing.focus();
      return existing;
    }
    editorWindows.delete(key);
  }

  const win = new BrowserWindow({
    ...BASE_WINDOW_OPTIONS,
    x: 80 + cascadeOffset,
    y: 80 + cascadeOffset,
  });
  cascadeOffset = (cascadeOffset + 24) % 120;

  loadRoute(win, editorRoute(target));

  if (key) {
    editorWindows.set(key, win);
  }
  win.on("closed", () => {
    for (const [k, w] of editorWindows) {
      if (w === win) {
        editorWindows.delete(k);
      }
    }
  });
  return win;
}

// 首页/启动器窗口（最近文档中心），常驻、不被文档覆盖
function createLauncherWindow() {
  if (launcherWindow && !launcherWindow.isDestroyed()) {
    launcherWindow.focus();
    return launcherWindow;
  }
  launcherWindow = new BrowserWindow(BASE_WINDOW_OPTIONS);
  if (isDev) {
    launcherWindow.loadURL("http://localhost:3001");
    launcherWindow.webContents.openDevTools();
  } else {
    launcherWindow.loadURL("app://app/index.html");
  }
  launcherWindow.on("closed", () => {
    launcherWindow = null;
  });
  return launcherWindow;
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Window",
          accelerator: "CmdOrCtrl+N",
          click: () => createEditorWindow({ isNew: true }),
        },
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
              createEditorWindow({ filePath: result.filePaths[0] });
            }
          },
        },
        {
          label: "Save",
          accelerator: "CmdOrCtrl+S",
          click: () => {
            // 作用于当前聚焦窗口
            BrowserWindow.getFocusedWindow()?.webContents.send("menu-save");
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
    if (app.isReady()) {
      createEditorWindow({ filePath });
    } else {
      pendingFiles.push(filePath);
    }
  });
});

// Windows/Linux：启动参数中的文件路径
if (!isDev && process.platform !== "darwin" && process.argv.length >= 2) {
  const arg = process.argv[process.argv.length - 1];
  if (arg && fs.existsSync(arg)) {
    pendingFiles.push(arg);
  }
}

app.whenReady().then(() => {
  registerAppProtocol();
  buildMenu();

  if (pendingFiles.length > 0) {
    pendingFiles.splice(0).forEach((filePath) => {
      createEditorWindow({ filePath });
    });
  } else {
    createLauncherWindow();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLauncherWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ---- IPC：多窗口 ----

// 渲染进程请求在新窗口打开某文档 / 新建文档
ipcMain.handle("win:open-doc", (_event, docId) => {
  createEditorWindow({ docId });
  return { ok: true };
});

ipcMain.handle("win:new", () => {
  createEditorWindow({ isNew: true });
  return { ok: true };
});

// 渲染进程把自己最终确定的 docId/filePath 登记进 Map，打通跨形态去重
ipcMain.on("win:register", (event, info) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    return;
  }
  if (info?.docId) {
    editorWindows.set(`doc:${info.docId}`, win);
  }
  if (info?.filePath) {
    editorWindows.set(`file:${info.filePath}`, win);
  }
});

// ---- IPC：本地文件读写 ----

// 渲染进程「打开」按钮触发的原生文件选择对话框 -> 在新窗口打开
ipcMain.handle("open-file-dialog", async (event) => {
  const parent = BrowserWindow.fromWebContents(event.sender) ?? undefined;
  const result = await dialog.showOpenDialog(parent, {
    properties: ["openFile"],
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
  });
  if (!result.canceled && result.filePaths[0]) {
    createEditorWindow({ filePath: result.filePaths[0] });
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

ipcMain.handle("save-file-as", async (event, suggestedName, content) => {
  const parent = BrowserWindow.fromWebContents(event.sender) ?? undefined;
  const result = await dialog.showSaveDialog(parent, {
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

// 桌面端静态导出构建脚本。
//
// 背景：app/api/* 是动态 Route Handler（使用 cookies()），与 next.config 的
// output:'export'（纯静态导出）不兼容，会导致 `next build` 报错。桌面端是本地优先、
// 无后端的，本就不需要这些 API。因此这里在导出构建期间临时把 app/api 移出，构建
// 结束后无条件恢复，从而：
//   - Web 构建（npm run build）保留完整 API 路由（server 模式）；
//   - 桌面构建（本脚本）产出干净的纯静态 out/。

import { spawnSync } from "node:child_process";
import { existsSync, renameSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(root, "app", "api");
const stashDir = join(root, ".electron-build-stash");
const stashedApi = join(stashDir, "api");

let stashed = false;

function stashApiRoutes() {
  if (existsSync(apiDir)) {
    mkdirSync(stashDir, { recursive: true });
    if (existsSync(stashedApi)) {
      rmSync(stashedApi, { recursive: true, force: true });
    }
    renameSync(apiDir, stashedApi);
    stashed = true;
    console.log("[build-electron] app/api 已临时移出，准备静态导出");
  }
}

function restoreApiRoutes() {
  if (stashed && existsSync(stashedApi)) {
    if (existsSync(apiDir)) {
      rmSync(apiDir, { recursive: true, force: true });
    }
    renameSync(stashedApi, apiDir);
    rmSync(stashDir, { recursive: true, force: true });
    stashed = false;
    console.log("[build-electron] app/api 已恢复");
  }
}

// 保证任何退出路径都恢复 app/api
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    restoreApiRoutes();
    process.exit(1);
  });
}

let exitCode = 0;
try {
  stashApiRoutes();

  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "build"],
    {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, BUILD_TARGET: "electron" },
    },
  );

  exitCode = result.status ?? 1;
} catch (error) {
  console.error("[build-electron] 构建失败：", error);
  exitCode = 1;
} finally {
  restoreApiRoutes();
}

process.exit(exitCode);

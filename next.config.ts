import type { NextConfig } from "next";

// Electron 桌面端走静态导出（file:// + 自定义 app:// 协议加载）。
// Web 端保持默认（带 API 路由的 server 模式）。
// 通过 BUILD_TARGET=electron 切换，避免 API 路由与 output:'export' 冲突。
const isElectron = process.env.BUILD_TARGET === "electron";

const nextConfig: NextConfig = {
  ...(isElectron
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        // 桌面打包产物无需 lint（且 eslint-config-next 版本不一致）；保留 TS 类型检查。
        eslint: { ignoreDuringBuilds: true },
      }
    : {}),
};

export default nextConfig;

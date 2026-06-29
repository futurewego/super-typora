"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 桌面端没有营销首页：启动直接进入工作区。
 * 静态导出（output:'export'）下用客户端 router.replace 跳转。
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/editor");
  }, [router]);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12 text-[color:var(--muted)]">
      Loading workspace...
    </main>
  );
}

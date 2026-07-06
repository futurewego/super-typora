"use client";

import { useState } from "react";

import { LivePreviewEditor } from "@/components/editor/live-preview-editor";

const PARA =
  "这是一段用来撑高文档、触发滚动的普通文字，包含 **粗体**、*斜体*、~~删除线~~ 和 `行内代码`。反复出现以确保内容超过一屏，好测试鼠标滚轮滚动。";

const SAMPLE = `# Live Preview 滚动测试

${Array.from({ length: 40 }, (_, i) => `## 第 ${i + 1} 段\n\n${PARA}`).join("\n\n")}

\`\`\`ts
function greet(name: string) {
  return "Hello " + name;
}
\`\`\`

| 列一 | 列二 |
| --- | --- |
| a | b |

结尾。
`;

export default function LabPage() {
  const [md, setMd] = useState(SAMPLE);

  return (
    <main className="flex h-screen flex-col bg-[color:var(--surface)]">
      <header className="shrink-0 border-b border-[color:var(--line)] px-5 py-3">
        <div className="text-sm font-semibold text-[color:var(--foreground)]">
          Live Preview 滚动测试 · /lab
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden p-6">
        <div className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-6">
          <LivePreviewEditor value={md} onChange={setMd} mode="live" />
        </div>
      </div>
    </main>
  );
}

import type { ReactNode } from "react";

import { RenderMarkdown } from "@/lib/markdown/render-markdown";

export function PreviewPane({
  markdown,
  title = "Preview",
  meta = "live",
  action,
}: {
  markdown: string;
  title?: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
      <div className="flex items-center justify-between border-b border-[color:var(--line)] pb-3">
        <h2 className="text-sm font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[color:var(--muted)]">{meta}</span>
          {action}
        </div>
      </div>
      <div className="pt-4 text-sm leading-7 text-[color:var(--foreground)]">
        <RenderMarkdown markdown={markdown} />
      </div>
    </section>
  );
}

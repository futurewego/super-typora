"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

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
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 复制预览：优先富文本（text/html），失败降级为纯文本
  const handleCopy = useCallback(async () => {
    const node = contentRef.current;
    if (!node) {
      return;
    }
    const html = node.innerHTML;
    const text = node.innerText;

    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
      copiedTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板权限被拒时静默失败，不打断编辑
    }
  }, []);

  const iconButtonClass =
    "flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--muted)] transition-colors hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--foreground)]";

  return (
    <section className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
      <div className="flex items-center justify-between border-b border-[color:var(--line)] pb-3">
        <h2 className="text-sm font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[color:var(--muted)]">{meta}</span>
          <button
            type="button"
            onClick={() => {
              void handleCopy();
            }}
            aria-label="Copy preview"
            title={copied ? "Copied" : "Copy preview"}
            className={iconButtonClass}
          >
            {copied ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
          {action}
        </div>
      </div>
      <div
        ref={contentRef}
        className="pt-4 text-sm leading-7 text-[color:var(--foreground)]"
      >
        <RenderMarkdown markdown={markdown} />
      </div>
    </section>
  );
}

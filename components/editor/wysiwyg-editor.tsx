"use client";

import { useEffect, useRef } from "react";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";

import { isMermaidLanguage, renderMermaidSvg } from "@/lib/markdown/mermaid-core";

interface WysiwygEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  /** 仅为与 MarkdownEditor 契约一致；主题经全局 .milkdown CSS 变量跟随 [data-theme] */
  theme?: "light" | "dark";
}

/**
 * 把 mermaid 代码块渲染成图，挂到 Crepe 代码块的预览面板（`renderPreview` 钩子）。
 * - content 变化 Crepe 会重新调用本函数 → 图随源码实时刷新。
 * - PreviewPanel 在赋值时快照 HTML（且过 DOMPurify），所以异步结果必须经
 *   `applyPreview` 回填，而不是改已返回的元素。同步先返回占位文本。
 * - 非 mermaid 语言返回 null（与 Crepe 默认一致，不显示预览）。
 */
function renderMermaidPreview(
  language: string,
  content: string,
  applyPreview: (value: null | string | HTMLElement) => void,
) {
  if (!isMermaidLanguage(language, content) || !content.trim()) {
    return null;
  }

  void renderMermaidSvg(content)
    .then((svg) => {
      applyPreview(`<div class="mermaid-preview">${svg}</div>`);
    })
    .catch(() => {
      applyPreview(
        `<pre class="mermaid-preview-error">${escapeHtml(content)}</pre>`,
      );
    });

  // 同步占位，异步渲染完由 applyPreview 覆盖
  return '<div class="mermaid-preview mermaid-preview--loading">渲染图表…</div>';
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * 所见即所得 Markdown 编辑器（Milkdown / Crepe）。
 * 契约与 MarkdownEditor 一致：吃 markdown 字符串、吐 markdown 字符串。
 *
 * 受控集成要点：
 * - 仅在挂载时用 defaultValue 初始化，之后由 Crepe 自己持有文档状态；
 *   外部 value 的逐键变化不回灌（避免光标跳动）。
 * - 文档切换 / 双栏↔单栏切换由 EditorShell 用 key 触发整体重挂载，从而重新初始化。
 * - ready 标志丢弃初始化阶段的回声：未真正编辑时不向外吐被规范化的 markdown，
 *   避免「只是切进来看一眼」就把用户原始格式改写。
 */
export function WysiwygEditor({ value, onChange }: WysiwygEditorProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    let ready = false;
    const crepe = new Crepe({
      root,
      defaultValue: value,
      featureConfigs: {
        [CrepeFeature.CodeMirror]: {
          // mermaid 代码块：上图下源码，源码改图实时跟随
          renderPreview: renderMermaidPreview,
          previewToggleText: (previewOnlyMode) =>
            previewOnlyMode ? "源码" : "隐藏图",
        },
      },
    });

    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        // 丢弃初始化阶段的回声，只在编辑器就绪后向外吐变更
        if (!ready) {
          return;
        }
        onChangeRef.current(markdown);
      });
    });

    void crepe
      .create()
      .then(() => {
        ready = true;
      })
      .catch((error) => {
        console.error("Crepe 初始化失败:", error);
      });

    return () => {
      void crepe.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={rootRef} className="milkdown-host h-full" />;
}

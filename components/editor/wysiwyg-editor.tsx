"use client";

import { useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";

interface WysiwygEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  /** 仅为与 MarkdownEditor 契约一致；主题经全局 .milkdown CSS 变量跟随 [data-theme] */
  theme?: "light" | "dark";
}

/**
 * 所见即所得 Markdown 编辑器（Milkdown / Crepe）。
 * 契约与 MarkdownEditor 一致：吃 markdown 字符串、吐 markdown 字符串。
 *
 * 受控集成要点：
 * - 仅在挂载时用 defaultValue 初始化，之后由 Crepe 自己持有文档状态；
 *   外部 value 的逐键变化不回灌（避免光标跳动）。
 * - 文档切换 / 源码↔预览切换由 EditorShell 用 key 触发整体重挂载，从而重新初始化。
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
    const crepe = new Crepe({ root, defaultValue: value });

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

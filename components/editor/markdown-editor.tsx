"use client";

import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";

interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  theme?: "light" | "dark";
}

export function MarkdownEditor({ value, onChange, theme = "dark" }: MarkdownEditorProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)]">
      <CodeMirror
        value={value}
        height="100%"
        minHeight="360px"
        extensions={[markdown()]}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: false,
        }}
        theme={theme === "dark" ? "dark" : "light"}
        onChange={onChange}
        aria-label="Markdown Editor"
      />
    </div>
  );
}

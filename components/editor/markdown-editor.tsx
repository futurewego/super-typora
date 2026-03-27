"use client";

import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";

interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[#121719] text-white">
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
        theme="dark"
        onChange={onChange}
        aria-label="Markdown Editor"
      />
    </div>
  );
}

import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { createElement } from "react";
import { vi } from "vitest";

// Crepe(ProseMirror) 在 jsdom 下无法稳定挂载；用与 MarkdownEditor 一致的
// 可输入 textarea 替身，让渲染 EditorShell 的测试在默认 wysiwyg 模式下仍可交互。
vi.mock("@/components/editor/wysiwyg-editor", () => ({
  WysiwygEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) =>
    createElement("textarea", {
      "aria-label": "Markdown Editor",
      value,
      onChange: (event: { target: { value: string } }) =>
        onChange(event.target.value),
    }),
}));

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

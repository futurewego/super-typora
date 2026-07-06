import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { createElement } from "react";
import { vi } from "vitest";

// Crepe 依赖浏览器 DOM/CSS，jsdom 下不真加载；测试用轻量 textarea 替身
vi.mock("@/components/editor/wysiwyg-editor", () => ({
  WysiwygEditor: ({ value }: { value: string }) =>
    createElement("textarea", {
      "aria-label": "WYSIWYG Editor",
      value,
      readOnly: true,
    }),
}));

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

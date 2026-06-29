import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { EditorShell } from "@/components/editor/editor-shell";
import { useEditorStore } from "@/stores/editor-store";

// 默认 wysiwyg 模式由 setup.ts 全局 mock 成 textarea；源码模式用真实 MarkdownEditor 的 mock
vi.mock("@/components/editor/markdown-editor", () => ({
  MarkdownEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      aria-label="Source Editor"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

const doc = {
  id: "doc-1",
  title: "Draft",
  markdown: "# Hello",
  source: "blank" as const,
  createdAt: 1,
  updatedAt: 1,
  lastOpenedAt: 1,
};

describe("edit mode toggle", () => {
  beforeEach(() => {
    useEditorStore.setState({ editMode: "wysiwyg" });
  });

  it("switches between wysiwyg and source without losing content", async () => {
    const user = userEvent.setup();

    render(<EditorShell initialDocument={doc} />);

    // 默认所见即所得（mock 成 Markdown Editor textarea）
    expect(screen.getByLabelText(/markdown editor/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/source editor/i)).not.toBeInTheDocument();

    // 点击源码切换按钮 → 进入源码模式
    await user.click(screen.getByRole("button", { name: /source mode/i }));

    const source = screen.getByLabelText(/source editor/i);
    expect(source).toBeInTheDocument();
    expect(source).toHaveValue("# Hello");

    // 切回所见即所得
    await user.click(screen.getByRole("button", { name: /preview mode/i }));
    expect(screen.getByLabelText(/markdown editor/i)).toBeInTheDocument();
  });
});

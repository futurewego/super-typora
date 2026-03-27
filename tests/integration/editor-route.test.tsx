import { render, screen } from "@testing-library/react";

import { EditorShell } from "@/components/editor/editor-shell";

describe("editor shell", () => {
  it("renders document title and save indicator", () => {
    render(
      <EditorShell
        initialDocument={{
          id: "doc-1",
          title: "API Notes",
          markdown: "# API",
          source: "blank",
          createdAt: 1,
          updatedAt: 1,
          lastOpenedAt: 1,
        }}
      />,
    );

    expect(screen.getByDisplayValue("API Notes")).toBeInTheDocument();
    expect(screen.getByText(/已保存/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /预览区/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /outline/i }),
    ).not.toBeInTheDocument();
  });
});

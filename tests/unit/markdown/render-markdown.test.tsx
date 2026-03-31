import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { RenderMarkdown } from "@/lib/markdown/render-markdown";

vi.mock("@/components/markdown/mermaid-diagram", () => ({
  MermaidDiagram: ({ chart }: { chart: string }) => (
    <div data-testid="mermaid-diagram">{chart}</div>
  ),
}));

describe("RenderMarkdown", () => {
  it("renders mermaid flowcharts with the diagram component", () => {
    render(<RenderMarkdown markdown={"```mermaid\ngraph TD\n  A --> B\n```"} />);

    expect(screen.getByTestId("mermaid-diagram")).toHaveTextContent(
      "graph TD",
    );
  });

  it("renders graph blocks without requiring the mermaid language tag", () => {
    render(<RenderMarkdown markdown={"```\ngraph TD\n  A --> B\n```"} />);

    expect(screen.getByTestId("mermaid-diagram")).toHaveTextContent(
      "graph TD",
    );
  });

  it("renders table cells with visible border classes", () => {
    render(
      <RenderMarkdown
        markdown={"| 功能 | 描述 |\n| --- | --- |\n| 文档更新检测 | 基于哈希比较 |"}
      />,
    );

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(screen.getAllByRole("cell")[0].className).toContain("border-r");
    expect(screen.getAllByRole("columnheader")[0].className).toContain("border-r");
  });
});

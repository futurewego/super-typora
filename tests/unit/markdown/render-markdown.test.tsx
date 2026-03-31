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
});

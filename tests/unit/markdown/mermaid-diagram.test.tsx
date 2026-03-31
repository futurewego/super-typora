import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { MermaidDiagram } from "@/components/markdown/mermaid-diagram";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    parse: vi.fn(async () => true),
    render: vi.fn(async () => ({
      svg: '<svg><text>Syntax error in text mermaid version 11.13.0</text></svg>',
    })),
  },
}));

describe("MermaidDiagram", () => {
  it("falls back to raw chart text when mermaid returns an error svg", async () => {
    render(<MermaidDiagram chart={"graph TD\n  A --> B"} />);

    expect(await screen.findByText(/graph TD/)).toBeInTheDocument();
    expect(screen.queryByText(/Syntax error in text/i)).not.toBeInTheDocument();
  });

  it("normalizes accidentally concatenated lines before rendering", async () => {
    render(
      <MermaidDiagram
        chart={
          'graph TD\n  C --> D[执行节点逻辑 (并行)]        D --> E[向通道写入更新]'
        }
      />,
    );

    expect(await screen.findByText(/执行节点逻辑/)).toBeInTheDocument();
  });
});

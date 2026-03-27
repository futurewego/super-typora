import { render, screen } from "@testing-library/react";

import { PreviewPane } from "@/components/editor/preview-pane";

describe("heading typography", () => {
  it("renders headings with bold weight and descending sizes by level", () => {
    render(
      <PreviewPane
        markdown={`# Title One

## Title Two

### Title Three`}
      />,
    );

    const h1 = screen.getByRole("heading", { name: "Title One", level: 1 });
    const h2 = screen.getByRole("heading", { name: "Title Two", level: 2 });
    const h3 = screen.getByRole("heading", { name: "Title Three", level: 3 });

    expect(h1.className).toContain("font-bold");
    expect(h2.className).toContain("font-bold");
    expect(h3.className).toContain("font-bold");

    expect(h1.className).toContain("text-4xl");
    expect(h2.className).toContain("text-3xl");
    expect(h3.className).toContain("text-2xl");
  });
});

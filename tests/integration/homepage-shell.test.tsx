import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import HomePage from "@/app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("homepage shell", () => {
  it("renders the workbench entry points", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /super markdown/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /继续草稿/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /导入 markdown/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /新建文档/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/最近文档/i)).toBeInTheDocument();
  });
});

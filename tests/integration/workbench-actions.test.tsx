import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import type { StoredDocument } from "@/types/document";
import { WorkbenchShell } from "@/components/workbench/workbench-shell";

const recentDocument: StoredDocument = {
  id: "doc-1",
  title: "Roadmap",
  markdown: "# Roadmap",
  source: "blank",
  createdAt: 1,
  updatedAt: 1,
  lastOpenedAt: 2,
};

describe("workbench actions", () => {
  it("shows recent docs, recovery state, and action callbacks", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const onImport = vi.fn();
    const onRecover = vi.fn();
    const onOpenDocument = vi.fn();

    render(
      <WorkbenchShell
        recentDocs={[recentDocument]}
        recoverableDraftTitle="Weekly Notes"
        onCreate={onCreate}
        onImport={onImport}
        onRecover={onRecover}
        onOpenDocument={onOpenDocument}
        onToggleLanguage={() => {}}
        language="zh"
      />,
    );

    expect(screen.getByText("Roadmap")).toBeInTheDocument();
    expect(screen.getByText(/weekly notes/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /新建文档/i }));
    await user.click(screen.getByRole("button", { name: /导入 markdown/i }));
    await user.click(screen.getByRole("button", { name: /恢复上次草稿/i }));
    await user.click(screen.getByRole("button", { name: /打开 roadmap/i }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onRecover).toHaveBeenCalledTimes(1);
    expect(onOpenDocument).toHaveBeenCalledWith("doc-1");
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import HomePage from "@/app/page";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  createDocument: vi.fn(async () => ({
    id: "local-doc-1",
    title: "Untitled",
    markdown: "# Untitled\n",
    source: "blank",
    createdAt: 1,
    updatedAt: 1,
    lastOpenedAt: 1,
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/storage/documents", () => ({
  createDocument: mocks.createDocument,
  listRecentDocuments: vi.fn(async () => []),
  updateDocument: vi.fn(),
  getDocument: vi.fn(),
}));

vi.mock("@/lib/cloud/http", () => ({
  getCurrentAccount: vi.fn(async () => ({
    account: { id: "user-1", email: "marvin@example.com" },
  })),
  listCloudDocuments: vi.fn(async () => ({ documents: [] })),
  createCloudDocument: vi.fn(),
  updateCloudDocument: vi.fn(),
  logoutAccount: vi.fn(),
}));

vi.mock("@/lib/storage/drafts", () => ({
  listDrafts: vi.fn(async () => []),
  getDraft: vi.fn(),
}));

vi.mock("@/lib/storage/preferences", () => ({
  getPreferences: () => ({ language: "zh", theme: "light", editorWidth: 50 }),
  savePreferences: vi.fn(),
}));

describe("new document local draft", () => {
  it("creates a local draft first and routes to it", async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /新建文档/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /新建文档/i }));

    expect(mocks.createDocument).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith("/editor/local-doc-1");
  });
});

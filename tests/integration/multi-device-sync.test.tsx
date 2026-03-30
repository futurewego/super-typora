import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import HomePage from "@/app/page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/cloud/http", () => ({
  getCurrentAccount: vi.fn(async () => ({
    account: { id: "user-1", email: "marvin@example.com" },
  })),
  listCloudDocuments: vi.fn(async () => ({
    documents: [
      {
        id: "doc-1",
        title: "Updated on Device A",
        markdown: "# Updated on Device A",
        source: "cloud",
        createdAt: 1,
        updatedAt: 2,
        lastOpenedAt: 2,
      },
    ],
  })),
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

describe("multi-device sync", () => {
  it("shows the latest cloud update on a second client refresh", async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("Updated on Device A")).toBeInTheDocument();
    });
  });
});

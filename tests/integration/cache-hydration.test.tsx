import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import HomePage from "@/app/page";

const push = vi.fn();

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh: vi.fn(),
  }),
}));

const cloudDocs = deferred<{ documents: Array<{ id: string; title: string; markdown: string; source: string; createdAt: number; updatedAt: number; lastOpenedAt: number }> }>();

vi.mock("@/lib/cloud/http", () => ({
  getCurrentAccount: vi.fn(async () => ({
    account: { id: "user-1", email: "marvin@example.com" },
  })),
  listCloudDocuments: vi.fn(() => cloudDocs.promise),
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

describe("cache hydration", () => {
  it("renders cached docs before cloud data replaces them", async () => {
    window.localStorage.setItem(
      "super-markdown-workbench:cloud-workspace-cache",
      JSON.stringify({
        recentDocs: [
          {
            id: "doc-1",
            title: "Cached Notes",
            markdown: "# Cached Notes",
            source: "cloud",
            createdAt: 1,
            updatedAt: 1,
            lastOpenedAt: 1,
          },
        ],
        updatedAt: 1,
      }),
    );

    render(<HomePage />);

    expect(await screen.findByText("Cached Notes")).toBeInTheDocument();

    cloudDocs.resolve({
      documents: [
        {
          id: "doc-1",
          title: "Cloud Notes",
          markdown: "# Cloud Notes",
          source: "cloud",
          createdAt: 2,
          updatedAt: 2,
          lastOpenedAt: 2,
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText("Cloud Notes")).toBeInTheDocument();
    });
  });
});

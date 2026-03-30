import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import LoginPage from "@/app/login/page";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
  }),
}));

vi.mock("@/lib/cloud/http", () => ({
  getCurrentAccount: vi.fn(async () => ({ account: null })),
  loginAccount: vi.fn(async () => ({
    account: { id: "user-1", email: "marvin@example.com" },
    session: { id: "sess-1", userId: "user-1", deviceId: "device-1" },
  })),
}));

describe("login flow", () => {
  it("submits email login and returns to the workspace", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "marvin@example.com");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(replace).toHaveBeenCalledWith("/");
  });
});

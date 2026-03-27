import { describe, expect, it, vi } from "vitest";

import { debounce } from "@/lib/utils/debounce";

describe("debounce", () => {
  it("runs only the latest scheduled call", async () => {
    vi.useFakeTimers();

    const spy = vi.fn();
    const debounced = debounce(spy, 300);

    debounced("first");
    debounced("second");

    await vi.advanceTimersByTimeAsync(300);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("second");

    vi.useRealTimers();
  });
});

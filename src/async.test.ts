import { describe, it, expect, vi } from "vitest";
import { async } from "./async";
import { autorun } from "mobx";

describe("async", () => {
  it("should resolve a promise once and expose promise state", async () => {
    const fetcher = vi.fn(() => Promise.resolve("test-value"));
    const asyncInstance = async(fetcher);

    // Initially pending
    expect(asyncInstance.isPending).toBe(true);
    expect(asyncInstance.value).toBe(null);
    expect(asyncInstance.error).toBe(null);

    // Wait for promise to resolve
    await asyncInstance.promise;

    // Should be resolved
    expect(asyncInstance.isPending).toBe(false);
    expect(asyncInstance.value).toBe("test-value");
    expect(asyncInstance.error).toBe(null);

    // Fetcher should only be called once
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("should expose error when promise rejects", async () => {
    const error = new Error("test-error");
    const fetcher = vi.fn(() => Promise.reject(error));
    const asyncInstance = async(fetcher);

    // Initially pending
    expect(asyncInstance.isPending).toBe(true);

    // Wait for promise to reject
    try {
      await asyncInstance.promise;
    } catch {
      // Expected to reject
    }

    // Should have error
    expect(asyncInstance.isPending).toBe(false);
    expect(asyncInstance.value).toBe(null);
    expect(asyncInstance.error).toBe(error);
  });

  it("should be observable with mobx", async () => {
    let resolvePromise: (value: string) => void;
    const promise = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });
    const fetcher = vi.fn(() => promise);
    const asyncInstance = async(fetcher);

    const states: Array<{ isPending: boolean; value: string | null }> = [];

    const dispose = autorun(() => {
      states.push({
        isPending: asyncInstance.isPending,
        value: asyncInstance.value,
      });
    });

    // Should start pending
    expect(states).toHaveLength(1);
    expect(states[0]).toEqual({ isPending: true, value: null });

    // Resolve the promise
    resolvePromise!("resolved-value");
    await asyncInstance.promise;

    // Should update to resolved state
    expect(states).toHaveLength(2);
    expect(states[1]).toEqual({ isPending: false, value: "resolved-value" });

    dispose();
  });

  it("should support suspense promise status", async () => {
    const fetcher = vi.fn(() => Promise.resolve("test-value"));
    const asyncInstance = async(fetcher);

    // Initially pending
    expect(asyncInstance.promise.status).toBe("pending");

    // Wait for promise to resolve
    await asyncInstance.promise;

    // Should be fulfilled
    expect(asyncInstance.promise.status).toBe("fulfilled");
    expect((asyncInstance.promise as any).value).toBe("test-value");
  });
});

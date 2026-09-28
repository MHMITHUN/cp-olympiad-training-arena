import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetRateLimitForTests } from "@/lib/rate-limit";

/**
 * Fixed-window counter behind the login (10 / 10 min) and POST /api/run
 * (12 / min) brakes. In-memory by design — see the module comment and the
 * README Known Limitations entry.
 */

beforeEach(() => {
  resetRateLimitForTests();
});

describe("rateLimit (fixed window)", () => {
  it("allows up to max hits per window, then rejects with a retry hint", () => {
    for (let i = 0; i < 3; i++) {
      const hit = rateLimit("login:scrambled@eggs.club", 3, 600_000);
      expect(hit.ok).toBe(true);
      expect(hit.retryAfterSec).toBe(0);
    }

    const blocked = rateLimit("login:scrambled@eggs.club", 3, 600_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(blocked.retryAfterSec).toBeLessThanOrEqual(600);
  });

  it("counts keys independently", () => {
    expect(rateLimit("run:usr-a", 1, 60_000).ok).toBe(true);
    expect(rateLimit("run:usr-b", 1, 60_000).ok).toBe(true);
    expect(rateLimit("run:usr-a", 1, 60_000).ok).toBe(false);
    expect(rateLimit("run:usr-b", 1, 60_000).ok).toBe(false);
  });

  it("starts a fresh window after the previous one elapses", async () => {
    expect(rateLimit("run:usr-c", 1, 15).ok).toBe(true);
    expect(rateLimit("run:usr-c", 1, 15).ok).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(rateLimit("run:usr-c", 1, 15).ok).toBe(true);
  });

  it("does not extend the window on rejected calls", () => {
    const windowMs = 30_000;
    expect(rateLimit("run:usr-d", 1, windowMs).ok).toBe(true);

    const first = rateLimit("run:usr-d", 1, windowMs);
    expect(first.ok).toBe(false);

    // Hammering the endpoint must not push resetAt forward: the reported
    // retry stays within the original window length.
    const hammered = rateLimit("run:usr-d", 1, windowMs);
    expect(hammered.ok).toBe(false);
    expect(hammered.retryAfterSec).toBeLessThanOrEqual(
      Math.ceil(windowMs / 1000),
    );
    expect(hammered.retryAfterSec).toBeLessThanOrEqual(first.retryAfterSec);
  });
});

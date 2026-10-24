import { describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests up to the limit", () => {
    resetRateLimits();
    const now = 1_000_000;

    expect(checkRateLimit("a", 2, 60_000, now).allowed).toBe(true);
    const second = checkRateLimit("a", 2, 60_000, now);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
  });

  it("blocks requests after the limit and reports retry time", () => {
    resetRateLimits();
    const now = 1_000_000;
    checkRateLimit("b", 1, 60_000, now);

    const blocked = checkRateLimit("b", 1, 60_000, now + 15_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(45);
  });

  it("starts a fresh window after expiry", () => {
    resetRateLimits();
    const now = 1_000_000;
    checkRateLimit("c", 1, 1_000, now);
    expect(checkRateLimit("c", 1, 1_000, now + 1_001).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    resetRateLimits();
    const now = 1_000_000;
    checkRateLimit("d", 1, 60_000, now);
    expect(checkRateLimit("e", 1, 60_000, now).allowed).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { computeStreak, recentDayCounts, utcDayKey } from "@/lib/stats";

/**
 * Streak rule (spec 19.9): consecutive UTC days with >= 1 submission, ending
 * today — or yesterday, if today has none yet. Fixed dates keep every edge
 * deterministic.
 */

const NOW = new Date("2026-07-15T12:00:00.000Z"); // Wednesday
const day = (offset: number, hour = 10): string =>
  new Date(
    new Date("2026-07-01T00:00:00.000Z").getTime() +
      (14 + offset) * 24 * 60 * 60 * 1000 +
      hour * 60 * 60 * 1000,
  ).toISOString();

describe("computeStreak", () => {
  it("counts today + earlier consecutive days", () => {
    expect(computeStreak([day(0), day(-1), day(-2)], NOW)).toBe(3);
  });

  it("survives until the day passes: yesterday-anchored streak", () => {
    expect(computeStreak([day(-1), day(-2)], NOW)).toBe(2);
  });

  it("counts multiple submissions on one day exactly once", () => {
    expect(
      computeStreak([day(0, 1), day(0, 5), day(0, 23), day(-1)], NOW),
    ).toBe(2);
  });

  it("breaks on a gap before yesterday", () => {
    expect(computeStreak([day(0), day(-2), day(-3)], NOW)).toBe(1);
  });

  it("returns 0 when neither today nor yesterday has a submission", () => {
    expect(computeStreak([day(-3), day(-4)], NOW)).toBe(0);
  });

  it("returns 0 for empty history", () => {
    expect(computeStreak([], NOW)).toBe(0);
  });

  it("handles a day-boundary crossing (23:59 yesterday, 00:01 now)", () => {
    const justAfterMidnight = new Date("2026-07-15T00:01:00.000Z");
    const lateYesterday = "2026-07-14T23:59:00.000Z";
    expect(computeStreak([lateYesterday], justAfterMidnight)).toBe(1);
  });

  it("uses UTC calendar days regardless of local timezone", () => {
    // 23:30 UTC on the 14th is already the 15th in UTC+1 — the day key
    // must still be the 14th (UTC rule, documented).
    expect(utcDayKey("2026-07-14T23:30:00.000Z")).toBe("2026-07-14");
    expect(computeStreak(["2026-07-14T23:30:00.000Z"], NOW)).toBe(1);
  });
});

describe("recentDayCounts", () => {
  it("returns one cell per day, oldest first, ending today", () => {
    const cells = recentDayCounts([day(0), day(0), day(-1)], NOW, 7);
    expect(cells).toHaveLength(7);
    expect(cells[cells.length - 1].dayKey).toBe("2026-07-15");
    expect(cells[cells.length - 1].count).toBe(2);
    expect(cells[cells.length - 2].dayKey).toBe("2026-07-14");
    expect(cells[cells.length - 2].count).toBe(1);
    expect(cells[0].dayKey).toBe("2026-07-09");
    expect(cells[0].count).toBe(0);
  });

  it("covers exactly 12 weeks for the activity strip", () => {
    const cells = recentDayCounts([], NOW, 12 * 7);
    expect(cells).toHaveLength(84);
  });
});

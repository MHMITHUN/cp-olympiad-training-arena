import { describe, it, expect } from "vitest";
import {
  comparePractice,
  rankPractice,
  compareStandings,
  type PracticeStat,
  type ContestStanding,
} from "@/lib/scoring";

/**
 * Leaderboard ordering (spec 19.8), the rule shown verbatim on
 * /leaderboard: solved DESC; ties broken by EARLIEST latest-solve (who
 * reached the progress first); members with no solves ordered by handle.
 */

const stat = (userId: string, solved: number, lastAcceptedAt: string | null): PracticeStat => ({
  userId,
  solved,
  lastAcceptedAt,
});

describe("comparePractice", () => {
  it("orders by solved count descending", () => {
    expect(comparePractice(stat("a", 5, "2026-05-01T00:00:00.000Z"), stat("b", 3, "2026-01-01T00:00:00.000Z"))).toBeLessThan(0);
  });

  it("breaks ties by earliest latest-solve (first to reach the count wins)", () => {
    const early = stat("a", 5, "2026-03-01T00:00:00.000Z");
    const late = stat("b", 5, "2026-04-01T00:00:00.000Z");
    expect(comparePractice(early, late)).toBeLessThan(0);
    expect(comparePractice(late, early)).toBeGreaterThan(0);
  });

  it("sorts members who never solved last among equal counts... and by handle", () => {
    const noSolve = stat("aaa", 0, null);
    const alsoNoSolve = stat("zzz", 0, null);
    const solver = stat("mmm", 1, "2026-03-01T00:00:00.000Z");
    expect(comparePractice(solver, noSolve)).toBeLessThan(0);
    expect(comparePractice(noSolve, alsoNoSolve)).toBeLessThan(0); // aaa < zzz
  });

  it("falls back to userId when solved and latest-solve are identical", () => {
    const x = stat("xxx", 4, "2026-03-01T00:00:00.000Z");
    const y = stat("yyy", 4, "2026-03-01T00:00:00.000Z");
    expect(comparePractice(x, y)).toBeLessThan(0);
  });
});

describe("rankPractice", () => {
  it("assigns ranks 1..n in the documented order", () => {
    const ranked = rankPractice([
      stat("late_bloomer", 5, "2026-06-01T00:00:00.000Z"),
      stat("early_bird", 5, "2026-02-01T00:00:00.000Z"),
      stat("casual", 2, "2026-05-01T00:00:00.000Z"),
      stat("newcomer", 0, null),
    ]);
    expect(ranked.map((r) => r.userId)).toEqual([
      "early_bird",
      "late_bloomer",
      "casual",
      "newcomer",
    ]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });
});

describe("compareStandings (contest boards)", () => {
  const standing = (
    userId: string,
    solved: number,
    penalty: number,
  ): ContestStanding => ({
    userId,
    solved,
    penalty,
    solves: new Map(),
    attempted: new Set(),
  });

  it("ranks solved DESC before penalty ASC (ICPC rule)", () => {
    const twoSlow = standing("a", 2, 300);
    const twoFast = standing("b", 2, 100);
    const oneFast = standing("c", 1, 20);
    expect(compareStandings(twoSlow, oneFast)).toBeLessThan(0);
    expect(compareStandings(twoFast, twoSlow)).toBeLessThan(0);
  });

  it("breaks exact ties by userId for stable boards", () => {
    expect(
      compareStandings(standing("b", 2, 100), standing("a", 2, 100)),
    ).toBeGreaterThan(0);
  });
});

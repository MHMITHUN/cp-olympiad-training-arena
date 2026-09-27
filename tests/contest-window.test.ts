import { describe, it, expect } from "vitest";
import {
  contestPhase,
  splitContestsByPhase,
  type ContestWindowLike,
} from "@/lib/contests/window";

/**
 * Contest clock rules (spec 19.6): every branch is evaluated against FIXED
 * timestamps — no Date.now() here, the pages pass the live clock in. The
 * boundary convention matches contestScore in src/lib/scoring.ts: the
 * [startsAt, endsAt] window is inclusive on both ends.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** Fixed contest: 2026-03-14 10:00 → 15:00 UTC (the seeded round-1 window). */
const START = new Date("2026-03-14T10:00:00.000Z").getTime();
const END = new Date("2026-03-14T15:00:00.000Z").getTime();

const contest: ContestWindowLike = {
  startsAt: new Date(START).toISOString(),
  endsAt: new Date(END).toISOString(),
};

describe("contestPhase", () => {
  it("is 'before' while now is strictly earlier than the start", () => {
    expect(contestPhase(contest, START - 1)).toBe("before");
    expect(contestPhase(contest, START - 24 * HOUR)).toBe("before");
  });

  it("is 'during' at the exact start instant (boundary is inclusive)", () => {
    expect(contestPhase(contest, START)).toBe("during");
  });

  it("is 'during' anywhere inside the window", () => {
    expect(contestPhase(contest, START + 1)).toBe("during");
    expect(contestPhase(contest, START + (END - START) / 2)).toBe("during");
    expect(contestPhase(contest, END - 1)).toBe("during");
  });

  it("is 'during' at the exact end instant, 'after' one millisecond later", () => {
    expect(contestPhase(contest, END)).toBe("during");
    expect(contestPhase(contest, END + 1)).toBe("after");
    expect(contestPhase(contest, END + 24 * HOUR)).toBe("after");
  });

  it("matches the scoring window: a submission at start/end is inside", () => {
    // Same convention contestScore applies when filtering submissions —
    // keep the two rules in lockstep.
    const inside = (t: number) => t >= START && t <= END;
    for (const t of [START - 1, START, START + 5 * MINUTE, END, END + 1]) {
      const phase = contestPhase(contest, t);
      const scoringKeeps = inside(t);
      expect(phase === "before" || phase === "after" ? !scoringKeeps : scoringKeeps).toBe(true);
    }
  });
});

describe("splitContestsByPhase", () => {
  // Fixed "now": 2026-09-28 12:00 UTC.
  const NOW = new Date("2026-09-28T12:00:00.000Z").getTime();

  const past = {
    slug: "past-round",
    startsAt: new Date(NOW - 48 * HOUR).toISOString(),
    endsAt: new Date(NOW - 47 * HOUR).toISOString(),
  };
  const ongoing = {
    slug: "running-round",
    startsAt: new Date(NOW - HOUR).toISOString(),
    endsAt: new Date(NOW + HOUR).toISOString(),
  };
  const upcomingSoon = {
    slug: "next-week-round",
    startsAt: new Date(NOW + 7 * 24 * HOUR).toISOString(),
    endsAt: new Date(NOW + 7 * 24 * HOUR + 3 * HOUR).toISOString(),
  };
  const upcomingLater = {
    slug: "next-month-round",
    startsAt: new Date(NOW + 30 * 24 * HOUR).toISOString(),
    endsAt: new Date(NOW + 30 * 24 * HOUR + 3 * HOUR).toISOString(),
  };

  it("buckets contests into upcoming / ongoing / past", () => {
    const { upcoming, ongoing: running, past: finished } = splitContestsByPhase(
      [past, ongoing, upcomingSoon, upcomingLater],
      NOW,
    );

    expect(upcoming.map((c) => c.slug)).toEqual([
      "next-week-round",
      "next-month-round",
    ]);
    expect(running.map((c) => c.slug)).toEqual(["running-round"]);
    expect(finished.map((c) => c.slug)).toEqual(["past-round"]);
  });

  it("sorts upcoming soonest-first regardless of input order", () => {
    const { upcoming } = splitContestsByPhase(
      [upcomingLater, past, upcomingSoon],
      NOW,
    );
    expect(upcoming.map((c) => c.slug)).toEqual([
      "next-week-round",
      "next-month-round",
    ]);
  });

  it("handles a phase with no contests", () => {
    const result = splitContestsByPhase([past], NOW);
    expect(result.upcoming).toEqual([]);
    expect(result.ongoing).toEqual([]);
    expect(result.past).toHaveLength(1);
  });
});

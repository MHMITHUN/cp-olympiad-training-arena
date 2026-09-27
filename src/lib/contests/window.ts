/**
 * PURE contest clock rules (spec 19.6): where a contest sits relative to a
 * given "now". No store, no Date.now() — the caller passes the current time
 * (server pages read it through src/lib/clock.ts), so every branch here is
 * deterministic and unit-tested with fixed timestamps.
 *
 * Boundary convention (shared with contestScore in src/lib/scoring.ts):
 * the window [startsAt, endsAt] is INCLUSIVE on both ends — a submission at
 * the exact start or end instant is inside the contest.
 */

export type ContestPhase = "before" | "during" | "after";

/** Anything with the two ISO timestamp fields a Contest carries. */
export interface ContestWindowLike {
  startsAt: string;
  endsAt: string;
}

/**
 * Phase of a contest at `now` (milliseconds since epoch):
 * - "before": now < startsAt          (countdown, problems locked)
 * - "during": startsAt <= now <= endsAt (live scoreboard, submissions open)
 * - "after":  now > endsAt             (final standings, editorials unlocked)
 */
export function contestPhase(
  contest: ContestWindowLike,
  now: number,
): ContestPhase {
  const startsMs = new Date(contest.startsAt).getTime();
  const endsMs = new Date(contest.endsAt).getTime();
  if (now < startsMs) return "before";
  if (now <= endsMs) return "during";
  return "after";
}

export interface ContestPhases<T extends ContestWindowLike> {
  /** Not started yet, soonest first (the /contests countdown order). */
  upcoming: T[];
  /** Running right now. */
  ongoing: T[];
  /** Finished. */
  past: T[];
}

/**
 * Bucket contests by phase at `now`. Upcoming is sorted by startsAt
 * ascending (soonest first); ongoing and past keep their input order
 * (the store already returns contests newest-start first).
 */
export function splitContestsByPhase<T extends ContestWindowLike>(
  contests: T[],
  now: number,
): ContestPhases<T> {
  const upcoming: T[] = [];
  const ongoing: T[] = [];
  const past: T[] = [];
  for (const contest of contests) {
    const phase = contestPhase(contest, now);
    if (phase === "before") upcoming.push(contest);
    else if (phase === "during") ongoing.push(contest);
    else past.push(contest);
  }
  upcoming.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return { upcoming, ongoing, past };
}

import type { Verdict } from "@/lib/db/types";

/**
 * PURE contest scoring + leaderboard ordering rules (spec 19.7). No store,
 * no clock, no React — everything here is deterministic and unit-tested.
 *
 * ICPC rule implemented:
 *   - a problem is "solved" when the user has an accepted submission on it
 *     (inside the contest window);
 *   - penalty = sum over SOLVED problems of
 *       (minutes from contest start to the first accepted submission)
 *       + 20 * (wrong submissions on that problem BEFORE the accepted one);
 *   - wrong submissions on problems that are never solved add NO penalty;
 *   - ranking: more solved first; equal solves -> smaller penalty first;
 *     exact ties are ordered deterministically by userId (documented).
 *
 * JUDGE HONESTY: verdict "recorded" (demo judge — no verdict exists, spec
 * 19.5/36) is IGNORED by contestScore. It is neither an accept nor a wrong
 * try, so a demo-mode submission can never move a scoreboard.
 */

/** Minutes added per wrong try on a problem that is eventually solved. */
export const ICPC_WRONG_TRY_PENALTY = 20;

/** Minimal submission shape contestScore needs (problemKey = slug or id). */
export interface ScorableSubmission {
  userId: string;
  problemKey: string;
  verdict: Verdict;
  /** ISO timestamp. */
  createdAt: string;
}

/** Contest window; submissions outside [startsAt, endsAt] are ignored. */
export interface ScorableContestWindow {
  startsAt: string;
  endsAt: string;
}

export interface ProblemSolve {
  /** Minutes from contest start to the first accepted submission. */
  timeMinutes: number;
  /** Total submissions on the problem up to and including the accept. */
  tries: number;
}

export interface ContestStanding {
  userId: string;
  solved: number;
  penalty: number;
  /** problemKey -> solve info, for solved problems only. */
  solves: Map<string, ProblemSolve>;
  /** Problems with at least one judging submission but no accept. */
  attempted: Set<string>;
}

/** A submission counts for scoring only if the judge actually judged it. */
function isJudged(verdict: Verdict): boolean {
  return verdict !== "recorded";
}

export function contestScore(
  submissions: ScorableSubmission[],
  contest: ScorableContestWindow,
): Map<string, ContestStanding> {
  const startMs = new Date(contest.startsAt).getTime();
  const endMs = new Date(contest.endsAt).getTime();

  // (userId, problemKey) -> judged submissions, oldest first.
  const byUserProblem = new Map<string, ScorableSubmission[]>();
  const standings = new Map<string, ContestStanding>();

  const standingFor = (userId: string): ContestStanding => {
    let standing = standings.get(userId);
    if (!standing) {
      standing = {
        userId,
        solved: 0,
        penalty: 0,
        solves: new Map(),
        attempted: new Set(),
      };
      standings.set(userId, standing);
    }
    return standing;
  };

  for (const submission of submissions) {
    const t = new Date(submission.createdAt).getTime();
    if (t < startMs || t > endMs) continue; // outside the window
    if (!isJudged(submission.verdict)) continue; // demo-recorded: no verdict

    const key = `${submission.userId}::${submission.problemKey}`;
    const list = byUserProblem.get(key) ?? [];
    list.push(submission);
    byUserProblem.set(key, list);
  }

  for (const [key, list] of byUserProblem) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const userId = key.slice(0, key.indexOf("::"));
    const problemKey = key.slice(key.indexOf("::") + 2);
    const standing = standingFor(userId);

    const acceptedIndex = list.findIndex((s) => s.verdict === "accepted");
    if (acceptedIndex === -1) {
      standing.attempted.add(problemKey);
      continue; // never solved: no penalty contribution
    }

    const acceptedAt = new Date(list[acceptedIndex].createdAt).getTime();
    const timeMinutes = Math.max(0, Math.floor((acceptedAt - startMs) / 60000));
    const wrongTries = acceptedIndex; // judged submissions before the accept
    standing.solved += 1;
    standing.penalty += timeMinutes + ICPC_WRONG_TRY_PENALTY * wrongTries;
    standing.solves.set(problemKey, {
      timeMinutes,
      tries: acceptedIndex + 1,
    });
  }

  return standings;
}

/** Compare for ranking: solved DESC, then penalty ASC, then userId ASC. */
export function compareStandings(
  a: ContestStanding,
  b: ContestStanding,
): number {
  if (a.solved !== b.solved) return b.solved - a.solved;
  if (a.penalty !== b.penalty) return a.penalty - b.penalty;
  return a.userId.localeCompare(b.userId);
}

export interface RankedStanding extends ContestStanding {
  /** 1-based rank after the documented ordering. */
  rank: number;
}

/** Rank all standings (ICPC order; ties broken deterministically by userId). */
export function rankStandings(
  standings: Map<string, ContestStanding>,
): RankedStanding[] {
  return [...standings.values()].sort(compareStandings).map((s, i) => ({
    ...s,
    rank: i + 1,
  }));
}

/* ------------------------------------------------------------------ */
/* Practice leaderboard (spec 19.8)                                    */
/* ------------------------------------------------------------------ */

/**
 * PRACTICE LEADERBOARD RULE (shown verbatim on /leaderboard):
 * members are ranked by problems solved, descending; members with the same
 * solved count are ordered by who reached that progress EARLIER — the one
 * whose LATEST accepted solve happened first ranks higher (ascending
 * last-accepted time). Members who never solved keep their order by handle.
 */
export interface PracticeStat {
  userId: string;
  /** Distinct problems with an accepted submission. */
  solved: number;
  /** ISO time of the latest accepted solve, or null when none. */
  lastAcceptedAt: string | null;
}

export function comparePractice(a: PracticeStat, b: PracticeStat): number {
  if (a.solved !== b.solved) return b.solved - a.solved;
  // More recent activity means LATER; earlier latest-solve ranks higher,
  // so sort ascending. Members with no solves sort last by handle.
  if (a.lastAcceptedAt !== null && b.lastAcceptedAt !== null) {
    if (a.lastAcceptedAt !== b.lastAcceptedAt) {
      return a.lastAcceptedAt < b.lastAcceptedAt ? -1 : 1;
    }
  } else if (a.lastAcceptedAt === null && b.lastAcceptedAt !== null) {
    return 1;
  } else if (a.lastAcceptedAt !== null && b.lastAcceptedAt === null) {
    return -1;
  }
  return a.userId.localeCompare(b.userId);
}

export function rankPractice<T extends PracticeStat>(
  stats: T[],
): Array<T & { rank: number }> {
  return [...stats].sort(comparePractice).map((s, i) => ({ ...s, rank: i + 1 }));
}

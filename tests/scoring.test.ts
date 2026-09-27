import { describe, it, expect } from "vitest";
import {
  contestScore,
  rankStandings,
  ICPC_WRONG_TRY_PENALTY,
  type ScorableSubmission,
} from "@/lib/scoring";

/**
 * ICPC scoring (spec 19.7): penalty = solve minute + 20 per wrong try on
 * SOLVED problems; ranking = solved DESC, penalty ASC. Demo "recorded"
 * submissions never move a scoreboard (judge honesty, spec 19.5/36).
 */

const CONTEST = {
  startsAt: "2026-03-14T10:00:00.000Z",
  endsAt: "2026-03-14T12:00:00.000Z",
};

const at = (minutes: number): string =>
  new Date(new Date(CONTEST.startsAt).getTime() + minutes * 60 * 1000).toISOString();

const sub = (
  userId: string,
  problemKey: string,
  verdict: ScorableSubmission["verdict"],
  minutes: number,
): ScorableSubmission => ({
  userId,
  problemKey,
  verdict,
  createdAt: at(minutes),
});

describe("contestScore", () => {
  it("computes penalty as solve minute + 20 per wrong try before the accept", () => {
    const standings = contestScore(
      [
        sub("u1", "a", "wrong_answer", 10),
        sub("u1", "a", "accepted", 30),
      ],
      CONTEST,
    );
    const u1 = standings.get("u1");
    expect(u1).toBeDefined();
    expect(u1?.solved).toBe(1);
    expect(u1?.penalty).toBe(30 + ICPC_WRONG_TRY_PENALTY);
    expect(u1?.solves.get("a")).toEqual({ timeMinutes: 30, tries: 2 });
  });

  it("stacks penalty over multiple solved problems", () => {
    const standings = contestScore(
      [
        sub("u1", "a", "accepted", 25), // 25, 1 try
        sub("u1", "b", "wrong_answer", 40),
        sub("u1", "b", "wrong_answer", 55),
        sub("u1", "b", "accepted", 70), // 70 + 2 x 20
      ],
      CONTEST,
    );
    const u1 = standings.get("u1");
    expect(u1?.solved).toBe(2);
    expect(u1?.penalty).toBe(25 + 70 + 2 * ICPC_WRONG_TRY_PENALTY);
  });

  it("adds NO penalty for wrong tries on problems never solved", () => {
    const standings = contestScore(
      [
        sub("u1", "a", "accepted", 25),
        sub("u1", "b", "wrong_answer", 40),
        sub("u1", "b", "time_limit", 60),
      ],
      CONTEST,
    );
    const u1 = standings.get("u1");
    expect(u1?.solved).toBe(1);
    expect(u1?.penalty).toBe(25);
    expect(u1?.attempted.has("b")).toBe(true);
    expect(u1?.solves.has("b")).toBe(false);
  });

  it("ignores wrong submissions AFTER the first accept (no extra penalty)", () => {
    const standings = contestScore(
      [
        sub("u1", "a", "accepted", 30),
        sub("u1", "a", "wrong_answer", 50),
      ],
      CONTEST,
    );
    expect(standings.get("u1")?.penalty).toBe(30);
    expect(standings.get("u1")?.solves.get("a")?.tries).toBe(1);
  });

  it("ignores demo-recorded submissions entirely (no verdict exists)", () => {
    const standings = contestScore(
      [
        sub("u1", "a", "recorded", 10),
        sub("u1", "b", "recorded", 20),
      ],
      CONTEST,
    );
    expect(standings.size).toBe(0);
  });

  it("ignores submissions outside the contest window", () => {
    const before = {
      userId: "u1",
      problemKey: "a",
      verdict: "accepted" as const,
      createdAt: "2026-03-14T09:59:00.000Z",
    };
    const after = {
      userId: "u1",
      problemKey: "a",
      verdict: "accepted" as const,
      createdAt: "2026-03-14T12:00:01.000Z",
    };
    const standings = contestScore([before, after], CONTEST);
    expect(standings.size).toBe(0);
  });

  it("keeps boundary submissions made exactly at start or end", () => {
    const atStart = {
      userId: "u1",
      problemKey: "a",
      verdict: "accepted" as const,
      createdAt: CONTEST.startsAt,
    };
    const atEnd = {
      userId: "u1",
      problemKey: "b",
      verdict: "accepted" as const,
      createdAt: CONTEST.endsAt,
    };
    const standings = contestScore([atStart, atEnd], CONTEST);
    expect(standings.get("u1")?.solved).toBe(2);
    expect(standings.get("u1")?.penalty).toBe(0 + 120);
  });
});

describe("rankStandings", () => {
  it("ranks by solved DESC, then penalty ASC", () => {
    const standings = contestScore(
      [
        // alpha: 1 solved, penalty 30
        sub("alpha", "a", "accepted", 30),
        // beta: 2 solved, penalty 25 + 70 + 20
        sub("beta", "a", "accepted", 25),
        sub("beta", "b", "wrong_answer", 50),
        sub("beta", "b", "accepted", 70),
        // gamma: 1 solved, penalty 20 (fastest)
        sub("gamma", "a", "accepted", 20),
      ],
      CONTEST,
    );
    const ranked = rankStandings(standings);
    expect(ranked.map((s) => s.userId)).toEqual(["beta", "gamma", "alpha"]);
    expect(ranked.map((s) => s.rank)).toEqual([1, 2, 3]);
  });

  it("breaks exact ties deterministically by userId", () => {
    const standings = contestScore(
      [
        sub("zzz", "a", "accepted", 30),
        sub("aaa", "a", "accepted", 30),
      ],
      CONTEST,
    );
    const ranked = rankStandings(standings);
    expect(ranked.map((s) => s.userId)).toEqual(["aaa", "zzz"]);
  });
});

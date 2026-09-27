"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/guards";
import { getStore } from "@/lib/db";
import { isProblemVisible } from "@/lib/problems/visibility";
import { contestPhase } from "@/lib/contests/window";
import { submitSolution } from "@/lib/judge/judge";

export interface SubmitResult {
  ok: boolean;
  error?: string;
  verdict?: string;
  note?: string;
}

/**
 * Submit code for a problem (login required). Runs the judge adapter
 * (Judge0 when configured, honest demo recording otherwise), stores the
 * submission and refreshes the problem page's panels. When `contestSlug` is
 * given the submission is tagged with the contest (and must respect its
 * clock: no submissions before the start).
 */
export async function submitSolutionAction(input: {
  problemSlug: string;
  code: string;
  contestSlug?: string;
}): Promise<SubmitResult> {
  const user = await getSessionUser();
  if (!user) {
    return {
      ok: false,
      error: "Sign in to submit — browsing is open, submitting needs an account.",
    };
  }

  const code = input.code?.trim() ?? "";
  if (code.length === 0) {
    return { ok: false, error: "Write some code before submitting." };
  }
  if (code.length > 100_000) {
    return { ok: false, error: "Code is too large (100 KB limit)." };
  }

  const store = await getStore();
  const problem = await store.getBySlug(input.problemSlug);
  if (!problem || !isProblemVisible(problem, user)) {
    return { ok: false, error: "Problem not found." };
  }

  let contestId: string | undefined;
  if (input.contestSlug) {
    const contest = await store.getContestBySlug(input.contestSlug);
    if (!contest || contest.status !== "published") {
      return { ok: false, error: "Contest not found." };
    }
    if (!contest.problemSlugs.includes(problem.slug)) {
      return {
        ok: false,
        error: "This problem is not part of that contest.",
      };
    }
    if (contestPhase(contest, Date.now()) === "before") {
      return { ok: false, error: "The contest has not started yet." };
    }
    contestId = contest.id;
    // Join-on-submit: the scoreboard tracks everyone who ever submitted.
    await store.upsertParticipation({
      contestId: contest.id,
      userId: user.id,
    });
    revalidatePath(`/contests/${contest.slug}`);
  }

  const submission = await submitSolution({
    code,
    problem,
    userId: user.id,
    language: "cpp",
    ...(contestId !== undefined ? { contestId } : {}),
  });

  revalidatePath(`/problems/${problem.slug}`);
  revalidatePath("/problems");

  return {
    ok: true,
    verdict: submission.verdict,
    note:
      submission.judgeMode === "demo"
        ? "Demo mode - submission recorded for teacher review, not auto-judged."
        : undefined,
  };
}

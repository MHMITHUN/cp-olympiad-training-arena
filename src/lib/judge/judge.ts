import { getStore } from "@/lib/db";
import type { Submission } from "@/lib/db/types";
import { DemoJudge, DEMO_JUDGE_NOTE } from "./demo";
import { Judge0Judge } from "./judge0";
import { getJudge0Config } from "./config";
import type { Judge, JudgeSubmitInput } from "./types";

/**
 * Judge entry point (spec 19.5 architecture: UI -> action -> adapter ->
 * Judge0 or demo recording -> stored Submission).
 *
 * - Real mode: JUDGE0_API_URL + JUDGE0_API_KEY set -> Judge0Judge.
 * - Demo mode (default): DemoJudge — verdict "recorded", never fabricated.
 */

export { DEMO_JUDGE_NOTE };
export type { Judge, JudgeSubmitInput, JudgeOutcome } from "./types";
export { isJudge0Configured } from "./config";

export function getJudge(): Judge {
  const config = getJudge0Config();
  if (config) return new Judge0Judge(config.url, config.key);
  return new DemoJudge();
}

/**
 * Run the judge for a submission AND record it in the store, maintaining the
 * public counters: every submit counts as an attempt; a user's FIRST
 * accepted submission on a problem also increments its solved count.
 */
export async function submitSolution(
  input: JudgeSubmitInput,
): Promise<Submission> {
  const judge = getJudge();
  const outcome = await judge.submit(input);

  const store = await getStore();
  const submission = await store.recordSubmission({
    problemId: input.problem.id,
    userId: input.userId,
    language: input.language,
    code: input.code,
    verdict: outcome.verdict,
    judgeMode: judge.mode,
    ...(outcome.runtimeMs !== undefined
      ? { runtimeMs: outcome.runtimeMs }
      : {}),
    ...(outcome.memoryKb !== undefined
      ? { memoryKb: outcome.memoryKb }
      : {}),
    ...(input.contestId !== undefined ? { contestId: input.contestId } : {}),
  });

  await store.incAttempted(input.problem.slug);
  if (outcome.verdict === "accepted") {
    const history = await store.listSubmissionsByUser(input.userId);
    const earlierAccepted = history.some(
      (s) =>
        s.id !== submission.id &&
        s.problemSlug === input.problem.slug &&
        s.verdict === "accepted",
    );
    if (!earlierAccepted) await store.incSolved(input.problem.slug);
  }

  return submission;
}

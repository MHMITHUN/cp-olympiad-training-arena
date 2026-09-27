import type { Judge, JudgeOutcome } from "./types";

/**
 * Demo judge (spec 19.5 + 36): used whenever Judge0 is not configured.
 * There is no compiler here, so NO verdict is ever invented — the submission
 * is handed back with verdict "recorded" and the exact honest label the UI
 * also shows in the demo banner. A teacher reviews recorded submissions.
 */

export const DEMO_JUDGE_NOTE =
  "Judge unavailable - submission recorded for teacher review. " +
  "Connect Judge0 for real verdicts.";

export class DemoJudge implements Judge {
  readonly mode = "demo" as const;

  async submit(): Promise<JudgeOutcome> {
    return { verdict: "recorded", note: DEMO_JUDGE_NOTE };
  }
}

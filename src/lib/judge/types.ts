import type { Problem, Verdict } from "@/lib/db/types";

/**
 * Judge adapter contract (spec 19.5). The adapter never fabricates a
 * verdict: the demo implementation records submissions as "recorded" with an
 * honest note, and the Judge0 implementation maps real statuses only.
 */

export interface JudgeSubmitInput {
  code: string;
  problem: Problem;
  userId: string;
  language: "cpp" | "c";
  /** Present when the submission happens inside a contest. */
  contestId?: string;
}

export interface JudgeOutcome {
  verdict: Verdict;
  runtimeMs?: number;
  memoryKb?: number;
  /**
   * Honest human-readable note shown next to the verdict. Demo mode uses
   * DEMO_JUDGE_NOTE verbatim; Judge0 outcomes describe what really happened.
   */
  note: string;
}

export interface Judge {
  readonly mode: "judge0" | "demo";
  submit(input: JudgeSubmitInput): Promise<JudgeOutcome>;
}

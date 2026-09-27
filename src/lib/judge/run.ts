import type { Problem } from "@/lib/db/types";
import { lookupCatalog } from "./catalog";
import { isJudge0Configured } from "./config";

/**
 * "Run on sample" logic (spec 19.5). Demo mode replays recorded outputs for
 * the exact reference solution only — an honest miss otherwise. With Judge0
 * configured, samples really execute.
 */

export interface SampleRunExampleResult {
  input: string;
  expected: string;
  /** Actual program stdout (recorded in demo mode, live with Judge0). */
  actual?: string;
}

export interface SampleRunResult {
  mode: "judge0" | "demo";
  ok: boolean;
  note: string;
  results: SampleRunExampleResult[];
}

export const DEMO_SAMPLE_HIT_NOTE =
  "Demo mode: this is the problem's reference solution, so the recorded " +
  "sample output is shown. Other programs need a real judge.";

export const DEMO_SAMPLE_MISS_NOTE =
  "Demo mode: no live compiler is available, and this exact program is not " +
  "in the pre-recorded catalog. Connect Judge0 via JUDGE0_API_URL / " +
  "JUDGE0_API_KEY (see .env.example) for real execution.";

export async function runOnSample(
  code: string,
  problem: Problem,
): Promise<SampleRunResult> {
  if (isJudge0Configured()) {
    return runOnSampleJudge0(code, problem);
  }

  // Demo mode: catalog hit for THIS problem only.
  const entry = lookupCatalog(code);
  if (!entry || entry.slug !== problem.slug) {
    return { mode: "demo", ok: false, note: DEMO_SAMPLE_MISS_NOTE, results: [] };
  }
  return {
    mode: "demo",
    ok: true,
    note: DEMO_SAMPLE_HIT_NOTE,
    results: entry.samples.map((sample) => ({
      input: sample.stdin,
      expected: sample.stdout,
      actual: sample.stdout,
    })),
  };
}

async function runOnSampleJudge0(
  code: string,
  problem: Problem,
): Promise<SampleRunResult> {
  const { Judge0SampleRunner } = await import("./judge0-run");
  const runner = new Judge0SampleRunner();
  const results: SampleRunExampleResult[] = [];

  for (const example of problem.examples) {
    const run = await runner.execute(code, example.input, problem);
    if (!run) {
      return {
        mode: "judge0",
        ok: false,
        note: "Judge0 request failed while running the samples - nothing was recorded as output.",
        results,
      };
    }
    results.push({
      input: example.input,
      expected: example.output,
      actual: run,
    });
  }

  return {
    mode: "judge0",
    ok: true,
    note: `Judge0 live execution on ${results.length} sample(s).`,
    results,
  };
}

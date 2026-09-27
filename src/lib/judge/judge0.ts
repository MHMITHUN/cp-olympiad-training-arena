import type { Problem, Verdict } from "@/lib/db/types";
import type { Judge, JudgeOutcome, JudgeSubmitInput } from "./types";

/**
 * Real judge through a Judge0-compatible API (self-hosted or RapidAPI).
 *
 * Each example of the problem is submitted as one Judge0 run with
 * `base64_encoded=true&wait=true`, passing the expected output so Judge0
 * itself reports Wrong Answer on mismatch. The first non-accepted example
 * decides the verdict; only genuine Judge0 statuses are ever mapped
 * (spec 19.5 — no fabricated results).
 */

/** C++ (GCC) language id in the Judge0 API. */
const JUDGE0_CPP_LANGUAGE_ID = 54;

interface Judge0Submission {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  memory?: number | null;
  exit_code?: number | null;
  status?: { id: number; description: string } | null;
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function decode(value: string | null | undefined): string {
  if (!value) return "";
  return Buffer.from(value, "base64").toString("utf8");
}

/** Map a Judge0 status id to our verdict vocabulary. */
function verdictForStatusId(id: number): Verdict {
  switch (id) {
    case 3:
      return "accepted";
    case 4:
      return "wrong_answer";
    case 5:
      return "time_limit";
    case 6:
      return "compile_error";
    default:
      // 7-12 runtime signals, 13 internal error, 14 exec format error, ...
      return "runtime_error";
  }
}

export class Judge0Judge implements Judge {
  readonly mode = "judge0" as const;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async submit(input: JudgeSubmitInput): Promise<JudgeOutcome> {
    const examples = input.problem.examples;
    if (examples.length === 0) {
      return {
        verdict: "recorded",
        note: "Judge0 reachable but the problem has no examples to test against - submission recorded for teacher review.",
      };
    }

    let lastRuntimeMs: number | undefined;
    let lastMemoryKb: number | undefined;

    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      const submission = await this.runOnce(
        input.code,
        example.input,
        example.output,
        input.problem,
      );
      if (!submission) {
        return {
          verdict: "recorded",
          note: "Judge0 request failed - submission recorded for teacher review.",
        };
      }

      const statusId = submission.status?.id ?? -1;
      const verdict = verdictForStatusId(statusId);
      const seconds = parseFloat(decode(submission.time ?? "") || "");
      if (!Number.isNaN(seconds)) lastRuntimeMs = Math.round(seconds * 1000);
      if (typeof submission.memory === "number") {
        lastMemoryKb = submission.memory;
      }

      if (verdict !== "accepted") {
        const description =
          submission.status?.description ?? "unknown status";
        const detail = decode(submission.compile_output).trim();
        return {
          verdict,
          ...(lastRuntimeMs !== undefined ? { runtimeMs: lastRuntimeMs } : {}),
          ...(lastMemoryKb !== undefined ? { memoryKb: lastMemoryKb } : {}),
          note:
            verdict === "compile_error" && detail
              ? `Judge0 (${description}) on example ${i + 1}: ${detail.slice(0, 300)}`
              : `Judge0 verdict on example ${i + 1}: ${description}.`,
        };
      }
    }

    return {
      verdict: "accepted",
      ...(lastRuntimeMs !== undefined ? { runtimeMs: lastRuntimeMs } : {}),
      ...(lastMemoryKb !== undefined ? { memoryKb: lastMemoryKb } : {}),
      note: `Judge0 accepted on all ${examples.length} example(s).`,
    };
  }

  /**
   * One synchronous Judge0 run. Returns null when the request itself failed
   * (network / HTTP error) — the caller then records honestly instead of
   * guessing a verdict.
   */
  private async runOnce(
    code: string,
    stdin: string,
    expectedOutput: string,
    problem: Problem,
  ): Promise<Judge0Submission | null> {
    const url = `${this.baseUrl.replace(/\/+$/, "")}/submissions?base64_encoded=true&wait=true`;
    let host: string | undefined;
    try {
      host = new URL(this.baseUrl).host;
    } catch {
      host = undefined;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // Self-hosted Judge0 uses X-Auth-Token; RapidAPI uses its own pair.
          "X-Auth-Token": this.apiKey,
          "X-RapidAPI-Key": this.apiKey,
          ...(host ? { "X-RapidAPI-Host": host } : {}),
        },
        body: JSON.stringify({
          source_code: encode(code),
          language_id: JUDGE0_CPP_LANGUAGE_ID,
          stdin: encode(stdin),
          expected_output: encode(expectedOutput),
          cpu_time_limit: Math.max(1, Math.round(problem.timeLimitMs / 1000)),
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) return null;
      return (await response.json()) as Judge0Submission;
    } catch {
      return null;
    }
  }
}

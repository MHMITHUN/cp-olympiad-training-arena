import type { Problem } from "@/lib/db/types";

/**
 * Minimal synchronous Judge0 runner used by "Run on sample" (no verdict
 * mapping — it just returns the program's real stdout, or null when the
 * request failed so the caller can report honestly).
 */

const JUDGE0_CPP_LANGUAGE_ID = 54;

interface Judge0Submission {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function decode(value: string | null | undefined): string {
  if (!value) return "";
  return Buffer.from(value, "base64").toString("utf8");
}

export class Judge0SampleRunner {
  /** Returns stdout, or null when the run could not be performed. */
  async execute(
    code: string,
    stdin: string,
    problem: Problem,
    baseUrl?: string,
    apiKey?: string,
  ): Promise<string | null> {
    const url0 = baseUrl ?? process.env.JUDGE0_API_URL ?? "";
    const key = apiKey ?? process.env.JUDGE0_API_KEY ?? "";
    if (!url0 || !key) return null;

    const url = `${url0.replace(/\/+$/, "")}/submissions?base64_encoded=true&wait=true`;
    let host: string | undefined;
    try {
      host = new URL(url0).host;
    } catch {
      host = undefined;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Auth-Token": key,
          "X-RapidAPI-Key": key,
          ...(host ? { "X-RapidAPI-Host": host } : {}),
        },
        body: JSON.stringify({
          source_code: encode(code),
          language_id: JUDGE0_CPP_LANGUAGE_ID,
          stdin: encode(stdin),
          cpu_time_limit: Math.max(1, Math.round(problem.timeLimitMs / 1000)),
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) return null;
      const submission = (await response.json()) as Judge0Submission;
      const compileOutput = decode(submission.compile_output).trim();
      if (compileOutput) return `--- compile error ---\n${compileOutput}`;
      return decode(submission.stdout);
    } catch {
      return null;
    }
  }
}

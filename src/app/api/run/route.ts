import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiGuard } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { getStore } from "@/lib/db";
import { isProblemVisible } from "@/lib/problems/visibility";
import { runOnSample } from "@/lib/judge/run";
import { runSampleSchema } from "@/lib/validation/run";

/** Sample runs allowed per user per minute (Judge0 quota brake). */
const RUN_RATE_MAX = 12;
const RUN_RATE_WINDOW_MS = 60 * 1000;

/**
 * POST /api/run — "Run on sample" (login required).
 * Demo mode replays recorded outputs for the exact reference solution only;
 * a miss returns an honest note. With Judge0 configured the samples really
 * execute. Never fabricates output (spec 19.5 + 36).
 */
export async function POST(req: NextRequest) {
  const guard = await apiGuard(req);
  if ("response" in guard) return guard.response;

  // Judge0 quota brake: at most RUN_RATE_MAX runs per user per minute
  // (in-memory, per server instance).
  const limit = rateLimit(
    `run:${guard.user.id}`,
    RUN_RATE_MAX,
    RUN_RATE_WINDOW_MS,
  );
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests - try again in a minute." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = runSampleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const store = await getStore();
  const problem = await store.getBySlug(parsed.data.problemSlug);
  if (!problem || !isProblemVisible(problem, guard.user)) {
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });
  }

  const result = await runOnSample(parsed.data.code, problem);
  return NextResponse.json(result);
}

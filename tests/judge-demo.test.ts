import { describe, it, expect, beforeEach } from "vitest";
import { getStore, resetStoreForTests } from "@/lib/db";
import { getJudge, submitSolution, DEMO_JUDGE_NOTE } from "@/lib/judge/judge";
import { runOnSample, DEMO_SAMPLE_MISS_NOTE } from "@/lib/judge/run";
import { normalizeSource } from "@/lib/judge/catalog";
import { referenceSolutionsBasics } from "@/lib/db/seeds/problems-basics";

/**
 * Judge honesty (spec 19.5 + 36): in demo mode nothing is ever fabricated.
 * Verdicts are "recorded"; the sample-run catalog replays output only for
 * the exact reference solution; every other program gets an honest miss.
 */

beforeEach(() => {
  delete process.env.JUDGE0_API_URL;
  delete process.env.JUDGE0_API_KEY;
  resetStoreForTests();
});

describe("demo judge", () => {
  it("resolves to the demo judge when Judge0 env is absent", () => {
    expect(getJudge().mode).toBe("demo");
  });

  it("records a submission without fabricating a verdict", async () => {
    const store = await getStore();
    const user = await store.findByEmail("student@demo.local");
    const problem = await store.getBySlug("sum-two-numbers");
    expect(problem).not.toBeNull();
    expect(user).not.toBeNull();

    const submission = await submitSolution({
      code: referenceSolutionsBasics["sum-two-numbers"],
      problem: problem!,
      userId: user!.id,
      language: "cpp",
    });

    expect(submission.verdict).toBe("recorded");
    expect(submission.judgeMode).toBe("demo");
    expect(DEMO_JUDGE_NOTE).toContain("Judge unavailable");
    expect(DEMO_JUDGE_NOTE).toContain("Connect Judge0 for real verdicts");
  });

  it("counts the attempt but NEVER the solve for recorded submissions", async () => {
    const store = await getStore();
    const user = await store.findByEmail("student@demo.local");
    const problem = await store.getBySlug("rectangle-area");
    const attemptedBefore = problem!.attemptedCount;
    const solvedBefore = problem!.solvedCount;

    await submitSolution({
      code: referenceSolutionsBasics["rectangle-area"],
      problem: problem!,
      userId: user!.id,
      language: "cpp",
    });

    const after = await store.getBySlug("rectangle-area");
    expect(after!.attemptedCount).toBe(attemptedBefore + 1);
    expect(after!.solvedCount).toBe(solvedBefore); // unchanged
  });

  it("shows up in the user's submission feed for teacher review", async () => {
    const store = await getStore();
    const user = await store.findByEmail("student@demo.local");
    const problem = await store.getBySlug("digit-sum");

    await submitSolution({
      code: referenceSolutionsBasics["digit-sum"],
      problem: problem!,
      userId: user!.id,
      language: "cpp",
    });

    const feed = await store.listSubmissionsByUser(user!.id);
    const mine = feed.find((s) => s.problemSlug === "digit-sum");
    expect(mine).toBeDefined();
    expect(mine!.verdict).toBe("recorded");
    expect(mine!.judgeMode).toBe("demo");
  });
});

describe("sample-run catalog (demo)", () => {
  it("replays recorded outputs for the exact reference solution", async () => {
    const store = await getStore();
    const problem = await store.getBySlug("gcd-lcm");

    const result = await runOnSample(
      referenceSolutionsBasics["gcd-lcm"],
      problem!,
    );

    expect(result.mode).toBe("demo");
    expect(result.ok).toBe(true);
    expect(result.results).toHaveLength(problem!.examples.length);
    for (let i = 0; i < result.results.length; i++) {
      expect(result.results[i].input).toBe(problem!.examples[i].input);
      expect(result.results[i].actual).toBe(problem!.examples[i].output);
    }
  });

  it("matches regardless of whitespace differences", async () => {
    const store = await getStore();
    const problem = await store.getBySlug("sum-two-numbers");
    const padded = "\n\n  " + referenceSolutionsBasics["sum-two-numbers"].replace(/\n/g, "\n  ") + "  \n";

    expect(normalizeSource(padded)).toBe(
      normalizeSource(referenceSolutionsBasics["sum-two-numbers"]),
    );

    const result = await runOnSample(padded, problem!);
    expect(result.ok).toBe(true);
  });

  it("returns an honest miss for any other program", async () => {
    const store = await getStore();
    const problem = await store.getBySlug("palindrome-check");

    const result = await runOnSample(
      "#include <iostream>\nint main() { std::cout << \"hack\"; }",
      problem!,
    );

    expect(result.mode).toBe("demo");
    expect(result.ok).toBe(false);
    expect(result.results).toHaveLength(0);
    expect(result.note).toBe(DEMO_SAMPLE_MISS_NOTE);
    expect(DEMO_SAMPLE_MISS_NOTE).toContain("not in the pre-recorded catalog");
  });

  it("treats another problem's reference solution as a miss", async () => {
    const store = await getStore();
    const problem = await store.getBySlug("gcd-lcm");

    // The correct solution of a DIFFERENT problem must not replay outputs here.
    const result = await runOnSample(
      referenceSolutionsBasics["sum-two-numbers"],
      problem!,
    );

    expect(result.ok).toBe(false);
    expect(result.note).toBe(DEMO_SAMPLE_MISS_NOTE);
  });
});

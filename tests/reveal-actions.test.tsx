import { describe, it, expect, beforeEach, vi } from "vitest";
import { getStore, resetStoreForTests } from "@/lib/db";
import { revealHint, revealEditorial } from "@/app/actions/reveal";

/**
 * The reveal server actions are the props/action boundary that keeps hint
 * and editorial text out of the RSC flight payload (spec 19.4): the problem
 * pages ship only counts/flags, and the content exists server-side only
 * until one of these actions hands it out. Because server actions are a
 * public endpoint, every path here must re-validate: the problem must
 * exist, be visible to the caller (published, or a draft for staff), and
 * the hint index must be in range.
 *
 * The session lookup needs a Next.js request scope, so the guard is mocked
 * to an anonymous visitor (the strictest caller).
 */

vi.mock("@/lib/auth/guards", () => ({
  getSessionUser: vi.fn().mockResolvedValue(null),
}));

beforeEach(() => {
  resetStoreForTests();
});

describe("revealHint", () => {
  it("returns the stored hint content for a valid index", async () => {
    const store = await getStore();
    const problem = await store.getBySlug("digit-sum");
    expect(problem).not.toBeNull();

    const hint = await revealHint("digit-sum", 0);
    expect(hint).toBe(problem!.hints[0]);
    expect(hint).toMatch(/string/i); // the real seeded hint text
  });

  it("rejects out-of-range and non-integer indexes (no clamping)", async () => {
    const store = await getStore();
    const problem = await store.getBySlug("digit-sum");
    const last = problem!.hints.length - 1;

    // The final valid index is fine; everything past it rejects.
    await expect(revealHint("digit-sum", last)).resolves.toBe(
      problem!.hints[last],
    );
    await expect(revealHint("digit-sum", last + 1)).rejects.toThrow(
      /index out of range/i,
    );
    await expect(revealHint("digit-sum", -1)).rejects.toThrow(
      /index out of range/i,
    );
    await expect(revealHint("digit-sum", 1.5)).rejects.toThrow(
      /index out of range/i,
    );
  });

  it("rejects unknown problem slugs", async () => {
    await expect(revealHint("no-such-problem", 0)).rejects.toThrow(
      /problem not found/i,
    );
  });

  it("rejects draft problems for an anonymous caller", async () => {
    const store = await getStore();
    await store.createProblem({
      slug: "draft-secret",
      title: "Draft (unpublished)",
      statementMd: "Draft statement.",
      difficulty: "easy",
      pathSlug: "problem-solving",
      topics: ["drafts"],
      constraintsMd: "- n <= 10",
      examples: [{ input: "1", output: "1" }],
      starterCodeCpp: "int main() { return 0; }",
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      hints: ["draft hint text"],
      editorialMd: "Draft editorial text.",
      status: "draft",
      authorId: "usr-teacher-01",
    });

    await expect(revealHint("draft-secret", 0)).rejects.toThrow(
      /problem not found/i,
    );
  });
});

describe("revealEditorial", () => {
  it("returns the stored editorial for a published problem", async () => {
    const store = await getStore();
    const problem = await store.getBySlug("digit-sum");
    expect(problem).not.toBeNull();

    const editorial = await revealEditorial("digit-sum");
    expect(editorial).toBe(problem!.editorialMd);
    expect(editorial).toMatch(/digit/i);
  });

  it("rejects unknown problem slugs", async () => {
    await expect(revealEditorial("no-such-problem")).rejects.toThrow(
      /problem not found/i,
    );
  });

  it("rejects draft problems for an anonymous caller", async () => {
    const store = await getStore();
    await store.createProblem({
      slug: "draft-secret",
      title: "Draft (unpublished)",
      statementMd: "Draft statement.",
      difficulty: "easy",
      pathSlug: "problem-solving",
      topics: ["drafts"],
      constraintsMd: "- n <= 10",
      examples: [{ input: "1", output: "1" }],
      starterCodeCpp: "int main() { return 0; }",
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      hints: ["draft hint text"],
      editorialMd: "Draft editorial text.",
      status: "draft",
      authorId: "usr-teacher-01",
    });

    await expect(revealEditorial("draft-secret")).rejects.toThrow(
      /problem not found/i,
    );
  });
});

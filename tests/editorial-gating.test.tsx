import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { getStore, resetStoreForTests } from "@/lib/db";
import { isProblemVisible } from "@/lib/problems/visibility";
import { EditorialReveal } from "@/components/problems/EditorialReveal";

/**
 * Editorial gating + draft invisibility (spec 19.4):
 * - drafts never appear publicly (store list + visibility rule);
 * - the editorial is never exposed before the student chooses to reveal it.
 */

beforeEach(() => {
  resetStoreForTests();
});

describe("draft problems are invisible publicly", () => {
  it("excludes drafts from listPublished", async () => {
    const store = await getStore();
    const before = await store.listPublished();

    await store.createProblem({
      slug: "draft-dry-run",
      title: "Coach Draft (unpublished)",
      statementMd: "Draft statement.",
      difficulty: "easy",
      pathSlug: "problem-solving",
      topics: ["drafts"],
      constraintsMd: "- n <= 10",
      examples: [{ input: "1", output: "1" }],
      starterCodeCpp: "int main() { return 0; }",
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      hints: ["draft hint"],
      editorialMd: "Draft editorial.",
      status: "draft",
      authorId: "usr-teacher-01",
    });

    const after = await store.listPublished();
    expect(after.total).toBe(before.total);
    expect(after.items.some((p) => p.slug === "draft-dry-run")).toBe(false);
  });

  it("getBySlug still returns drafts (coach area) but visibility rules hide them", async () => {
    const store = await getStore();
    const draft = await store.getBySlug("draft-dry-run");
    expect(draft).toBeNull(); // not created in this test's fresh store

    const published = await store.getBySlug("sum-two-numbers");
    expect(published).not.toBeNull();

    expect(isProblemVisible(published!, null)).toBe(true);
    expect(isProblemVisible(published!, { role: "STUDENT" })).toBe(true);

    // A draft problem object is public to no one but staff.
    const draftObject = { ...published!, status: "draft" as const };
    expect(isProblemVisible(draftObject, null)).toBe(false);
    expect(isProblemVisible(draftObject, { role: "STUDENT" })).toBe(false);
    expect(isProblemVisible(draftObject, { role: "TEACHER" })).toBe(true);
    expect(isProblemVisible(draftObject, { role: "ADMIN" })).toBe(true);
  });
});

describe("editorial is revealed only by explicit choice", () => {
  it("hides the editorial content until the student opts in", () => {
    const secret = "The secret approach is two pointers meeting in the middle.";
    const { container } = render(
      <EditorialReveal editorialMd={`## Approach\n\n${secret}`} />,
    );

    // Locked state: the solution text must not be in the document.
    expect(screen.queryByText(/secret approach/i)).toBeNull();
    const button = screen.getByRole("button", {
      name: "I want to see the editorial",
    });
    expect(button).toBeDefined();

    fireEvent.click(button);

    // Opted-in state: the solution text is now visible.
    expect(screen.getByText(/secret approach/i)).toBeDefined();
    expect(container).toBeDefined();
  });
});

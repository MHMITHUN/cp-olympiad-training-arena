import { describe, it, expect, beforeEach } from "vitest";
import { getStore, resetStoreForTests } from "@/lib/db";
import { isProblemVisible } from "@/lib/problems/visibility";
import type { Problem } from "@/lib/db/types";

/**
 * Draft-problem gating for STUDENTS (spec 19.4 + the publish rule): drafts
 * are authoring state, invisible to students and anonymous visitors; only
 * TEACHER/ADMIN see them, and only publishing flips them public. The store
 * listing rules are covered in tests/problem-filter.test.ts; this file walks
 * the full student-facing path: single-problem visibility, topic chips,
 * publish transition and the matching contest rule.
 */

beforeEach(() => {
  resetStoreForTests();
});

const DRAFT_TOPIC = "draft-only-topic";

async function createDraft(): Promise<Problem> {
  const store = await getStore();
  return store.createProblem({
    slug: "draft-gate-check",
    title: "Draft Gate Check (unpublished)",
    statementMd: "Statement under review.",
    difficulty: "easy",
    pathSlug: "problem-solving",
    topics: [DRAFT_TOPIC],
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
}

describe("draft problems are gated away from students", () => {
  it("a draft is invisible to STUDENT and anonymous, visible to staff", async () => {
    const draft = await createDraft();

    expect(isProblemVisible(draft, null)).toBe(false);
    expect(isProblemVisible(draft, { role: "STUDENT" })).toBe(false);
    expect(isProblemVisible(draft, { role: "TEACHER" })).toBe(true);
    expect(isProblemVisible(draft, { role: "ADMIN" })).toBe(true);
  });

  it("the public list and the topic chips never mention a draft", async () => {
    const store = await getStore();
    const before = await store.listPublished();
    await createDraft();

    const after = await store.listPublished();
    expect(after.total).toBe(before.total);
    expect(after.items.some((p) => p.slug === "draft-gate-check")).toBe(false);

    // Draft-only topics must not leak into the public topic filter chips.
    expect(await store.listTopics()).not.toContain(DRAFT_TOPIC);

    // The coach-side listing DOES include it (authoring view).
    const all = await store.listAll();
    expect(all.some((p) => p.slug === "draft-gate-check")).toBe(true);
  });

  it("publishing flips the problem public for everyone", async () => {
    const store = await getStore();
    const draft = await createDraft();
    expect(isProblemVisible(draft, { role: "STUDENT" })).toBe(false);

    const published = await store.setProblemStatus(draft.id, "published");
    expect(published?.status).toBe("published");

    expect(isProblemVisible(published!, { role: "STUDENT" })).toBe(true);
    expect(isProblemVisible(published!, null)).toBe(true);

    const list = await store.listPublished({ q: "draft gate check" });
    expect(list.total).toBe(1);
    expect(list.items[0].slug).toBe("draft-gate-check");
    expect(await store.listTopics()).toContain(DRAFT_TOPIC);
  });

  it("a draft stays fetchable by slug for the coach area, not for students", async () => {
    const store = await getStore();
    await createDraft();

    // getBySlug intentionally returns drafts — the CALLER guards visibility
    // (the problem page calls isProblemVisible and 404s for students).
    const fetched = await store.getBySlug("draft-gate-check");
    expect(fetched).not.toBeNull();
    expect(isProblemVisible(fetched!, { role: "STUDENT" })).toBe(false);
  });
});

describe("draft contests follow the same rule", () => {
  it("hides a draft contest from the public list until published", async () => {
    const store = await getStore();
    const before = await store.listPublishedContests();

    const draftContest = await store.createContest({
      slug: "draft-round-check",
      title: "Draft Round (unpublished)",
      descriptionMd: "Not announced yet.",
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 180,
      problemSlugs: ["sum-two-numbers"],
      rulesMd: "ICPC scoring.",
      status: "draft",
      createdBy: "usr-teacher-01",
    });

    const stillHidden = await store.listPublishedContests();
    expect(stillHidden).toHaveLength(before.length);
    expect(stillHidden.some((c) => c.slug === "draft-round-check")).toBe(false);

    // The coach detail page can still fetch it by slug.
    expect(await store.getContestBySlug("draft-round-check")).not.toBeNull();

    const published = await store.updateContest(draftContest.id, {
      status: "published",
    });
    expect(published?.status).toBe("published");
    const visible = await store.listPublishedContests();
    expect(visible.some((c) => c.slug === "draft-round-check")).toBe(true);
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { getStore, resetStoreForTests } from "@/lib/db";

/**
 * Problem listing filters + pagination on the store (spec 19.2-19.4): the
 * public list is published-only, every filter applies before pagination, and
 * the personal status filter keeps paging honest.
 */

beforeEach(() => {
  resetStoreForTests();
});

describe("listPublished filters", () => {
  it("lists only published problems (drafts excluded)", async () => {
    const store = await getStore();
    const paged = await store.listPublished();
    expect(paged.total).toBe(40); // 20 basics + 20 advanced seed problems
    expect(paged.items.every((p) => p.status === "published")).toBe(true);
  });

  it("filters by difficulty", async () => {
    const store = await getStore();
    const medium = await store.listPublished({ difficulty: "medium" });
    expect(medium.total).toBeGreaterThan(0);
    expect(medium.items.every((p) => p.difficulty === "medium")).toBe(true);

    const easy = await store.listPublished({ difficulty: "easy" });
    const hard = await store.listPublished({ difficulty: "hard" });
    // Curriculum bank uses honest bands: every seeded problem is easy/medium.
    expect(easy.total + medium.total + hard.total).toBe(40);
    expect(easy.total).toBe(24);
    expect(medium.total).toBe(16);
  });

  it("filters by learning path", async () => {
    const store = await getStore();
    const stl = await store.listPublished({ pathSlug: "stl" });
    expect(stl.total).toBe(3);
    expect(stl.items.map((p) => p.slug).sort()).toEqual([
      "sort-with-stl",
      "string-ops",
      "vector-sum-max",
    ]);
  });

  it("filters by topic", async () => {
    const store = await getStore();
    const binary = await store.listPublished({ topic: "binary-search" });
    expect(binary.total).toBe(1);
    expect(binary.items[0].slug).toBe("binary-search-basics");
  });

  it("searches titles case-insensitively", async () => {
    const store = await getStore();
    const paged = await store.listPublished({ q: "PALINDROME" });
    expect(paged.total).toBe(1);
    expect(paged.items[0].slug).toBe("palindrome-check");
  });

  it("combines filters", async () => {
    const store = await getStore();
    const paged = await store.listPublished({
      pathSlug: "number-theory",
      difficulty: "easy",
    });
    // easy number-theory problems: prime-check, gcd-lcm
    expect(paged.total).toBe(2);
  });
});

describe("pagination", () => {
  it("paginates 15 per page with honest totals", async () => {
    const store = await getStore();
    const page1 = await store.listPublished({ page: 1, pageSize: 15 });
    const page2 = await store.listPublished({ page: 2, pageSize: 15 });
    const page3 = await store.listPublished({ page: 3, pageSize: 15 });

    expect(page1.total).toBe(40);
    expect(page1.items).toHaveLength(15);
    expect(page2.items).toHaveLength(15);
    expect(page3.items).toHaveLength(10);
    expect(page3.page).toBe(3);
    // no overlap between pages
    const ids1 = new Set([...page1.items, ...page2.items].map((p) => p.id));
    expect(page3.items.every((p) => !ids1.has(p.id))).toBe(true);
  });

  it("returns an empty page past the end", async () => {
    const store = await getStore();
    const paged = await store.listPublished({ page: 5, pageSize: 15 });
    expect(paged.items).toHaveLength(0);
    expect(paged.total).toBe(40);
  });
});

describe("personal status filter", () => {
  it("solved lists only problems this user has accepted", async () => {
    const store = await getStore();
    // usr-student-03 has WA + AC on sum-two-numbers (seeded history).
    const solved = await store.listPublished({
      status: "solved",
      userId: "usr-student-03",
    });
    expect(solved.total).toBe(1);
    expect(solved.items[0].slug).toBe("sum-two-numbers");
  });

  it("attempted lists submitted-but-never-solved problems", async () => {
    const store = await getStore();
    // usr-student-13 has only a time_limit on trailing-zeros-easy.
    const attempted = await store.listPublished({
      status: "attempted",
      userId: "usr-student-13",
    });
    expect(attempted.total).toBe(1);
    expect(attempted.items[0].slug).toBe("trailing-zeros-easy");

    const solved = await store.listPublished({
      status: "solved",
      userId: "usr-student-13",
    });
    expect(solved.total).toBe(0);
  });

  it("untried excludes everything the user submitted", async () => {
    const store = await getStore();
    const untried = await store.listPublished({
      status: "untried",
      userId: "usr-student-13",
    });
    expect(untried.total).toBe(39);
    expect(
      untried.items.some((p) => p.slug === "trailing-zeros-easy"),
    ).toBe(false);
  });

  it("ignores the status filter without a userId", async () => {
    const store = await getStore();
    const paged = await store.listPublished({ status: "solved" });
    expect(paged.total).toBe(40);
  });
});

describe("topics", () => {
  it("lists distinct published topics alphabetically", async () => {
    const store = await getStore();
    const topics = await store.listTopics();
    expect(topics.length).toBeGreaterThan(5);
    expect(topics).toContain("binary-search");
    expect(topics).toContain("stl");
    expect([...topics].sort()).toEqual(topics);
  });
});

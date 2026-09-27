import { describe, it, expect } from "vitest";
import {
  topicMastery,
  difficultyDistribution,
} from "@/lib/stats";

/**
 * Per-topic aggregation (spec 19.9): coverage = solved/total of each
 * topic's published problems — a descriptive metric, never a skill score.
 */

const PROBLEMS = [
  { slug: "p1", topics: ["greedy", "sorting"] },
  { slug: "p2", topics: ["greedy"] },
  { slug: "p3", topics: ["greedy", "dp"] },
  { slug: "p4", topics: ["dp"] },
  { slug: "p5", topics: ["sorting"] },
];

describe("topicMastery", () => {
  it("aggregates solved/total per topic across overlapping topics", () => {
    const rows = topicMastery(PROBLEMS, new Set(["p1", "p3"]));
    const byTopic = new Map(rows.map((r) => [r.topic, r]));
    expect(byTopic.get("greedy")).toEqual({ topic: "greedy", solved: 2, total: 3 });
    expect(byTopic.get("dp")).toEqual({ topic: "dp", solved: 1, total: 2 });
    expect(byTopic.get("sorting")).toEqual({ topic: "sorting", solved: 1, total: 2 });
  });

  it("counts unsolved problems in the totals (coverage, not a skill score)", () => {
    const rows = topicMastery(PROBLEMS, new Set<string>());
    for (const row of rows) {
      expect(row.solved).toBe(0);
      expect(row.total).toBeGreaterThan(0);
    }
  });

  it("orders rows by total descending, then topic name", () => {
    const rows = topicMastery(PROBLEMS, new Set(["p1"]));
    expect(rows.map((r) => r.topic)).toEqual([
      "greedy", // total 3
      "dp", // total 2
      "sorting", // total 2, later alphabetically
    ]);
  });

  it("handles an empty problem list", () => {
    expect(topicMastery([], new Set(["x"]))).toEqual([]);
  });
});

describe("difficultyDistribution", () => {
  const problems = [
    { slug: "a", difficulty: "easy" as const },
    { slug: "b", difficulty: "easy" as const },
    { slug: "c", difficulty: "medium" as const },
    { slug: "d", difficulty: "hard" as const },
  ];

  it("counts solved and total per difficulty band", () => {
    const rows = difficultyDistribution(problems, new Set(["a", "c"]));
    expect(rows).toEqual([
      { difficulty: "easy", solved: 1, total: 2 },
      { difficulty: "medium", solved: 1, total: 1 },
      { difficulty: "hard", solved: 0, total: 1 },
    ]);
  });

  it("keeps all three bands even when a band is empty", () => {
    const rows = difficultyDistribution(
      [{ slug: "a", difficulty: "easy" }],
      new Set<string>(),
    );
    expect(rows.map((r) => r.difficulty)).toEqual(["easy", "medium", "hard"]);
    expect(rows[1].total).toBe(0);
    expect(rows[2].total).toBe(0);
  });
});

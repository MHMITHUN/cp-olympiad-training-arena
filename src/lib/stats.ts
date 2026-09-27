import type { Difficulty } from "@/lib/db/types";

/**
 * PURE profile/coach statistics helpers (spec 19.9). No store and no clock
 * access inside — `now` is always an explicit parameter so tests are
 * deterministic. Day arithmetic uses UTC calendar days (documented).
 */

/** "YYYY-MM-DD" UTC day key of an ISO timestamp (or of a Date). */
export function utcDayKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function addDays(dayKey: string, days: number): string {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Consecutive-day submission streak: the number of consecutive UTC days with
 * at least one submission, ending today — or, if today has no submission
 * yet, ending yesterday (a streak survives until the whole day passes).
 * Returns 0 when neither today nor yesterday has a submission.
 */
export function computeStreak(submissionDates: string[], now: Date): number {
  const days = new Set(
    submissionDates
      .map((iso) => utcDayKey(iso))
      .filter((key): key is string => key !== ""),
  );
  if (days.size === 0) return 0;

  let anchor = utcDayKey(now);
  if (!days.has(anchor)) {
    anchor = addDays(anchor, -1);
    if (!days.has(anchor)) return 0;
  }

  let streak = 0;
  while (days.has(anchor)) {
    streak += 1;
    anchor = addDays(anchor, -1);
  }
  return streak;
}

export interface TopicMasteryRow {
  topic: string;
  solved: number;
  total: number;
}

/**
 * Per-topic coverage: solved / total published problems carrying each topic.
 * This is a DESCRIPTIVE coverage metric, not a skill score — it simply shows
 * how much of each topic's available practice the member has completed.
 * Rows are ordered by total descending, then topic name.
 */
export function topicMastery(
  problems: Array<{ slug: string; topics: string[] }>,
  solvedSlugs: Set<string>,
): TopicMasteryRow[] {
  const rows = new Map<string, TopicMasteryRow>();
  for (const problem of problems) {
    const solved = solvedSlugs.has(problem.slug);
    for (const topic of problem.topics) {
      const row = rows.get(topic) ?? { topic, solved: 0, total: 0 };
      row.total += 1;
      if (solved) row.solved += 1;
      rows.set(topic, row);
    }
  }
  return [...rows.values()].sort(
    (a, b) => b.total - a.total || a.topic.localeCompare(b.topic),
  );
}

export interface DifficultyRow {
  difficulty: Difficulty;
  solved: number;
  total: number;
}

/** Solved / published counts per difficulty band (profile bar chart data). */
export function difficultyDistribution(
  problems: Array<{ slug: string; difficulty: Difficulty }>,
  solvedSlugs: Set<string>,
): DifficultyRow[] {
  const order: Difficulty[] = ["easy", "medium", "hard"];
  const rows = new Map<Difficulty, DifficultyRow>(
    order.map((difficulty) => [difficulty, { difficulty, solved: 0, total: 0 }]),
  );
  for (const problem of problems) {
    const row = rows.get(problem.difficulty);
    if (!row) continue;
    row.total += 1;
    if (solvedSlugs.has(problem.slug)) row.solved += 1;
  }
  return order.map((difficulty) => rows.get(difficulty) as DifficultyRow);
}

/**
 * Day-by-day submission counts for the last `days` days, ending TODAY
 * (inclusive). Returns one cell per day, oldest first — the 12-week
 * activity strip renders these directly.
 */
export interface ActivityDay {
  dayKey: string;
  /** Number of submissions that UTC day (any verdict). */
  count: number;
}

export function recentDayCounts(
  submissionDates: string[],
  now: Date,
  days: number,
): ActivityDay[] {
  const counts = new Map<string, number>();
  for (const iso of submissionDates) {
    const key = utcDayKey(iso);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const cells: ActivityDay[] = [];
  let cursor = utcDayKey(now);
  for (let i = 0; i < days; i++) {
    cells.push({ dayKey: cursor, count: counts.get(cursor) ?? 0 });
    cursor = addDays(cursor, -1);
  }
  return cells.reverse();
}

import type { Problem, User } from "@/lib/db/types";

/**
 * Problem visibility rule: published problems are public (browsing without
 * login is a spec rule); drafts are visible ONLY to TEACHER/ADMIN. The store
 * also enforces this inside listPublished(); this helper guards single-problem
 * fetches (getBySlug returns drafts on purpose for the coach area).
 */
export function isProblemVisible(
  problem: Problem,
  user: Pick<User, "role"> | null | undefined,
): boolean {
  if (problem.status === "published") return true;
  return user?.role === "TEACHER" || user?.role === "ADMIN";
}

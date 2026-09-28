"use server";

import { getSessionUser } from "@/lib/auth/guards";
import { getStore } from "@/lib/db";
import { isProblemVisible } from "@/lib/problems/visibility";
import type { Problem } from "@/lib/db/types";

/**
 * On-demand hint / editorial reveal (spec 19.4).
 *
 * Hint and editorial text is NEVER shipped to the browser up front: the
 * problem pages pass only counts/flags to the client panels, and the actual
 * content is fetched through these server actions when the student clicks.
 * Server actions are a public endpoint (requests can arrive without going
 * through the UI), so every reveal re-validates on the server: the problem
 * must exist, be visible to the caller (published, or a draft for staff),
 * and the hint index must be in range.
 */

/** Load a problem the caller is allowed to read hints/editorial for. */
async function loadRevealableProblem(
  problemSlug: string,
): Promise<Problem | null> {
  const store = await getStore();
  const problem = await store.getBySlug(problemSlug);
  if (!problem) return null;
  const user = await getSessionUser();
  if (!isProblemVisible(problem, user)) return null;
  return problem;
}

/** Reveal a single hint by its 0-based index; out-of-range indexes reject. */
export async function revealHint(
  problemSlug: string,
  index: number,
): Promise<string> {
  const problem = await loadRevealableProblem(problemSlug);
  if (!problem) {
    throw new Error("Problem not found.");
  }
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= problem.hints.length
  ) {
    throw new Error("Hint index out of range.");
  }
  return problem.hints[index];
}

/** Reveal the editorial of a visible problem on explicit request. */
export async function revealEditorial(problemSlug: string): Promise<string> {
  const problem = await loadRevealableProblem(problemSlug);
  if (!problem) {
    throw new Error("Problem not found.");
  }
  return problem.editorialMd;
}

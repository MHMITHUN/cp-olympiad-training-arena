import type { ProblemExample } from "@/lib/db/types";
import {
  seedProblemsBasics,
  referenceSolutionsBasics,
} from "@/lib/db/seeds/problems-basics";
import {
  seedProblemsAdvanced,
  referenceSolutionsAdvanced,
} from "@/lib/db/seeds/problems-advanced";

/**
 * Demo sample-run catalog (P01 pattern, spec 19.5 + 36).
 *
 * There is no live compiler in demo mode. "Run on sample" can only replay a
 * RECORDED output when the submitted source (whitespace-normalized) exactly
 * matches a reference solution from the seed bank — anything else gets an
 * honest miss message. Output is NEVER fabricated.
 */

export interface CatalogEntry {
  /** The problem the recorded outputs belong to. */
  slug: string;
  title: string;
  /** Recorded per-example runs: sample input -> recorded stdout. */
  samples: Array<{ stdin: string; stdout: string }>;
}

/** Collapse all whitespace so indentation and blank lines do not matter. */
export function normalizeSource(code: string): string {
  return code.replace(/\s+/g, " ").trim();
}

const catalog = new Map<string, CatalogEntry>();

function register(
  slug: string,
  title: string,
  code: string,
  examples: ProblemExample[],
): void {
  const key = normalizeSource(code);
  if (key.length === 0) return;
  catalog.set(key, {
    slug,
    title,
    samples: examples.map((example) => ({
      stdin: example.input,
      stdout: example.output,
    })),
  });
}

// Every seeded problem: its reference solution on that problem's examples.
const referenceSolutions = {
  ...referenceSolutionsBasics,
  ...referenceSolutionsAdvanced,
};
for (const problem of [...seedProblemsBasics, ...seedProblemsAdvanced]) {
  const solution = referenceSolutions[problem.slug];
  if (solution) {
    register(problem.slug, problem.title, solution, problem.examples);
  }
}

/**
 * Exact-match lookup. Also returns a hit when the code matches a DIFFERENT
 * problem's reference solution — the caller compares entry.slug with the
 * problem being viewed and treats a foreign slug as a miss (the recorded
 * outputs would not belong to this problem's samples).
 */
export function lookupCatalog(code: string): CatalogEntry | null {
  return catalog.get(normalizeSource(code)) ?? null;
}

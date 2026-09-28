"use client";

import { useState } from "react";
import { Lightbulb, Eye } from "lucide-react";
import { Alert } from "@/components/ui";
import { Markdown } from "@/lib/markdown";
import { revealHint } from "@/app/actions/reveal";

/**
 * Progressive hints (spec 19.4): one hint at a time, "Hint 1 of 3", each
 * reveal strictly optional. The last hint is never shown automatically.
 *
 * The hint TEXT is never passed in as a prop — the server-rendered page
 * ships only the count, and each click fetches one hint from the
 * revealHint server action, so no hint ever appears in the initial HTML /
 * RSC flight payload before the student asks for it.
 */
export function HintsPanel({
  problemSlug,
  hintCount,
}: {
  problemSlug: string;
  hintCount: number;
}) {
  /** Hint texts already revealed, fetched on demand from the server. */
  const [hints, setHints] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hintCount === 0) return null;

  async function revealNext() {
    const index = hints.length;
    if (index >= hintCount) return;
    setLoading(true);
    setError(null);
    try {
      const hint = await revealHint(problemSlug, index);
      setHints((current) => [...current, hint]);
    } catch {
      setError(
        "Could not load this hint — check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const revealed = hints.length;

  return (
    <div className="flex flex-col gap-3">
      {revealed > 0 && (
        <ol className="flex flex-col gap-3">
          {hints.map((hint, index) => (
            <li
              key={index}
              className="rounded-lg border border-accent/20 bg-accent/5 p-3"
            >
              <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-accent">
                Hint {index + 1} of {hintCount}
              </p>
              <Markdown source={hint} />
            </li>
          ))}
        </ol>
      )}

      {error && (
        <Alert tone="danger" title="Hint unavailable">
          {error}
        </Alert>
      )}

      {revealed < hintCount ? (
        <button
          type="button"
          onClick={revealNext}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-fg transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-60"
        >
          {revealed === 0 ? (
            <Lightbulb className="size-3.5 text-accent" aria-hidden="true" />
          ) : (
            <Eye className="size-3.5 text-accent" aria-hidden="true" />
          )}
          {loading
            ? "Revealing…"
            : revealed === 0
              ? `Reveal hint 1 of ${hintCount}`
              : `Reveal hint ${revealed + 1} of ${hintCount}`}
        </button>
      ) : (
        <p className="text-xs text-muted">
          All {hintCount} hints revealed — the editorial is the next step if
          you are still stuck.
        </p>
      )}
    </div>
  );
}

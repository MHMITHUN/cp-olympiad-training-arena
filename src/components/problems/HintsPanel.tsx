"use client";

import { useState } from "react";
import { Lightbulb, Eye } from "lucide-react";
import { Markdown } from "@/lib/markdown";

/**
 * Progressive hints (spec 19.4): one hint at a time, "Hint 1 of 3", each
 * reveal strictly optional. The last hint is never shown automatically.
 */
export function HintsPanel({ hints }: { hints: string[] }) {
  const [revealed, setRevealed] = useState(0);

  if (hints.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {revealed > 0 && (
        <ol className="flex flex-col gap-3">
          {hints.slice(0, revealed).map((hint, index) => (
            <li
              key={index}
              className="rounded-lg border border-accent/20 bg-accent/5 p-3"
            >
              <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-accent">
                Hint {index + 1} of {hints.length}
              </p>
              <Markdown source={hint} />
            </li>
          ))}
        </ol>
      )}

      {revealed < hints.length ? (
        <button
          type="button"
          onClick={() => setRevealed((count) => count + 1)}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-fg transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {revealed === 0 ? (
            <Lightbulb className="size-3.5 text-accent" aria-hidden="true" />
          ) : (
            <Eye className="size-3.5 text-accent" aria-hidden="true" />
          )}
          {revealed === 0
            ? `Reveal hint 1 of ${hints.length}`
            : `Reveal hint ${revealed + 1} of ${hints.length}`}
        </button>
      ) : (
        <p className="text-xs text-muted">
          All {hints.length} hints revealed — the editorial is the next step if
          you are still stuck.
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Alert } from "@/components/ui";
import { Markdown } from "@/lib/markdown";

/**
 * Editorial gate (spec 19.4): the solution is NEVER exposed before the
 * student explicitly chooses to see it. The button label says exactly what
 * will happen.
 */
export function EditorialReveal({ editorialMd }: { editorialMd: string }) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <Alert tone="warning" title="Editorial locked">
        <p>
          The editorial shows the full approach, a working C++ solution and
          the complexity. Trying the problem first — even the hints — is how
          training works.
        </p>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <BookOpen className="size-3.5" aria-hidden="true" />
          I want to see the editorial
        </button>
      </Alert>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-3 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-accent">
        <BookOpen className="size-3.5" aria-hidden="true" />
        Editorial
      </p>
      <Markdown source={editorialMd} />
      <button
        type="button"
        onClick={() => setRevealed(false)}
        className="mt-4 text-xs text-muted underline-offset-2 transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Hide the editorial again
      </button>
    </div>
  );
}

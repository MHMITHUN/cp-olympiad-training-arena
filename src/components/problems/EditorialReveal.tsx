"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Alert, Spinner } from "@/components/ui";
import { Markdown } from "@/lib/markdown";
import { revealEditorial } from "@/app/actions/reveal";

/**
 * Editorial gate (spec 19.4): the solution is NEVER exposed before the
 * student explicitly chooses to see it. The button label says exactly what
 * will happen.
 *
 * The editorial TEXT is never passed in as a prop — the page ships only a
 * hasEditorial flag, and the confirmed click fetches the content from the
 * revealEditorial server action, so the solution never appears in the
 * initial HTML / RSC flight payload.
 */
export function EditorialReveal({
  problemSlug,
  hasEditorial,
}: {
  problemSlug: string;
  hasEditorial: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [editorialMd, setEditorialMd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasEditorial) return null;

  async function onConfirm() {
    setRevealed(true);
    setLoading(true);
    setError(null);
    try {
      const content = await revealEditorial(problemSlug);
      setEditorialMd(content);
    } catch {
      setError("Could not load the editorial — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

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
          onClick={onConfirm}
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

      {loading && <Spinner label="Loading the editorial…" />}

      {error && (
        <Alert tone="danger" title="Editorial unavailable">
          {error}
          <button
            type="button"
            onClick={onConfirm}
            className="mt-2 block text-xs font-semibold text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Try again
          </button>
        </Alert>
      )}

      {editorialMd && <Markdown source={editorialMd} />}

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

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Server-rendered pagination as links (works without JavaScript).
 * `hrefFor(page)` builds the filtered URL with the right ?page= value.
 */
export function Pagination({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const linkClass =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-border bg-surface px-2.5 font-mono text-xs text-fg transition-colors hover:border-accent/40 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const currentClass =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-accent bg-accent/10 px-2.5 font-mono text-xs font-semibold text-accent";

  // A small window around the current page, plus first/last when far away.
  const window: number[] = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(pages, from + 4);
  for (let p = from; p <= to; p++) window.push(p);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2">
      {page > 1 ? (
        <a href={hrefFor(page - 1)} className={linkClass} aria-label="Previous page">
          <ChevronLeft className="size-3.5" aria-hidden="true" />
        </a>
      ) : (
        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-border px-2.5 text-muted opacity-40">
          <ChevronLeft className="size-3.5" aria-hidden="true" />
        </span>
      )}

      {from > 1 && (
        <>
          <a href={hrefFor(1)} className={linkClass}>
            1
          </a>
          {from > 2 && <span className="px-1 text-muted">…</span>}
        </>
      )}

      {window.map((p) =>
        p === page ? (
          <span key={p} aria-current="page" className={currentClass}>
            {p}
          </span>
        ) : (
          <a key={p} href={hrefFor(p)} className={linkClass}>
            {p}
          </a>
        ),
      )}

      {to < pages && (
        <>
          {to < pages - 1 && <span className="px-1 text-muted">…</span>}
          <a href={hrefFor(pages)} className={linkClass}>
            {pages}
          </a>
        </>
      )}

      {page < pages ? (
        <a href={hrefFor(page + 1)} className={linkClass} aria-label="Next page">
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </a>
      ) : (
        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-border px-2.5 text-muted opacity-40">
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}

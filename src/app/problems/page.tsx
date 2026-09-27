import Link from "next/link";
import type { Metadata } from "next";
import { Check, CircleDot, Search } from "lucide-react";
import { getStore } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/guards";
import type { Difficulty } from "@/lib/db/types";
import { Table, TableHead, TableBody, TableRow, TH, TD, TableEmpty, Badge } from "@/components/ui";
import { DifficultyBadge } from "@/components/problems/DifficultyBadge";
import { Pagination } from "@/components/problems/Pagination";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Problems",
  description:
    "Browse the club problem library: filter by difficulty, learning path and topic, and track which ones you have solved.",
};

const PAGE_SIZE = 15;

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const STATUS_OPTIONS = [
  { value: "solved", label: "Solved" },
  { value: "attempted", label: "Attempted" },
  { value: "untried", label: "Not tried" },
] as const;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Build a filtered URL from the current params plus overrides ("page" resets). */
function buildHref(
  current: SearchParams,
  overrides: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  const merged: Record<string, string | undefined> = {
    difficulty: first(current.difficulty),
    path: first(current.path),
    topic: first(current.topic),
    q: first(current.q),
    status: first(current.status),
    page: first(current.page),
    ...overrides,
  };
  if ("page" in overrides && overrides.page === undefined) {
    merged.page = undefined; // any filter change resets pagination
  }
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/problems?${query}` : "/problems";
}

const chipBase =
  "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const chipOff = "border-border bg-surface text-muted hover:border-accent/40 hover:text-fg";
const chipOn = "border-accent bg-accent/10 text-accent";

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  const store = await getStore();

  const difficultyParam = first(params.difficulty);
  const difficulty = DIFFICULTIES.includes(difficultyParam as Difficulty)
    ? (difficultyParam as Difficulty)
    : undefined;
  const pathSlug = first(params.path) || undefined;
  const topic = first(params.topic) || undefined;
  const q = first(params.q) || undefined;
  const statusParam = first(params.status);
  const status = STATUS_OPTIONS.some((option) => option.value === statusParam)
    ? (statusParam as (typeof STATUS_OPTIONS)[number]["value"])
    : undefined;
  const page = Math.max(1, parseInt(first(params.page) ?? "1", 10) || 1);

  const [paged, paths, topics] = await Promise.all([
    store.listPublished({
      difficulty,
      pathSlug,
      topic,
      q,
      status,
      userId: status && user ? user.id : undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    store.listPaths(),
    store.listTopics(),
  ]);

  // Personal solve status per problem slug (row ticks).
  const mySubmissions = user ? await store.listSubmissionsByUser(user.id) : [];
  const solvedSlugs = new Set(
    mySubmissions
      .filter((s) => s.verdict === "accepted")
      .map((s) => s.problemSlug),
  );
  const attemptedSlugs = new Set(mySubmissions.map((s) => s.problemSlug));

  const hasFilters = Boolean(difficulty || pathSlug || topic || q || status);
  const chipHref = (overrides: Record<string, string | undefined>) =>
    buildHref(params, { ...overrides, page: undefined });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          Library
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-fg">Problems</h1>
        <p className="text-sm text-muted">
          {paged.total} published problem{paged.total === 1 ? "" : "s"} · solved
          counters update as the club trains
        </p>
      </div>

      {/* Difficulty chips */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by difficulty">
        <Link href={chipHref({ difficulty: undefined })} className={`${chipBase} ${!difficulty ? chipOn : chipOff}`}>
          All
        </Link>
        {DIFFICULTIES.map((value) => (
          <Link
            key={value}
            href={chipHref({ difficulty: value })}
            className={`${chipBase} ${difficulty === value ? chipOn : chipOff} capitalize`}
            aria-pressed={difficulty === value}
          >
            {value}
          </Link>
        ))}
      </div>

      {/* Topic chips */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by topic">
        <span className="font-mono text-xs text-muted">Topic:</span>
        <Link href={chipHref({ topic: undefined })} className={`${chipBase} ${!topic ? chipOn : chipOff}`}>
          All
        </Link>
        {topics.map((value) => (
          <Link
            key={value}
            href={chipHref({ topic: value })}
            className={`${chipBase} ${topic === value ? chipOn : chipOff} font-mono`}
            aria-pressed={topic === value}
          >
            {value}
          </Link>
        ))}
      </div>

      {/* Search + path select (plain GET form — works without JavaScript) */}
      <form
        method="GET"
        action="/problems"
        role="search"
        aria-label="Problem filters"
        className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto]"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search title or slug…"
            aria-label="Search problems"
            className="h-10 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-sm text-fg placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </div>
        <div>
          <label htmlFor="path-select" className="sr-only">
            Learning path
          </label>
          <select
            id="path-select"
            name="path"
            defaultValue={pathSlug ?? ""}
            className="h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <option value="">All paths</option>
            {paths.map((path) => (
              <option key={path.slug} value={path.slug}>
                {String(path.order).padStart(2, "0")} · {path.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          {difficulty && (
            <input type="hidden" name="difficulty" value={difficulty} />
          )}
          {topic && <input type="hidden" name="topic" value={topic} />}
          <button
            type="submit"
            className="h-10 flex-1 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Filter
          </button>
          {hasFilters && (
            <Link
              href="/problems"
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm leading-10 text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {/* Personal status chips (signed-in only) */}
      {user && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by your status">
          <span className="text-xs text-muted">Yours:</span>
          {STATUS_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={chipHref({
                status: status === option.value ? undefined : option.value,
              })}
              className={`${chipBase} ${status === option.value ? chipOn : chipOff}`}
              aria-pressed={status === option.value}
            >
              {option.label}
            </Link>
          ))}
        </div>
      )}

      <Table>
        <TableHead>
          <TableRow className="hover:bg-surface-2">
            <TH className="w-10 text-center">#</TH>
            <TH>Problem</TH>
            <TH className="w-24">Difficulty</TH>
            <TH className="w-40">Topics</TH>
            <TH className="w-44">Solved</TH>
            {user && <TH className="w-16 text-center">Yours</TH>}
          </TableRow>
        </TableHead>
        <TableBody>
          {paged.items.length === 0 ? (
            <TableEmpty colSpan={user ? 6 : 5}>
              No problems match these filters.
            </TableEmpty>
          ) : (
            paged.items.map((problem, index) => {
              const solveRate = problem.attemptedCount
                ? Math.round((problem.solvedCount / problem.attemptedCount) * 100)
                : 0;
              const solved = solvedSlugs.has(problem.slug);
              const attempted = attemptedSlugs.has(problem.slug);
              return (
                <TableRow key={problem.id}>
                  <TD className="text-center font-mono text-xs text-muted">
                    {(paged.page - 1) * PAGE_SIZE + index + 1}
                  </TD>
                  <TD>
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="font-medium text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {problem.title}
                    </Link>
                  </TD>
                  <TD>
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </TD>
                  <TD>
                    <span className="font-mono text-xs text-muted">
                      {problem.topics.slice(0, 3).join(", ")}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2"
                        role="progressbar"
                        aria-valuenow={solveRate}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Solve rate for ${problem.title}`}
                      >
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${solveRate}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-muted">
                        {problem.solvedCount}/{problem.attemptedCount}
                      </span>
                    </div>
                  </TD>
                  {user && (
                    <TD className="text-center">
                      {solved ? (
                        <Check
                          className="mx-auto size-4 text-success"
                          aria-label="Solved"
                        />
                      ) : attempted ? (
                        <CircleDot
                          className="mx-auto size-4 text-accent"
                          aria-label="Attempted, not solved"
                        />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TD>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs text-muted">
          {hasFilters ? "filtered" : "all"} · page {paged.page} of{" "}
          {Math.max(1, Math.ceil(paged.total / PAGE_SIZE))}
        </p>
        <Pagination
          page={paged.page}
          pageSize={PAGE_SIZE}
          total={paged.total}
          hrefFor={(target) => buildHref(params, { page: String(target) })}
        />
      </div>

      {user?.role === "TEACHER" || user?.role === "ADMIN" ? (
        <p className="text-xs text-muted">
          Coaching note: draft problems are hidden here — manage them from{" "}
          <Link href="/coach" className="text-accent hover:underline">
            the coach area
          </Link>
          .{" "}
          <Badge tone="neutral" className="font-mono">
            coach view
          </Badge>
        </p>
      ) : null}
    </div>
  );
}

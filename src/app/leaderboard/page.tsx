import Link from "next/link";
import type { Metadata } from "next";
import { Trophy, Info } from "lucide-react";
import { getStore } from "@/lib/db";
import { rankPractice, type PracticeStat } from "@/lib/scoring";
import { formatRelative } from "@/lib/utils";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TH,
  TD,
  TableEmpty,
  Badge,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Practice leaderboard of the club: ranked by problems solved, ties broken by who got there first. The rule is on the page.",
};

const chipBase =
  "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const chipOff =
  "border-border bg-surface text-muted hover:border-accent/40 hover:text-fg";
const chipOn = "border-accent bg-accent/10 text-accent";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pathParam = Array.isArray(params.path) ? params.path[0] : params.path;

  const store = await getStore();
  const [students, submissions, published, paths] = await Promise.all([
    store.listByRole("STUDENT"),
    store.listAllSubmissions(),
    store.listPublished({ pageSize: 50 }),
    store.listPaths(),
  ]);
  const problems = published.items;

  const pathBySlug = new Map(paths.map((p) => [p.slug, p]));
  const activePath = pathParam && pathBySlug.has(pathParam) ? pathParam : undefined;

  // Problems that count: published (optionally restricted to one path).
  const eligible = activePath
    ? problems.filter((p) => p.pathSlug === activePath)
    : problems;
  const eligibleIds = new Set(eligible.map((p) => p.id));
  const problemById = new Map(problems.map((p) => [p.id, p]));

  interface Row extends PracticeStat {
    handle: string;
    topics: number;
    lastActiveAt: string | null;
  }

  const rows: Row[] = students.map((student) => {
    const mine = submissions.filter((s) => s.userId === student.id);
    const solvedIds = new Set(
      mine
        .filter((s) => s.verdict === "accepted" && eligibleIds.has(s.problemId))
        .map((s) => s.problemId),
    );
    const topicSet = new Set<string>();
    for (const id of solvedIds) {
      const problem = problemById.get(id);
      if (problem) for (const topic of problem.topics) topicSet.add(topic);
    }
    const acceptedTimes = mine
      .filter((s) => s.verdict === "accepted")
      .map((s) => s.createdAt)
      .sort();
    return {
      userId: student.id,
      handle: student.handle,
      solved: solvedIds.size,
      lastAcceptedAt: acceptedTimes.length > 0 ? acceptedTimes[acceptedTimes.length - 1] : null,
      topics: topicSet.size,
      lastActiveAt: mine.length > 0
        ? mine.map((s) => s.createdAt).sort().reverse()[0]
        : null,
    };
  });

  const ranked = rankPractice(rows);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          Arena
        </p>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-fg">
          <Trophy className="size-6 text-accent" aria-hidden="true" />
          Practice leaderboard
        </h1>
        <p className="text-sm text-muted">
          Every accepted submission on a published problem counts — contest
          solves included.
        </p>
      </div>

      {/* The rule, on the page (spec: documented ordering). */}
      <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted">
          <span className="font-semibold text-fg">Ranking rule:</span>{" "}
          problems solved, descending. Members with the same solve count are
          ordered by who reached that progress first — the earlier their
          latest accepted solve, the higher they stand. Members who never
          solved are ordered by handle.
        </p>
      </div>

      {/* Path filter chips */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter by learning path"
      >
        <span className="font-mono text-xs text-muted">Path:</span>
        <Link
          href="/leaderboard"
          className={`${chipBase} ${!activePath ? chipOn : chipOff}`}
          aria-pressed={!activePath}
        >
          All
        </Link>
        {paths.map((path) => (
          <Link
            key={path.slug}
            href={activePath === path.slug ? "/leaderboard" : `/leaderboard?path=${path.slug}`}
            className={`${chipBase} ${activePath === path.slug ? chipOn : chipOff}`}
            aria-pressed={activePath === path.slug}
          >
            {path.title}
          </Link>
        ))}
      </div>

      <Table>
        <TableHead>
          <TableRow className="hover:bg-surface-2">
            <TH className="w-14 text-center">Rank</TH>
            <TH>Member</TH>
            <TH className="w-16 text-center">Solved</TH>
            <TH className="w-20 text-center">Topics</TH>
            <TH className="w-32">Last active</TH>
          </TableRow>
        </TableHead>
        <TableBody>
          {ranked.length === 0 ? (
            <TableEmpty colSpan={5}>No club members yet.</TableEmpty>
          ) : (
            ranked.map((row) => {
              const top3 = row.rank <= 3 && row.solved > 0;
              return (
                <TableRow key={row.userId} className={top3 ? "bg-accent/5" : undefined}>
                  <TD className="text-center">
                    <span
                      className={`font-mono text-sm font-semibold ${top3 ? "text-accent" : "text-muted"}`}
                    >
                      {row.rank}
                    </span>
                  </TD>
                  <TD>
                    <Link
                      href={`/profile/${row.handle}`}
                      className="font-mono text-sm font-medium text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {row.handle}
                    </Link>
                    {top3 && (
                      <Badge tone="accent" className="ml-2 font-mono text-[10px] uppercase">
                        {["1st", "2nd", "3rd"][row.rank - 1]}
                      </Badge>
                    )}
                  </TD>
                  <TD className="text-center font-mono text-sm text-fg">
                    {row.solved}
                    {activePath ? (
                      <span className="text-muted">/{eligible.length}</span>
                    ) : null}
                  </TD>
                  <TD className="text-center font-mono text-sm text-muted">
                    {row.topics}
                  </TD>
                  <TD className="font-mono text-xs text-muted">
                    {row.lastActiveAt ? formatRelative(row.lastActiveAt) : "never"}
                  </TD>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <p className="text-xs text-muted">
        {activePath
          ? `Showing solves within the ${pathBySlug.get(activePath)?.title} path only.`
          : "Tip: filter by a learning path to rank members inside one topic."}
      </p>
    </div>
  );
}

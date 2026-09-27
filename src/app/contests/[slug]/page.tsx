import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  FileText,
  Lock,
  Timer,
  Users,
} from "lucide-react";
import { getStore } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/guards";
import { contestScore, rankStandings } from "@/lib/scoring";
import { nowMs } from "@/lib/clock";
import { contestPhase } from "@/lib/contests/window";
import { formatDate, formatDateTimeUtc } from "@/lib/utils";
import { Markdown } from "@/lib/markdown";
import { Alert, Badge, Card, CardContent } from "@/components/ui";
import { DifficultyBadge } from "@/components/problems/DifficultyBadge";
import { Countdown } from "@/components/contests/Countdown";
import { ContestScoreboard } from "@/components/contests/ContestScoreboard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore();
  const contest = await store.getContestBySlug(slug);
  if (!contest) return { title: "Contest not found" };
  return {
    title: contest.title,
    description: contest.descriptionMd.replace(/[#*`]/g, "").slice(0, 160),
  };
}

export default async function ContestDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const store = await getStore();
  const [contest, user] = await Promise.all([
    store.getContestBySlug(slug),
    getSessionUser(),
  ]);

  const isStaff = user?.role === "TEACHER" || user?.role === "ADMIN";
  if (!contest || (contest.status === "draft" && !isStaff)) {
    notFound();
  }

  // Phase at request time (pure rule in src/lib/contests/window.ts).
  const phase = contestPhase(contest, nowMs());
  const before = phase === "before";
  const during = phase === "during";

  // Problems of the contest (skip any slug that is not published yet).
  const problems = (
    await Promise.all(contest.problemSlugs.map((s) => store.getBySlug(s)))
  ).filter((p): p is NonNullable<typeof p> => p !== null && (p.status === "published" || isStaff));
  const slugById = new Map(problems.map((p) => [p.id, p.slug]));
  const titlesBySlug = new Map(problems.map((p) => [p.slug, p.title]));

  // Scoreboard: judged contest submissions + the ICPC rule (pure scoring.ts).
  const contestSubmissions = await store.listSubmissionsByContest(contest.id);
  const standings = rankStandings(
    contestScore(
      contestSubmissions.map((s) => ({
        userId: s.userId,
        problemKey: slugById.get(s.problemId) ?? s.problemId,
        verdict: s.verdict,
        createdAt: s.createdAt,
      })),
      contest,
    ),
  );

  const [users, participations] = await Promise.all([
    store.listByRole(),
    store.listParticipationsByContest(contest.id),
  ]);
  const usersById = new Map(users.map((u) => [u.id, u]));
  const myStanding = user ? standings.find((s) => s.userId === user.id) : undefined;
  const joined =
    user !== null && participations.some((p) => p.userId === user.id);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Link
        href="/contests"
        className="inline-flex w-fit items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All contests
      </Link>

      {/* ---------------- Header ---------------- */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {before ? (
            <Badge tone="accent" className="font-mono text-[11px] uppercase">
              upcoming
            </Badge>
          ) : during ? (
            <Badge tone="success" className="font-mono text-[11px] uppercase">
              running
            </Badge>
          ) : (
            <Badge tone="neutral" className="font-mono text-[11px] uppercase">
              finished
            </Badge>
          )}
          {contest.status === "draft" && (
            <Badge tone="warning" className="font-mono text-[11px] uppercase">
              draft — coaches only
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {contest.title}
        </h1>
        <div className="flex flex-wrap gap-4 font-mono text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            {formatDateTimeUtc(contest.startsAt)} → {formatDateTimeUtc(contest.endsAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Timer className="size-3.5" aria-hidden="true" />
            {contest.durationMinutes} min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden="true" />
            {participations.length} participants
          </span>
        </div>
        <div className="max-w-3xl text-sm text-muted">
          <Markdown source={contest.descriptionMd} />
        </div>
      </header>

      {/* ---------------- Pre-start: countdown ---------------- */}
      {before && (
        <Card className="border-accent/30">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              Starts in
            </p>
            <p className="text-4xl font-bold tracking-tight text-fg" aria-label="Live countdown">
              <Countdown targetIso={contest.startsAt} />
            </p>
            <p className="max-w-md text-sm text-muted">
              Problems unlock when the clock hits zero. Read the rules now,
              warm up on the learning paths, and be here on{" "}
              {formatDate(contest.startsAt)}.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ---------------- Rules ---------------- */}
      <section aria-label="Contest rules" className="flex flex-col gap-3">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-accent">
          Rules &amp; scoring
        </h2>
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-fg">
          <Markdown source={contest.rulesMd} />
        </div>
      </section>

      {/* ---------------- Problems ---------------- */}
      <section aria-label="Problems" className="flex flex-col gap-3">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-accent">
          Problems ({problems.length})
        </h2>
        {before ? (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
            <p className="px-4 py-2.5 text-xs text-muted">
              Titles are public before the start — statements open with the
              clock.
            </p>
            {problems.map((problem, index) => (
              <div
                key={problem.slug}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <span className="font-mono text-xs text-muted">
                  {String.fromCharCode(65 + index)}
                </span>
                <Lock className="size-3.5 text-muted" aria-hidden="true" />
                <span className="text-sm font-medium text-fg">{problem.title}</span>
                <DifficultyBadge difficulty={problem.difficulty} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
            {problems.map((problem, index) => {
              const mySolved = myStanding?.solves.has(problem.slug) ?? false;
              return (
                <div
                  key={problem.slug}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <span className="font-mono text-xs text-muted">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {mySolved && (
                    <CheckCircle2
                      className="size-4 text-success"
                      aria-label="Solved"
                    />
                  )}
                  <Link
                    href={`/contests/${contest.slug}/problems/${problem.slug}`}
                    className="text-sm font-medium text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {problem.title}
                  </Link>
                  <DifficultyBadge difficulty={problem.difficulty} />
                  <Link
                    href={`/contests/${contest.slug}/problems/${problem.slug}`}
                    className="ml-auto rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {during ? "Open & submit" : "Open"}
                  </Link>
                  {!during && (
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <BookOpen className="size-3.5" aria-hidden="true" />
                      Editorial
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------- Scoreboard ---------------- */}
      <section aria-label="Scoreboard" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-accent">
            {during ? "Live scoreboard" : "Final standings"}
          </h2>
          {myStanding ? (
            <p className="font-mono text-xs text-muted">
              your rank: <span className="text-accent">#{myStanding.rank}</span>{" "}
              of {standings.length} · {myStanding.solved} solved ·{" "}
              {myStanding.penalty} penalty
            </p>
          ) : user && !joined && !before ? (
            <p className="font-mono text-xs text-muted">
              you did not take part in this round
            </p>
          ) : null}
        </div>
        <ContestScoreboard
          standings={standings}
          usersById={usersById}
          problems={problems.map((p) => ({
            slug: p.slug,
            title: titlesBySlug.get(p.slug) ?? p.slug,
          }))}
          meId={user?.id}
        />
        {during && (
          <Alert tone="info" title="Scoring while the round runs">
            Penalty is minute-of-solve plus 20 per wrong try on solved
            problems (ICPC). In demo judge mode new submissions are recorded
            for review without verdicts — only judged or archived submissions
            move this board.
          </Alert>
        )}
      </section>

      {/* ---------------- After: editorial hub ---------------- */}
      {!during && !before && (
        <section aria-label="Editorials" className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-accent">
            <FileText className="size-4" aria-hidden="true" />
            Editorials
          </h2>
          <p className="text-sm text-muted">
            The contest is over, so full editorials are unlocked on each
            problem page.
          </p>
          <div className="flex flex-wrap gap-2">
            {problems.map((problem) => (
              <Link
                key={problem.slug}
                href={`/problems/${problem.slug}`}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-xs text-fg transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {problem.title} →
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import {
  Activity,
  AlertTriangle,
  FileWarning,
  Plus,
  Swords,
  TrendingDown,
  Users,
} from "lucide-react";
import { getStore } from "@/lib/db";
import { requireRole } from "@/lib/auth/guards";
import { nowMs } from "@/lib/clock";
import { formatRelative } from "@/lib/utils";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TH,
  TD,
  TableEmpty,
} from "@/components/ui";
import { VerdictBadge } from "@/components/problems/VerdictBadge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coach area",
  description:
    "Club dashboard for coaches: activity, hardest topics, unresolved problems, contest participation and members who need support.",
};

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function CoachPage() {
  await requireRole(["TEACHER", "ADMIN"], "/coach");
  const store = await getStore();

  const [students, submissions, problems, contests] = await Promise.all([
    store.listByRole("STUDENT"),
    store.listAllSubmissions(),
    store.listAll(),
    store.listPublishedContests(),
  ]);
  const userById = new Map(students.map((s) => [s.id, s]));
  const published = problems.filter((p) => p.status === "published");
  const problemById = new Map(problems.map((p) => [p.id, p]));

  const now = nowMs();
  const at = (iso: string) => new Date(iso).getTime();

  // ---- per-student rollup -------------------------------------------
  interface StudentStat {
    id: string;
    handle: string;
    lastSubmissionAt: number | null;
    solvedProblemIds: Set<string>;
    totalSubmissions: number;
  }
  const statsById = new Map<string, StudentStat>(
    students.map((s) => [
      s.id,
      {
        id: s.id,
        handle: s.handle,
        lastSubmissionAt: null,
        solvedProblemIds: new Set(),
        totalSubmissions: 0,
      },
    ]),
  );
  for (const submission of submissions) {
    const stat = statsById.get(submission.userId);
    if (!stat) continue;
    stat.totalSubmissions += 1;
    const t = at(submission.createdAt);
    if (stat.lastSubmissionAt === null || t > stat.lastSubmissionAt) {
      stat.lastSubmissionAt = t;
    }
    if (submission.verdict === "accepted") {
      stat.solvedProblemIds.add(submission.problemId);
    }
  }
  const stats = [...statsById.values()];

  const active = stats
    .filter((s) => s.lastSubmissionAt !== null && now - s.lastSubmissionAt <= 14 * DAY_MS)
    .sort((a, b) => (b.lastSubmissionAt ?? 0) - (a.lastSubmissionAt ?? 0));

  // needs support: no solves ever (and has submitted), OR silent for 30d+,
  // OR joined the club but never submitted at all (older than 30d members).
  const needsSupport = stats
    .map((s) => {
      const reasons: string[] = [];
      if (s.totalSubmissions > 0 && s.solvedProblemIds.size === 0) {
        reasons.push("0 solves ever despite submitting");
      }
      if (s.lastSubmissionAt !== null && now - s.lastSubmissionAt > 30 * DAY_MS) {
        reasons.push("no activity for 30+ days");
      }
      if (s.lastSubmissionAt === null) {
        reasons.push("never submitted anything yet");
      }
      return { stat: s, reasons };
    })
    .filter((row) => row.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length);

  // ---- topic difficulty (accepted/attempts ratio) --------------------
  const topicStats = new Map<string, { attempts: number; accepted: number }>();
  for (const submission of submissions) {
    const problem = problemById.get(submission.problemId);
    if (!problem || problem.status !== "published") continue;
    const judged = submission.verdict !== "recorded";
    for (const topic of problem.topics) {
      const row = topicStats.get(topic) ?? { attempts: 0, accepted: 0 };
      if (judged) {
        row.attempts += 1;
        if (submission.verdict === "accepted") row.accepted += 1;
      }
      topicStats.set(topic, row);
    }
  }
  const hardestTopics = [...topicStats.entries()]
    .map(([topic, row]) => ({
      topic,
      ...row,
      ratio: row.attempts > 0 ? row.accepted / row.attempts : 1,
    }))
    .sort((a, b) => a.ratio - b.ratio || b.attempts - a.attempts)
    .slice(0, 6);

  // ---- unresolved problems (0 accepted submissions) -------------------
  const acceptedProblemIds = new Set(
    submissions
      .filter((s) => s.verdict === "accepted")
      .map((s) => s.problemId),
  );
  const unresolved = published
    .filter((p) => !acceptedProblemIds.has(p.id))
    .map((p) => ({
      problem: p,
      attempts: submissions.filter(
        (s) => s.problemId === p.id && s.verdict !== "recorded",
      ).length,
    }))
    .sort((a, b) => b.attempts - a.attempts);

  // ---- contests -------------------------------------------------------
  const contestSummaries = await Promise.all(
    contests.map(async (contest) => {
      const rows = await store.listParticipationsByContest(contest.id);
      const avg =
        rows.length > 0
          ? Math.round((rows.reduce((sum, r) => sum + r.score, 0) / rows.length) * 10) / 10
          : 0;
      return {
        contest,
        participants: rows.length,
        top: rows.length > 0 ? rows[0] : null,
        avg,
      };
    }),
  );
  const topUserHandle = (userId: string | undefined): string | null => {
    if (!userId) return null;
    return userById.get(userId)?.handle ?? null;
  };

  // ---- recent submissions ---------------------------------------------
  const recent = submissions.slice(0, 8);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Coach
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-fg">
            Club dashboard
          </h1>
          <p className="text-sm text-muted">
            Honest numbers computed live from the club&apos;s submissions —
            nothing here is cached or estimated.
          </p>
        </div>
        <Link
          href="/coach/contests/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Plus className="size-4" aria-hidden="true" />
          Create contest
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1 py-5!">
            <span className="font-mono text-xs uppercase tracking-wide text-muted">
              Members
            </span>
            <span className="font-mono text-3xl font-bold text-fg">
              {students.length}
            </span>
            <span className="text-xs text-muted">registered club members</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-5!">
            <span className="font-mono text-xs uppercase tracking-wide text-muted">
              Active (14 days)
            </span>
            <span className="font-mono text-3xl font-bold text-success">
              {active.length}
            </span>
            <span className="text-xs text-muted">
              submitted within the last two weeks
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-5!">
            <span className="font-mono text-xs uppercase tracking-wide text-muted">
              Need support
            </span>
            <span className="font-mono text-3xl font-bold text-warning">
              {needsSupport.length}
            </span>
            <span className="text-xs text-muted">
              flagged by the rules below
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------------- Active students ---------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-accent" aria-hidden="true" />
              Active students
            </CardTitle>
            <p className="text-xs text-muted">
              Submitted something in the last 14 days.
            </p>
          </CardHeader>
          <CardContent className="pt-0!">
            {active.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-xs text-muted">
                Nobody has submitted in the last two weeks — time to announce
                a contest or a practice session.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {active.slice(0, 8).map((stat) => (
                  <li
                    key={stat.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
                  >
                    <Link
                      href={`/profile/${stat.handle}`}
                      className="font-mono text-sm font-medium text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {stat.handle}
                    </Link>
                    <span className="font-mono text-xs text-muted">
                      {stat.solvedProblemIds.size} solved
                    </span>
                    <span className="ml-auto font-mono text-xs text-muted">
                      {stat.lastSubmissionAt !== null
                        ? formatRelative(new Date(stat.lastSubmissionAt).toISOString())
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ---------------- Hardest topics ---------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="size-4 text-accent" aria-hidden="true" />
              Most difficult topics
            </CardTitle>
            <p className="text-xs text-muted">
              Lowest accepted/attempts ratio across judged submissions.
            </p>
          </CardHeader>
          <CardContent className="pt-0!">
            {hardestTopics.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-xs text-muted">
                No judged submissions yet — ratios appear once verdicts exist.
              </p>
            ) : (
              <Table>
                <TableHead>
                  <TableRow className="hover:bg-surface-2">
                    <TH>Topic</TH>
                    <TH className="w-20 text-center">Attempts</TH>
                    <TH className="w-20 text-center">Accepted</TH>
                    <TH className="w-20 text-center">Rate</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hardestTopics.map((row) => (
                    <TableRow key={row.topic}>
                      <TD className="font-mono text-xs">{row.topic}</TD>
                      <TD className="text-center font-mono text-xs text-muted">
                        {row.attempts}
                      </TD>
                      <TD className="text-center font-mono text-xs text-muted">
                        {row.accepted}
                      </TD>
                      <TD className="text-center font-mono text-xs">
                        <span
                          className={
                            row.ratio < 0.5 ? "text-danger" : "text-warning"
                          }
                        >
                          {Math.round(row.ratio * 100)}%
                        </span>
                      </TD>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------------- Unresolved problems ---------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="size-4 text-accent" aria-hidden="true" />
              Unresolved problems
            </CardTitle>
            <p className="text-xs text-muted">
              Published problems nobody has ever solved.
            </p>
          </CardHeader>
          <CardContent className="pt-0!">
            {unresolved.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-xs text-muted">
                Every published problem has at least one accepted submission.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {unresolved.slice(0, 6).map(({ problem, attempts }) => (
                  <li
                    key={problem.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
                  >
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="text-sm font-medium text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {problem.title}
                    </Link>
                    <Badge tone="neutral" className="font-mono text-[10px] uppercase">
                      {problem.difficulty}
                    </Badge>
                    <span className="ml-auto font-mono text-xs text-muted">
                      {attempts} attempt{attempts === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ---------------- Contest summary ---------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="size-4 text-accent" aria-hidden="true" />
              Contests
            </CardTitle>
            <p className="text-xs text-muted">Participation per round.</p>
          </CardHeader>
          <CardContent className="pt-0!">
            {contestSummaries.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-xs text-muted">
                No contests yet — create the first one.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {contestSummaries.map(({ contest, participants, top, avg }) => (
                  <li
                    key={contest.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
                  >
                    <Link
                      href={`/contests/${contest.slug}`}
                      className="text-sm font-medium text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {contest.title}
                    </Link>
                    <span className="font-mono text-xs text-muted">
                      {participants} participants &middot; avg {avg} solved
                    </span>
                    <span className="ml-auto font-mono text-xs text-accent">
                      {top ? `top: ${topUserHandle(top.userId) ?? "?"} (${top.score})` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------------- Needs support ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
            Needs support
          </CardTitle>
          <p className="text-xs text-muted">
            Flagged when: zero solves ever (despite submitting), silent for
            30+ days, or never submitted at all.
          </p>
        </CardHeader>
        <CardContent className="pt-0!">
          {needsSupport.length === 0 ? (
            <EmptyState
              title="Everyone is on track"
              description="No member matches the support flags right now."
              icon={Users}
            />
          ) : (
            <ul className="divide-y divide-border">
              {needsSupport.slice(0, 8).map(({ stat, reasons }) => (
                <li
                  key={stat.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
                >
                  <Link
                    href={`/profile/${stat.handle}`}
                    className="font-mono text-sm font-medium text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {stat.handle}
                  </Link>
                  {reasons.map((reason) => (
                    <Badge key={reason} tone="warning" className="text-[10px]">
                      {reason}
                    </Badge>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ---------------- Recent submissions ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Recent club submissions</CardTitle>
          <p className="text-xs text-muted">
            Latest 8 across all members — recorded demo submissions wait here
            for your review.
          </p>
        </CardHeader>
        <div className="p-4 pt-0!">
          <Table>
            <TableHead>
              <TableRow className="hover:bg-surface-2">
                <TH className="w-36">Verdict</TH>
                <TH>Member</TH>
                <TH>Problem</TH>
                <TH className="w-28">When</TH>
              </TableRow>
            </TableHead>
            <TableBody>
              {recent.length === 0 ? (
                <TableEmpty colSpan={4}>No submissions yet.</TableEmpty>
              ) : (
                recent.map((submission) => {
                  const student = userById.get(submission.userId);
                  const problem = problemById.get(submission.problemId);
                  return (
                    <TableRow key={submission.id}>
                      <TD>
                        <VerdictBadge verdict={submission.verdict} />
                      </TD>
                      <TD className="font-mono text-xs">
                        {student ? (
                          <Link
                            href={`/profile/${student.handle}`}
                            className="text-fg transition-colors hover:text-accent"
                          >
                            {student.handle}
                          </Link>
                        ) : (
                          <span className="text-muted">staff</span>
                        )}
                      </TD>
                      <TD className="text-xs">
                        {problem ? (
                          <Link
                            href={`/problems/${problem.slug}`}
                            className="text-fg transition-colors hover:text-accent"
                          >
                            {problem.title}
                          </Link>
                        ) : (
                          <span className="text-muted">removed problem</span>
                        )}
                      </TD>
                      <TD className="font-mono text-xs text-muted">
                        {formatRelative(submission.createdAt)}
                      </TD>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

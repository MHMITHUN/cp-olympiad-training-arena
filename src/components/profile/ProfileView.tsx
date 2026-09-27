import Link from "next/link";
import { Flame, Swords, Target } from "lucide-react";
import { getStore } from "@/lib/db";
import type { PublicUser } from "@/lib/db/types";
import { nowMs } from "@/lib/clock";
import { computeStreak, difficultyDistribution, recentDayCounts, topicMastery } from "@/lib/stats";
import { formatDate, formatRelative } from "@/lib/utils";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TH,
  TD,
  TableEmpty,
} from "@/components/ui";
import { VerdictBadge } from "@/components/problems/VerdictBadge";
import { DifficultyChart } from "./DifficultyChart";
import { TopicMasteryBars } from "./TopicMasteryBars";
import { ActivityStrip } from "./ActivityStrip";

/**
 * Full member profile (spec 19.9), shared by /profile (own) and
 * /profile/[handle] (public). Everything is computed from the store on
 * render — no cached analytics, so the page is always honest.
 */
export async function ProfileView({
  user,
  isOwn,
}: {
  user: PublicUser;
  isOwn: boolean;
}) {
  const store = await getStore();
  const [submissions, published, participations, contests] = await Promise.all([
    store.listSubmissionsByUser(user.id),
    store.listPublished({ pageSize: 50 }),
    store.listParticipationsByUser(user.id),
    store.listPublishedContests(),
  ]);
  const problems = published.items;
  const contestById = new Map(contests.map((c) => [c.id, c]));
  const problemBySlug = new Map(problems.map((p) => [p.slug, p]));

  const solvedSlugs = new Set(
    submissions.filter((s) => s.verdict === "accepted").map((s) => s.problemSlug),
  );
  const attemptedSlugs = new Set(submissions.map((s) => s.problemSlug));
  const accuracy =
    attemptedSlugs.size > 0
      ? Math.round((solvedSlugs.size / attemptedSlugs.size) * 100)
      : 0;

  const now = new Date();
  const nowEpoch = nowMs();
  const streak = computeStreak(
    submissions.map((s) => s.createdAt),
    now,
  );
  const difficulty = difficultyDistribution(
    problems.map((p) => ({ slug: p.slug, difficulty: p.difficulty })),
    solvedSlugs,
  );
  const chartData = difficulty.map((row) => ({
    band: row.difficulty[0].toUpperCase() + row.difficulty.slice(1),
    solved: row.solved,
    remaining: row.total - row.solved,
  }));
  const mastery = topicMastery(
    problems.map((p) => ({ slug: p.slug, topics: p.topics })),
    solvedSlugs,
  );
  const activityDays = recentDayCounts(
    submissions.map((s) => s.createdAt),
    now,
    12 * 7,
  );

  const recent = submissions.slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------- Summary cards ---------------- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1 py-5!">
            <span className="font-mono text-xs uppercase tracking-wide text-muted">
              Solved
            </span>
            <span className="font-mono text-3xl font-bold text-fg">
              {solvedSlugs.size}
              <span className="text-base font-normal text-muted">
                {" "}/{problems.length}
              </span>
            </span>
            <span className="text-xs text-muted">
              published problems with an accepted submission
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-5!">
            <span className="font-mono text-xs uppercase tracking-wide text-muted">
              Attempted
            </span>
            <span className="font-mono text-3xl font-bold text-fg">
              {attemptedSlugs.size}
            </span>
            <span className="text-xs text-muted">distinct problems submitted on</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 py-5!">
            <span className="font-mono text-xs uppercase tracking-wide text-muted">
              Accuracy
            </span>
            <span className="font-mono text-3xl font-bold text-fg">
              {accuracy}%
            </span>
            <span className="text-xs text-muted">
              of attempted problems, eventually solved
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ---------------- Charts row ---------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-accent" aria-hidden="true" />
              Difficulty distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DifficultyChart data={chartData} />
            <ul className="mt-2 flex flex-wrap gap-3 font-mono text-[11px] text-muted">
              {difficulty.map((row) => (
                <li key={row.difficulty}>
                  {row.difficulty}: {row.solved}/{row.total}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topic coverage</CardTitle>
            <p className="text-xs text-muted">
              A descriptive coverage metric — how much of each topic&apos;s
              published practice is done. Not a skill score.
            </p>
          </CardHeader>
          <CardContent>
            <TopicMasteryBars rows={mastery} />
          </CardContent>
        </Card>
      </div>

      {/* ---------------- Activity + streak ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame
              className={`size-4 ${streak > 0 ? "text-accent" : "text-muted"}`}
              aria-hidden="true"
            />
            12-week activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col">
              <span className="font-mono text-3xl font-bold text-fg">
                {streak}
              </span>
              <span className="text-xs text-muted">
                day streak (consecutive days with a submission, ending today
                or yesterday)
              </span>
            </div>
          </div>
          <ActivityStrip days={activityDays} />
        </CardContent>
      </Card>

      {/* ---------------- Contest history ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="size-4 text-accent" aria-hidden="true" />
            Contest history
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0!">
          {participations.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-xs text-muted">
              {isOwn
                ? "No contests yet — the next one is announced on the contests page."
                : "No contest participations yet."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {participations.map((participation) => {
                const contest = contestById.get(participation.contestId);
                if (!contest) return null;
                const ended = new Date(contest.endsAt).getTime() < nowEpoch;
                return (
                  <li
                    key={participation.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5"
                  >
                    <Link
                      href={`/contests/${contest.slug}`}
                      className="text-sm font-medium text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {contest.title}
                    </Link>
                    <span className="font-mono text-xs text-muted">
                      {formatDate(contest.startsAt)}
                    </span>
                    {ended ? (
                      <>
                        <Badge tone={participation.score > 0 ? "success" : "neutral"}>
                          {participation.score} solved
                        </Badge>
                        <span className="font-mono text-xs text-muted">
                          {participation.penalty} penalty
                        </span>
                      </>
                    ) : (
                      <Badge tone="accent">upcoming</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ---------------- Recent submissions ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Recent submissions</CardTitle>
        </CardHeader>
        <div className="p-4 pt-0!">
          <Table>
            <TableHead>
              <TableRow className="hover:bg-surface-2">
                <TH className="w-36">Verdict</TH>
                <TH>Problem</TH>
                <TH className="w-24">Difficulty</TH>
                <TH className="w-28">When</TH>
                <TH className="w-40">Context</TH>
              </TableRow>
            </TableHead>
            <TableBody>
              {recent.length === 0 ? (
                <TableEmpty colSpan={5}>
                  {isOwn
                    ? "Nothing submitted yet — pick a problem from the library and start."
                    : "No submissions yet."}
                </TableEmpty>
              ) : (
                recent.map((submission) => {
                  const contest = submission.contestId
                    ? contestById.get(submission.contestId)
                    : undefined;
                  const solvedNow = solvedSlugs.has(submission.problemSlug);
                  return (
                    <TableRow key={submission.id}>
                      <TD>
                        <VerdictBadge verdict={submission.verdict} />
                      </TD>
                      <TD>
                        <Link
                          href={`/problems/${submission.problemSlug}`}
                          className="text-sm text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          {submission.problemTitle}
                        </Link>
                      </TD>
                      <TD className="font-mono text-xs text-muted">
                        {submission.problemDifficulty}
                        {solvedNow ? " · solved" : ""}
                      </TD>
                      <TD className="font-mono text-xs text-muted">
                        {formatRelative(submission.createdAt)}
                      </TD>
                      <TD>
                        {contest ? (
                          <Link
                            href={`/contests/${contest.slug}`}
                            className="font-mono text-xs text-accent hover:underline"
                          >
                            {contest.slug}
                          </Link>
                        ) : (
                          <span className="font-mono text-xs text-muted">
                            practice
                          </span>
                        )}
                      </TD>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {problemBySlug.size === 0 && (
            <p className="mt-2 text-xs text-muted">
              The problem library is empty in this environment.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

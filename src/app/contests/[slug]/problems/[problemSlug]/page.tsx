import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Clock, Lock, MemoryStick, Swords } from "lucide-react";
import { getStore } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/guards";
import { nowMs } from "@/lib/clock";
import { isJudge0Configured } from "@/lib/judge/config";
import { Markdown } from "@/lib/markdown";
import { Badge, Card, CardContent } from "@/components/ui";
import { DifficultyBadge } from "@/components/problems/DifficultyBadge";
import { Examples } from "@/components/problems/Examples";
import { HintsPanel } from "@/components/problems/HintsPanel";
import { EditorialReveal } from "@/components/problems/EditorialReveal";
import {
  ProblemWorkspace,
  type WorkspaceSubmission,
} from "@/components/problems/ProblemWorkspace";
import { Countdown } from "@/components/contests/Countdown";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string; problemSlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, problemSlug } = await params;
  const store = await getStore();
  const contest = await store.getContestBySlug(slug);
  const problem = await store.getBySlug(problemSlug);
  if (!contest || !problem) return { title: "Contest problem not found" };
  return {
    title: `${problem.title} — ${contest.title}`,
    description: `Problem ${problem.title} inside the contest ${contest.title}.`,
  };
}

export default async function ContestProblemPage({ params }: PageProps) {
  const { slug, problemSlug } = await params;
  const store = await getStore();
  const [contest, problem, user] = await Promise.all([
    store.getContestBySlug(slug),
    store.getBySlug(problemSlug),
    getSessionUser(),
  ]);

  const isStaff = user?.role === "TEACHER" || user?.role === "ADMIN";
  if (
    !contest ||
    (contest.status === "draft" && !isStaff) ||
    !problem ||
    !contest.problemSlugs.includes(problem.slug)
  ) {
    notFound();
  }

  // Problems are locked until the contest clock starts (statements included).
  const now = nowMs();
  if (now < new Date(contest.startsAt).getTime()) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
        <Swords className="size-10 text-accent" aria-hidden="true" />
        <h1 className="text-2xl font-bold tracking-tight text-fg">
          {contest.title} has not started yet
        </h1>
        <p className="text-3xl font-bold text-fg" aria-label="Live countdown">
          <Countdown targetIso={contest.startsAt} />
        </p>
        <p className="max-w-md text-sm text-muted">
          This problem unlocks with the clock. The rules and the problem list
          are on the contest page.
        </p>
        <Link
          href={`/contests/${contest.slug}`}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-fg transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to the contest
        </Link>
      </div>
    );
  }

  const problemLetter = String.fromCharCode(
    65 + Math.max(0, contest.problemSlugs.indexOf(problem.slug)),
  );

  // Inside the contest: my submission feed is THIS contest's submissions.
  const contestSubmissions = await store.listSubmissionsByContest(contest.id);
  const mineOnProblem = contestSubmissions.filter(
    (s) => s.userId === user?.id && s.problemId === problem.id,
  );
  const mySubmissions: WorkspaceSubmission[] = mineOnProblem
    .slice(0, 10)
    .map((s) => ({
      id: s.id,
      verdict: s.verdict,
      judgeMode: s.judgeMode,
      createdAt: s.createdAt,
      ...(s.runtimeMs !== undefined ? { runtimeMs: s.runtimeMs } : {}),
      ...(s.memoryKb !== undefined ? { memoryKb: s.memoryKb } : {}),
    }));
  const contestProblemCount = contestSubmissions.filter(
    (s) => s.problemId === problem.id,
  ).length;

  const ended = now > new Date(contest.endsAt).getTime();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link
        href={`/contests/${contest.slug}`}
        className="inline-flex w-fit items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {contest.title}
      </Link>

      {ended && (
        <Card className="border-border">
          <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3!">
            <p className="text-xs text-muted">
              This round has finished — you are in practice mode. Submissions
              no longer change the final standings.
            </p>
            <Badge tone="neutral" className="font-mono text-[11px] uppercase">
              practice
            </Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
        {/* ---------------- Statement column ---------------- */}
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-3">
            <div className="flex items-center gap-2 font-mono text-xs text-accent">
              <span className="flex size-6 items-center justify-center rounded border border-accent/30 bg-accent/10 font-bold">
                {problemLetter}
              </span>
              <span className="uppercase tracking-wide">contest problem</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-fg">
              {problem.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <DifficultyBadge difficulty={problem.difficulty} />
              {problem.topics.map((topic) => (
                <Badge key={topic} tone="neutral" className="font-mono text-[11px]">
                  {topic}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 font-mono text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" />
                {problem.timeLimitMs} ms
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MemoryStick className="size-3.5" aria-hidden="true" />
                {problem.memoryLimitMb} MB
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="size-3.5" aria-hidden="true" />
                submissions tagged {contest.slug}
              </span>
            </div>
          </header>

          <section aria-label="Statement">
            <Markdown source={problem.statementMd} />
          </section>

          <section
            aria-label="Constraints"
            className="rounded-xl border border-border bg-surface p-4"
          >
            <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-accent">
              Constraints
            </h2>
            <Markdown source={problem.constraintsMd} />
          </section>

          <section aria-label="Examples" className="flex flex-col gap-2">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-accent">
              Examples
            </h2>
            <Examples examples={problem.examples} />
          </section>

          <section aria-label="Hints" className="flex flex-col gap-2">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-accent">
              Hints
            </h2>
            <HintsPanel hints={problem.hints} />
          </section>

          <section aria-label="Editorial" className="flex flex-col gap-2">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-accent">
              Editorial
            </h2>
            {ended ? (
              <EditorialReveal editorialMd={problem.editorialMd} />
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-surface p-4 text-xs text-muted">
                The editorial unlocks when the contest ends — solving it
                yourself is the point.
              </p>
            )}
          </section>
        </div>

        {/* ---------------- Workspace column ---------------- */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <ProblemWorkspace
            problemSlug={problem.slug}
            starterCode={problem.starterCodeCpp}
            timeLimitMs={problem.timeLimitMs}
            memoryLimitMb={problem.memoryLimitMb}
            isLoggedIn={Boolean(user)}
            judgeConfigured={isJudge0Configured()}
            mySubmissions={mySubmissions}
            problemSubmissionCount={contestProblemCount}
            contestSlug={contest.slug}
          />
        </div>
      </div>
    </div>
  );
}

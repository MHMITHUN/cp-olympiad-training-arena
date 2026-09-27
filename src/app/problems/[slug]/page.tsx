import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Clock, MemoryStick } from "lucide-react";
import { getStore } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/guards";
import { isProblemVisible } from "@/lib/problems/visibility";
import { isJudge0Configured } from "@/lib/judge/config";
import { Markdown } from "@/lib/markdown";
import { Badge } from "@/components/ui";
import { DifficultyBadge } from "@/components/problems/DifficultyBadge";
import { Examples } from "@/components/problems/Examples";
import { HintsPanel } from "@/components/problems/HintsPanel";
import { EditorialReveal } from "@/components/problems/EditorialReveal";
import {
  ProblemWorkspace,
  type WorkspaceSubmission,
} from "@/components/problems/ProblemWorkspace";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore();
  const problem = await store.getBySlug(slug);
  if (!problem) return { title: "Problem not found" };
  return {
    title: problem.title,
    description: `${problem.title} — a ${problem.difficulty} problem on the ${problem.pathSlug.replace(/-/g, " ")} path.`,
  };
}

export default async function ProblemDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const store = await getStore();

  const [problem, user] = await Promise.all([
    store.getBySlug(slug),
    getSessionUser(),
  ]);

  // Draft problems are invisible publicly (spec 19.4 / publish rule).
  if (!problem || !isProblemVisible(problem, user)) {
    notFound();
  }

  const problemSubmissions = await store.listSubmissionsByProblem(problem.id);
  const mySubmissions: WorkspaceSubmission[] = user
    ? problemSubmissions
        .filter((s) => s.userId === user.id)
        .slice(0, 10)
        .map((s) => ({
          id: s.id,
          verdict: s.verdict,
          judgeMode: s.judgeMode,
          createdAt: s.createdAt,
          ...(s.runtimeMs !== undefined ? { runtimeMs: s.runtimeMs } : {}),
          ...(s.memoryKb !== undefined ? { memoryKb: s.memoryKb } : {}),
        }))
    : [];

  const path = await store.getPathBySlug(problem.pathSlug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href="/problems"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All problems
      </Link>

      {problem.status === "draft" && (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
          Draft problem — visible to coaches only. Publish it from the coach
          area to make it public.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
        {/* ---------------- Statement column ---------------- */}
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-3">
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
              {path && (
                <Badge tone="accent">
                  Path {String(path.order).padStart(2, "0")} · {path.title}
                </Badge>
              )}
              {problem.status === "draft" && (
                <Badge tone="warning" className="font-mono text-[11px] uppercase">
                  draft
                </Badge>
              )}
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
              <span>
                {problem.solvedCount} solved / {problem.attemptedCount} attempts
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
            <EditorialReveal editorialMd={problem.editorialMd} />
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
            problemSubmissionCount={problemSubmissions.length}
          />
        </div>
      </div>
    </div>
  );
}

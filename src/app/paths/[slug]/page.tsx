import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Check, CircleDot, Play } from "lucide-react";
import { getStore } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/guards";
import { Markdown } from "@/lib/markdown";
import { ProgressBar } from "@/components/ui";
import { DifficultyBadge } from "@/components/problems/DifficultyBadge";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore();
  const path = await store.getPathBySlug(slug);
  if (!path) return { title: "Path not found" };
  return {
    title: `${path.title} path`,
    description: `The ${path.title} learning path — ${path.problemSlugs.length} problems in recommended solve order.`,
  };
}

export default async function PathDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const store = await getStore();
  const [path, user] = await Promise.all([
    store.getPathBySlug(slug),
    getSessionUser(),
  ]);
  if (!path) notFound();

  // Resolve slugs to published problems (drafts/missing slugs are skipped).
  const problems = (
    await Promise.all(path.problemSlugs.map((s) => store.getBySlug(s)))
  ).filter((p): p is NonNullable<typeof p> => p !== null && p.status === "published");

  const solvedSlugs = new Set<string>();
  const attemptedSlugs = new Set<string>();
  if (user) {
    const submissions = await store.listSubmissionsByUser(user.id);
    for (const submission of submissions) {
      attemptedSlugs.add(submission.problemSlug);
      if (submission.verdict === "accepted") {
        solvedSlugs.add(submission.problemSlug);
      }
    }
  }

  const solvedCount = problems.filter((p) => solvedSlugs.has(p.slug)).length;
  const percent =
    problems.length > 0 ? (solvedCount / problems.length) * 100 : 0;
  // First unsolved problem = the "start here" CTA.
  const nextProblem = problems.find((p) => !solvedSlugs.has(p.slug));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Link
        href="/paths"
        className="inline-flex w-fit items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All paths
      </Link>

      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          Path {String(path.order).padStart(2, "0")}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {path.title}
        </h1>
        <div className="max-w-3xl text-sm text-muted">
          <Markdown source={path.descriptionMd} />
        </div>
        {user && problems.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1">
            <ProgressBar
              value={percent}
              label={`${path.title}: ${solvedCount} of ${problems.length} solved`}
            />
            <p className="font-mono text-xs text-muted">
              {solvedCount}/{problems.length} solved by you
              {solvedCount === problems.length && path.problemSlugs.length > 0
                ? " — path complete. On to the next one!"
                : ""}
            </p>
          </div>
        )}
      </header>

      {nextProblem && user ? (
        <Link
          href={`/problems/${nextProblem.slug}`}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4 transition-colors hover:border-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-fg">
              <Play className="size-4" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wide text-accent">
                {solvedCount === 0 ? "Start here" : "Continue"}
              </span>
              <span className="text-sm font-semibold text-fg">
                {nextProblem.title}
              </span>
            </div>
          </div>
          <DifficultyBadge difficulty={nextProblem.difficulty} />
        </Link>
      ) : null}

      <ol className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
        {problems.map((problem, index) => {
          const solved = solvedSlugs.has(problem.slug);
          const attempted = attemptedSlugs.has(problem.slug);
          return (
            <li
              key={problem.slug}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
            >
              <span className="w-6 text-center font-mono text-xs text-muted">
                {index + 1}
              </span>
              {user ? (
                solved ? (
                  <Check
                    className="size-4 text-success"
                    aria-label="Solved by you"
                  />
                ) : attempted ? (
                  <CircleDot
                    className="size-4 text-accent"
                    aria-label="Attempted, not solved"
                  />
                ) : (
                  <span className="inline-block size-4" aria-hidden="true" />
                )
              ) : null}
              <Link
                href={`/problems/${problem.slug}`}
                className="min-w-0 flex-1 truncate text-sm font-medium text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {problem.title}
              </Link>
              <DifficultyBadge difficulty={problem.difficulty} />
              <span className="font-mono text-xs text-muted">
                {problem.solvedCount}/{problem.attemptedCount} solved
              </span>
              <Link
                href={`/problems/${problem.slug}`}
                className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {solved ? "Review" : "Start"}
              </Link>
            </li>
          );
        })}
        {problems.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-muted">
            No published problems in this path yet.
          </li>
        )}
      </ol>

      {!user && (
        <p className="text-xs text-muted">
          <Link href="/register" className="text-accent hover:underline">
            Join the club
          </Link>{" "}
          to track which problems you have solved as you walk the path.
        </p>
      )}
    </div>
  );
}

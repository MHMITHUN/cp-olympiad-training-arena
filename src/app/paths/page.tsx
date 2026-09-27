import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getStore } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/guards";
import { ProgressBar } from "@/components/ui";
import { Markdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Learning paths",
  description:
    "Ten structured learning paths from programming basics to dynamic programming and contest strategy — the club curriculum in solve order.",
};

export default async function PathsPage() {
  const store = await getStore();
  const [paths, user, published] = await Promise.all([
    store.listPaths(),
    getSessionUser(),
    store.listPublished({ pageSize: 50 }),
  ]);
  const publishedSlugs = new Set(published.items.map((p) => p.slug));

  const solvedSlugs = new Set<string>();
  if (user) {
    const submissions = await store.listSubmissionsByUser(user.id);
    for (const submission of submissions) {
      if (submission.verdict === "accepted") {
        solvedSlugs.add(submission.problemSlug);
      }
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          Curriculum
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-fg">
          Learning paths
        </h1>
        <p className="text-sm text-muted">
          The club curriculum, in order. Each path is a small, finishable set
          of problems — solved one path at a time, they take a beginner to
          contest readiness.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {paths.map((path) => {
          const available = path.problemSlugs.filter((slug) =>
            publishedSlugs.has(slug),
          ).length;
          const solvedInPath = path.problemSlugs.filter(
            (slug) => solvedSlugs.has(slug) && publishedSlugs.has(slug),
          ).length;
          const percent = available > 0 ? (solvedInPath / available) * 100 : 0;
          return (
            <Link
              key={path.slug}
              href={`/paths/${path.slug}`}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-semibold text-accent">
                  PATH {String(path.order).padStart(2, "0")}
                </span>
                <span className="font-mono text-xs text-muted">
                  {path.problemSlugs.length} problem
                  {path.problemSlugs.length === 1 ? "" : "s"}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-fg transition-colors group-hover:text-accent">
                {path.title}
              </h2>
              <div className="line-clamp-3 text-sm text-muted">
                <Markdown source={path.descriptionMd} />
              </div>
              {user ? (
                <div className="mt-auto flex flex-col gap-1.5 pt-2">
                  <ProgressBar
                    value={percent}
                    label={`${path.title}: ${solvedInPath} of ${available} solved`}
                  />
                  <p className="font-mono text-xs text-muted">
                    {solvedInPath}/{available} solved by you
                  </p>
                </div>
              ) : (
                <p className="mt-auto inline-flex items-center gap-1.5 pt-2 text-xs text-accent">
                  Browse the path
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {!user && (
        <p className="text-xs text-muted">
          <Link href="/register" className="text-accent hover:underline">
            Create a free club account
          </Link>{" "}
          to track your progress through the paths.
        </p>
      )}
    </div>
  );
}

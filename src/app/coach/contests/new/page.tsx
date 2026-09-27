import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/db";
import { requireRole } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { CreateContestForm } from "./CreateContestForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create contest",
  description: "Schedule a new club contest from the published problem bank.",
};

export default async function NewContestPage() {
  await requireRole(["TEACHER", "ADMIN"], "/coach/contests/new");

  const store = await getStore();
  const [problems, paths] = await Promise.all([
    store.listAll(),
    store.listPaths(),
  ]);
  const pathTitleBySlug = new Map(paths.map((p) => [p.slug, p.title]));
  const published = problems
    .filter((p) => p.status === "published")
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty,
      pathTitle: pathTitleBySlug.get(p.pathSlug) ?? p.pathSlug,
    }));

  if (published.length === 0) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Link
        href="/coach"
        className="inline-flex w-fit items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Coach area
      </Link>

      <div className="flex flex-col gap-1">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          Coach
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-fg">
          Create a contest
        </h1>
        <p className="text-sm text-muted">
          Pick published problems, set the clock, publish. Scoring is ICPC
          style — the rules text is editable.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contest details</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateContestForm problems={published} />
        </CardContent>
      </Card>
    </div>
  );
}

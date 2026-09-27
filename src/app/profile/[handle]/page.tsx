import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStore } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { ProfileView } from "@/components/profile/ProfileView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const store = await getStore();
  const user = await store.findByHandle(handle);
  if (!user) return { title: "Member not found" };
  return {
    title: `@${user.handle}`,
    description: `Public practice profile of @${user.handle} — solved problems, coverage and contest history.`,
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const store = await getStore();
  const [user, viewer] = await Promise.all([
    store.findByHandle(handle),
    getSessionUser(),
  ]);
  if (!user) notFound();

  const isOwn = viewer?.id === user.id;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Member
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-fg">
            {user.name}
          </h1>
          <p className="font-mono text-sm text-muted">
            @{user.handle} &middot; member since {formatDate(user.createdAt)}
          </p>
        </div>
        <Badge tone="neutral" className="font-mono text-[11px] uppercase">
          {user.role.toLowerCase()}
        </Badge>
      </header>

      <ProfileView user={user} isOwn={isOwn} />
    </div>
  );
}

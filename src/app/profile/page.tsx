import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guards";
import { Badge } from "@/components/ui";
import { ProfileView } from "@/components/profile/ProfileView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your profile",
  description:
    "Your solved count, accuracy, topic coverage, activity streak and contest history.",
};

export default async function OwnProfilePage() {
  const user = await requireUser("/profile");

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
          <p className="font-mono text-sm text-muted">@{user.handle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="neutral" className="font-mono text-[11px] uppercase">
            {user.role.toLowerCase()}
          </Badge>
          <Link
            href={`/profile/${user.handle}`}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            View public page
          </Link>
        </div>
      </header>

      <ProfileView user={user} isOwn />
    </div>
  );
}

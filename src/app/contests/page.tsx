import Link from "next/link";
import type { Metadata } from "next";
import { CalendarClock, History, Lock, Play, Plus, Timer, Users } from "lucide-react";
import { getStore } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/guards";
import { nowMs } from "@/lib/clock";
import { splitContestsByPhase } from "@/lib/contests/window";
import { formatDate } from "@/lib/utils";
import { Markdown } from "@/lib/markdown";
import { Badge, Card, CardContent, EmptyState } from "@/components/ui";
import { Countdown } from "@/components/contests/Countdown";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contests",
  description:
    "Club contests with live countdowns, ICPC scoring and full standings archives — past, ongoing and upcoming rounds.",
};

export default async function ContestsPage() {
  const store = await getStore();
  const [contests, user] = await Promise.all([
    store.listPublishedContests(),
    getSessionUser(),
  ]);

  const { upcoming, ongoing, past } = splitContestsByPhase(contests, nowMs());

  const participantCounts = new Map<string, number>();
  for (const contest of contests) {
    const rows = await store.listParticipationsByContest(contest.id);
    participantCounts.set(contest.id, rows.length);
  }

  const isStaff = user?.role === "TEACHER" || user?.role === "ADMIN";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Arena
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Contests</h1>
          <p className="text-sm text-muted">
            Time-boxed club rounds — ICPC scoring, transparent penalties,
            standings kept forever.
          </p>
        </div>
        {isStaff && (
          <Link
            href="/coach/contests/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Plus className="size-4" aria-hidden="true" />
            Create contest
          </Link>
        )}
      </div>

      {/* ---------------- Upcoming ---------------- */}
      <section aria-label="Upcoming contests" className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-accent">
          <CalendarClock className="size-4" aria-hidden="true" />
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming contests scheduled"
            description="Coaches announce new rounds here — the next one counts down live the moment it is published."
            icon={CalendarClock}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {upcoming.map((contest) => (
              <Card key={contest.id} className="transition-colors hover:border-accent/40">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link
                      href={`/contests/${contest.slug}`}
                      className="text-lg font-semibold text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {contest.title}
                    </Link>
                    <Badge tone="accent" className="font-mono text-[11px] uppercase">
                      starts in
                    </Badge>
                  </div>
                  <p
                    className="text-2xl font-semibold tracking-tight text-accent"
                    aria-label="Countdown to contest start"
                  >
                    <Countdown targetIso={contest.startsAt} />
                  </p>
                  <div className="font-mono text-xs text-muted">
                    {formatDate(contest.startsAt)} &middot;{" "}
                    {contest.durationMinutes / 60}h window &middot;{" "}
                    {contest.problemSlugs.length} problems
                  </div>
                  <div className="line-clamp-2 text-sm text-muted">
                    <Markdown source={contest.descriptionMd} />
                  </div>
                  <Link
                    href={`/contests/${contest.slug}`}
                    className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <Lock className="size-3.5" aria-hidden="true" />
                    Rules &amp; problem list
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- Ongoing ---------------- */}
      {ongoing.length > 0 && (
        <section aria-label="Ongoing contests" className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-accent">
            <Play className="size-4" aria-hidden="true" />
            Running now
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {ongoing.map((contest) => (
              <Card key={contest.id} className="border-accent/40">
                <CardContent className="flex flex-col gap-3">
                  <Link
                    href={`/contests/${contest.slug}`}
                    className="text-lg font-semibold text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {contest.title}
                  </Link>
                  <p className="font-mono text-xs text-muted">
                    Ends {formatDate(contest.endsAt)} — live scoreboard inside
                  </p>
                  <Link
                    href={`/contests/${contest.slug}`}
                    className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <Timer className="size-3.5" aria-hidden="true" />
                    Enter contest
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- Past ---------------- */}
      <section aria-label="Past contests" className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-accent">
          <History className="size-4" aria-hidden="true" />
          Past rounds
        </h2>
        {past.length === 0 ? (
          <EmptyState
            title="No finished contests yet"
            description="Standings and penalties of every finished round are archived here."
            icon={History}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {past.map((contest) => (
              <Card key={contest.id} className="transition-colors hover:border-accent/40">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link
                      href={`/contests/${contest.slug}`}
                      className="text-lg font-semibold text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {contest.title}
                    </Link>
                    <Badge tone="neutral" className="font-mono text-[11px] uppercase">
                      finished
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 font-mono text-xs text-muted">
                    <span>{formatDate(contest.startsAt)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Timer className="size-3.5" aria-hidden="true" />
                      {contest.durationMinutes / 60}h
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" aria-hidden="true" />
                      {participantCounts.get(contest.id) ?? 0} participants
                    </span>
                  </div>
                  <Link
                    href={`/contests/${contest.slug}`}
                    className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <History className="size-3.5" aria-hidden="true" />
                    Final standings
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

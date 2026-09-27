import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  Code2,
  GraduationCap,
  ListChecks,
  ShieldCheck,
  Swords,
  Trophy,
} from "lucide-react";
import { learningPaths } from "@/lib/paths/paths";
import { seedProblemsBasics } from "@/lib/db/seeds/problems-basics";
import { seedProblemsAdvanced } from "@/lib/db/seeds/problems-advanced";
import { seedUsers } from "@/lib/db/seeds/users";
import { pastContestSeeds } from "@/lib/db/seeds/contests";

/**
 * Landing page — static by design: every number is derived from the seed
 * constants themselves (never inflated), so the marketing matches what the
 * demo club actually contains.
 */

const PROBLEM_COUNT = seedProblemsBasics.length + seedProblemsAdvanced.length;
const MEMBER_COUNT = seedUsers.length;
const CONTEST_COUNT = pastContestSeeds.length + 1; // + the recurring upcoming round
const COACH_COUNT = seedUsers.filter((u) => u.role === "TEACHER").length;

export const metadata: Metadata = {
  title: "CP Arena — Competitive Programming & Olympiad Training",
  description:
    "From your first loop to your first contest: 40 original problems across 10 learning paths, club contests with ICPC scoring, an honest judge pipeline and coach mentorship — built for school and college programming clubs.",
  openGraph: {
    title: "CP Arena — Competitive Programming & Olympiad Training",
    description:
      "From your first loop to your first contest: 10 learning paths, club contests with live countdowns, honest judging and coach mentorship.",
    type: "website",
    siteName: "CP Arena",
  },
};

export default function HomePage() {
  const stats = [
    { value: String(PROBLEM_COUNT), label: "original problems, full editorials" },
    { value: String(learningPaths.length), label: "learning paths, basics to DP" },
    { value: String(CONTEST_COUNT), label: "club contests, ICPC scoring" },
    { value: String(MEMBER_COUNT), label: "demo club members and coaches" },
  ];

  return (
    <div className="flex flex-col">
      {/* ---------------- Hero ---------------- */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
          <p className="rounded-full border border-accent/30 bg-accent/10 px-4 py-1 font-mono text-xs uppercase tracking-[0.25em] text-accent">
            Competitive programming &middot; Informatics Olympiad
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-fg sm:text-5xl">
            From your first loop to your first contest
          </h1>
          <p className="max-w-2xl text-base text-muted">
            CP Arena is the training ground for school and college programming
            clubs: a curated problem library with honest judging, ten
            structured learning paths, real club contests with transparent
            scoring, and coaches who review every submission.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Join your club
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/problems"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-6 text-sm font-medium text-fg transition-colors hover:border-accent/40 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Browse problems
            </Link>
          </div>
          <p className="text-xs text-muted">
            Browsing is open to everyone — solving, contests and progress
            tracking need a (free, club-style) account.
          </p>
        </div>
      </section>

      {/* ---------------- Honest stats ---------------- */}
      <section aria-label="Platform stats" className="border-b border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 bg-bg px-4 py-8 text-center"
            >
              <span className="font-mono text-3xl font-bold text-accent">
                {stat.value}
              </span>
              <span className="max-w-44 text-xs text-muted">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Paths grid ---------------- */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-fg">
            Ten paths, one curriculum
          </h2>
          <p className="max-w-2xl text-sm text-muted">
            Each path is a small, finishable set of problems in recommended
            solve order — from \`cin/cout\` basics through greedy, graphs and
            dynamic programming, ending with contest craft itself.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {learningPaths.map((path) => (
            <Link
              key={path.slug}
              href={`/paths/${path.slug}`}
              className="group flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="font-mono text-xs font-semibold text-accent">
                {String(path.order).padStart(2, "0")}
              </span>
              <span className="text-sm font-semibold text-fg transition-colors group-hover:text-accent">
                {path.title}
              </span>
              <span className="font-mono text-[11px] text-muted">
                {path.problemSlugs.length} problems
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- Feature trio ---------------- */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <ListChecks className="size-6 text-accent" aria-hidden="true" />
            <h3 className="text-base font-semibold text-fg">
              A library that teaches
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              {PROBLEM_COUNT} original contest-style problems — real
              constraints, verified examples, progressive hints and full
              editorials. The problem statements are the product, not filler.
            </p>
            <Link
              href="/problems"
              className="inline-flex w-fit items-center gap-1 text-sm font-medium text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Open the library
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <Swords className="size-6 text-accent" aria-hidden="true" />
            <h3 className="text-base font-semibold text-fg">
              Contests that feel real
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              Live countdowns, ICPC scoring with transparent 20-minute
              penalties, live scoreboards during the round and standings kept
              forever. Editorials unlock the moment a round ends.
            </p>
            <Link
              href="/contests"
              className="inline-flex w-fit items-center gap-1 text-sm font-medium text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              See the rounds
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <ShieldCheck className="size-6 text-accent" aria-hidden="true" />
            <h3 className="text-base font-semibold text-fg">
              An honest judge
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              Connect Judge0 for real verdicts, or run in demo mode where
              submissions are recorded for coach review — clearly labeled,
              never faked. No simulated ACs, no invented rankings.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- Coach / mentorship ---------------- */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-accent">
              <GraduationCap className="size-4" aria-hidden="true" />
              Mentorship
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-fg">
              Coaches behind every problem
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              The club is coached by {COACH_COUNT} coaches who author the
              problems, run the rounds and review recorded submissions by
              hand. The coach dashboard shows who is active, which topics the
              club finds hardest, and which members need a nudge — teaching
              decisions based on real submission data, not guesswork.
            </p>
            <ul className="flex flex-col gap-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <Code2 className="size-4 shrink-0 text-accent" aria-hidden="true" />
                Every problem ships with a reference solution and editorial
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="size-4 shrink-0 text-accent" aria-hidden="true" />
                Learning paths ordered the way the club actually teaches them
              </li>
              <li className="flex items-center gap-2">
                <Trophy className="size-4 shrink-0 text-accent" aria-hidden="true" />
                A documented leaderboard rule — no hidden ranking magic
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="font-mono text-xs uppercase tracking-wide text-muted">
              Try the demo club
            </p>
            <div className="mt-3 flex flex-col gap-2 font-mono text-sm text-fg">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-2 px-3 py-2">
                <span>student@demo.local</span>
                <span className="text-xs text-muted">member view</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-2 px-3 py-2">
                <span>teacher@demo.local</span>
                <span className="text-xs text-muted">coach dashboard</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-2 px-3 py-2">
                <span>admin@demo.local</span>
                <span className="text-xs text-muted">admin</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              Password for every demo account:{" "}
              <span className="font-mono text-fg">Demo@12345</span>
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 text-sm font-medium text-fg transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Sign in and explore
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-fg">
            Your first submission is one loop away
          </h2>
          <p className="max-w-xl text-sm text-muted">
            Join the club, walk path 01, and print your first Accepted. The
            leaderboard is waiting.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Register free
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-6 text-sm font-medium text-fg transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              See the leaderboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

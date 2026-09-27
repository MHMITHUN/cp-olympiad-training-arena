import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-md">
          <p className="font-mono text-sm font-bold text-fg">CP Arena</p>
          <p className="mt-1 text-sm text-muted">
            A competitive programming and Informatics Olympiad training arena
            for school and college clubs — problem library, learning paths,
            contests and honest judging.
          </p>
          <p className="mt-3 text-xs text-muted">
            Demo data notice: without a configured database the app runs on
            sample club data that resets on server restart.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <Link href="/problems" className="text-muted transition-colors hover:text-fg">
            Problems
          </Link>
          <Link href="/paths" className="text-muted transition-colors hover:text-fg">
            Paths
          </Link>
          <Link href="/contests" className="text-muted transition-colors hover:text-fg">
            Contests
          </Link>
          <Link href="/leaderboard" className="text-muted transition-colors hover:text-fg">
            Leaderboard
          </Link>
          <Link href="/login" className="text-muted transition-colors hover:text-fg">
            Sign in
          </Link>
        </nav>
      </div>
      <div className="border-t border-border py-4">
        <p className="mx-auto max-w-6xl px-4 text-xs text-muted sm:px-6">
          © 2026 CP Arena. Built for programming clubs.
        </p>
      </div>
    </footer>
  );
}

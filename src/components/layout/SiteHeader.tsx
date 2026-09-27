import Link from "next/link";
import { Braces } from "lucide-react";
import { getSessionUser } from "@/lib/auth/guards";
import { logoutAction } from "@/app/actions/auth";
import { MobileNav } from "./MobileNav";

/**
 * Site header (server component — reads the session, so pages using the
 * app shell render dynamically at request time).
 */
export async function SiteHeader() {
  const user = await getSessionUser();
  const isStaff = user?.role === "TEACHER" || user?.role === "ADMIN";

  const navLinks = [
    { href: "/problems", label: "Problems" },
    { href: "/paths", label: "Paths" },
    { href: "/contests", label: "Contests" },
    { href: "/leaderboard", label: "Leaderboard" },
    ...(user ? [{ href: "/profile", label: "Profile" }] : []),
    ...(isStaff ? [{ href: "/coach", label: "Coach" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <MobileNav
            links={navLinks}
            user={user ? { name: user.name, handle: user.handle, role: user.role } : null}
          />
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-fg">
              <Braces className="size-4" aria-hidden="true" />
            </span>
            <span className="font-mono text-sm font-bold tracking-tight text-fg">
              CP Arena
            </span>
          </Link>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-mono text-xs text-fg transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex"
                aria-label={`Signed in as ${user.name}`}
              >
                <span className="text-accent">@</span>
                {user.handle}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-fg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-fg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Join the club
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

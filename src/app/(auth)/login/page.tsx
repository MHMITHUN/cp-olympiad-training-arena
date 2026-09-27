import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : undefined;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">
          Sign in
        </h1>
        <p className="text-sm text-muted">
          Welcome back to the arena. Track your solved problems, streaks and
          contest history.
        </p>
      </div>
      <LoginForm next={safeNext} />
      <p className="text-center text-sm text-muted">
        New to the club?{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          Create a student account
        </Link>
      </p>
      <div className="rounded-lg border border-border bg-surface-2 p-4 text-xs text-muted">
        <p className="font-medium text-fg">Demo accounts (password Demo@12345)</p>
        <ul className="mt-2 space-y-1 font-mono">
          <li>admin@demo.local</li>
          <li>teacher@demo.local</li>
          <li>student@demo.local</li>
        </ul>
      </div>
    </div>
  );
}

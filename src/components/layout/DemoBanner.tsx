import { Info } from "lucide-react";

/**
 * Honest demo-mode label (spec sections 19.5 + 36): shown whenever the app
 * is running on the in-memory DemoStore (MONGODB_URI absent). Submissions
 * are recorded for review, never auto-judged with fabricated verdicts.
 */
export function DemoBanner() {
  if (process.env.MONGODB_URI) return null;

  return (
    <div
      role="status"
      className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center sm:px-6"
    >
      <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 text-xs text-warning">
        <Info className="size-3.5 shrink-0" aria-hidden="true" />
        Demo mode: sample club data, resets on restart. Submissions are
        recorded, not auto-judged — connect Judge0 for real verdicts.
      </p>
    </div>
  );
}

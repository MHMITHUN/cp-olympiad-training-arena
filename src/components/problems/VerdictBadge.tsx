import { Badge } from "@/components/ui";
import type { Verdict } from "@/lib/db/types";

/**
 * Verdict badge. "recorded" (demo mode) is deliberately styled differently —
 * dashed accent border — so it can never be mistaken for a judged verdict.
 */

const LABELS: Record<Verdict, string> = {
  accepted: "Accepted",
  wrong_answer: "Wrong answer",
  time_limit: "Time limit",
  runtime_error: "Runtime error",
  compile_error: "Compile error",
  recorded: "Recorded",
};

const CLASSES: Record<Verdict, string> = {
  accepted: "bg-success/10 text-success border-success/20",
  wrong_answer: "bg-danger/10 text-danger border-danger/20",
  time_limit: "bg-warning/10 text-warning border-warning/20",
  runtime_error: "bg-danger/10 text-danger border-danger/20",
  compile_error: "bg-danger/10 text-danger border-danger/20",
  recorded: "bg-accent/10 text-accent border-dashed border-accent/40",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <Badge className={`font-mono text-[11px] uppercase tracking-wide ${CLASSES[verdict]}`}>
      {LABELS[verdict]}
    </Badge>
  );
}

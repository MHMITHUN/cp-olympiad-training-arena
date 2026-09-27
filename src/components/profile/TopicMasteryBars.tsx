import { ProgressBar } from "@/components/ui";
import type { TopicMasteryRow } from "@/lib/stats";

/**
 * Per-topic coverage bars (spec 19.9). Labelled a DESCRIPTIVE coverage
 * metric — solved/total of each topic's published problems — never a skill
 * score. Server component; plain divs, no chart library needed.
 */
export function TopicMasteryBars({
  rows,
  maxRows = 8,
}: {
  rows: TopicMasteryRow[];
  maxRows?: number;
}) {
  const shown = rows.slice(0, maxRows);
  if (shown.length === 0) {
    return <p className="text-xs text-muted">No topic data yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {shown.map((row) => {
        const percent = row.total > 0 ? (row.solved / row.total) * 100 : 0;
        return (
          <li key={row.topic} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-xs text-fg">{row.topic}</span>
              <span className="font-mono text-xs text-muted">
                {row.solved}/{row.total}
              </span>
            </div>
            <ProgressBar
              value={percent}
              label={`${row.topic} coverage: ${row.solved} of ${row.total} solved`}
            />
          </li>
        );
      })}
    </ul>
  );
}

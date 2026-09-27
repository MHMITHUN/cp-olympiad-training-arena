import type { ActivityDay } from "@/lib/stats";

/**
 * 12-week submission activity strip (spec 19.9): a grid of day cells,
 * columns = weeks (oldest left), rows = day of week. Intensity follows the
 * submission count of that day. Server component — deterministic from props.
 */

function levelClass(count: number): string {
  if (count === 0) return "bg-surface-2";
  if (count <= 2) return "bg-accent/30";
  if (count <= 5) return "bg-accent/60";
  return "bg-accent";
}

function formatDay(dayKey: string): string {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

export function ActivityStrip({ days }: { days: ActivityDay[] }) {
  // days is oldest-first; split into weeks of 7 for the column layout.
  const weeks: ActivityDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const activeDays = days.filter((day) => day.count > 0).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-[3px] overflow-x-auto pb-1" role="img" aria-label={`Activity strip: ${total} submissions across the last 12 weeks, ${activeDays} active days`}>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <span
                key={day.dayKey}
                className={`size-[10px] rounded-[2px] ${levelClass(day.count)}`}
                title={`${formatDay(day.dayKey)}: ${day.count} submission${day.count === 1 ? "" : "s"}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 font-mono text-[10px] text-muted">
        <span>
          {total} submissions &middot; {activeDays} active days
        </span>
        <span className="ml-auto inline-flex items-center gap-1">
          less
          <span className="size-[10px] rounded-[2px] bg-surface-2" />
          <span className="size-[10px] rounded-[2px] bg-accent/30" />
          <span className="size-[10px] rounded-[2px] bg-accent/60" />
          <span className="size-[10px] rounded-[2px] bg-accent" />
          more
        </span>
      </div>
    </div>
  );
}

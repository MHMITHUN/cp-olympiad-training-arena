import { Badge } from "@/components/ui";
import type { BadgeTone } from "@/components/ui";
import type { Difficulty } from "@/lib/db/types";

const toneByDifficulty: Record<Difficulty, BadgeTone> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge tone={toneByDifficulty[difficulty]} className="capitalize">
      {difficulty}
    </Badge>
  );
}

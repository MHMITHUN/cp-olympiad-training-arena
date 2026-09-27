import Link from "next/link";
import type { User } from "@/lib/db/types";
import type { RankedStanding } from "@/lib/scoring";
import { Table, TableHead, TableBody, TableRow, TH, TD, TableEmpty } from "@/components/ui";

/**
 * Contest scoreboard (server component): renders ranked ICPC standings with
 * per-problem cells ("+time" when solved, "-tries" red when attempted, dot
 * when untouched). The signed-in member's row is highlighted.
 */

export interface ScoreboardProblem {
  slug: string;
  title: string;
}

export interface ContestScoreboardProps {
  standings: RankedStanding[];
  usersById: Map<string, User>;
  problems: ScoreboardProblem[];
  /** Signed-in user id — their row gets the accent highlight. */
  meId?: string;
}

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export function ContestScoreboard({
  standings,
  usersById,
  problems,
  meId,
}: ContestScoreboardProps) {
  return (
    <Table>
      <TableHead>
        <TableRow className="hover:bg-surface-2">
          <TH className="w-14 text-center">#</TH>
          <TH>Member</TH>
          <TH className="w-16 text-center">Solved</TH>
          <TH className="w-20 text-center">Penalty</TH>
          {problems.map((problem, index) => (
            <TH
              key={problem.slug}
              className="w-16 text-center"
              aria-label={`Problem ${LETTERS[index] ?? index + 1}: ${problem.title}`}
            >
              {LETTERS[index] ?? index + 1}
            </TH>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {standings.length === 0 ? (
          <TableEmpty colSpan={4 + problems.length}>
            No scored submissions yet — the scoreboard fills as judged
            submissions arrive.
          </TableEmpty>
        ) : (
          standings.map((standing) => {
            const user = usersById.get(standing.userId);
            const isMe = meId !== undefined && standing.userId === meId;
            return (
              <TableRow key={standing.userId} className={isMe ? "bg-accent/5" : undefined}>
                <TD className="text-center font-mono text-xs text-muted">
                  {standing.rank}
                </TD>
                <TD>
                  {user ? (
                    <Link
                      href={`/profile/${user.handle}`}
                      className="font-mono text-sm font-medium text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {user.handle}
                      {isMe ? <span className="ml-2 text-xs text-accent">you</span> : null}
                    </Link>
                  ) : (
                    <span className="font-mono text-sm text-muted">unknown</span>
                  )}
                </TD>
                <TD className="text-center font-mono text-sm text-success">
                  {standing.solved}
                </TD>
                <TD className="text-center font-mono text-sm text-muted">
                  {standing.penalty}
                </TD>
                {problems.map((problem) => {
                  const solve = standing.solves.get(problem.slug);
                  if (solve) {
                    return (
                      <TD key={problem.slug} className="text-center">
                        <span
                          className="font-mono text-xs font-semibold text-success"
                          title={`Solved at minute ${solve.timeMinutes} (${solve.tries} ${solve.tries === 1 ? "try" : "tries"})`}
                        >
                          +{solve.timeMinutes}
                          {solve.tries > 1 ? (
                            <span className="ml-0.5 text-muted">({solve.tries})</span>
                          ) : null}
                        </span>
                      </TD>
                    );
                  }
                  if (standing.attempted.has(problem.slug)) {
                    return (
                      <TD key={problem.slug} className="text-center">
                        <span
                          className="font-mono text-xs text-danger"
                          title="Attempted, not solved"
                        >
                          &mdash;
                        </span>
                      </TD>
                    );
                  }
                  return (
                    <TD key={problem.slug} className="text-center text-muted">
                      <span className="font-mono text-xs">&middot;</span>
                    </TD>
                  );
                })}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

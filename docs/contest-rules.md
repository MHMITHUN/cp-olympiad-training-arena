# Contest Rules — ICPC Scoring at the Club

CP Arena runs its club rounds with **ICPC-style scoring**: transparent,
penalizing wrong tries on problems you eventually solve, and never rewarding
speed at the cost of correctness. The exact rule implemented in
`src/lib/scoring.ts` is the single source of truth; this page is the
human-readable version (a shorter copy is shown on `/leaderboard` and every
contest page).

---

## 1. The contest window

A contest has a **start** and an **end** instant (shown in UTC). The window
is inclusive on both ends:

| Phase | When | What members see |
| ----- | ---- | ---------------- |
| **before** | `now < startsAt` | live countdown; problem titles but not statements |
| **during** | `startsAt <= now <= endsAt` | statements open; submissions accepted; live scoreboard |
| **after** | `now > endsAt` | final standings; full editorials unlocked on each problem |

Submissions before the start are rejected ("The contest has not started
yet."). The phase rule lives in `src/lib/contests/window.ts` and is
unit-tested at the exact boundary milliseconds.

## 2. Scoring

- A problem is **solved** when a member has an **accepted** submission on it
  inside the contest window.
- **Penalty (minutes)** = for every SOLVED problem:
  - the number of minutes from the contest start to the **first accepted**
    submission on that problem, **plus**
  - **20 minutes per judged wrong try** on that problem made **before** the
    accept (wrong answer, time limit, runtime error, compile error).
- Wrong tries on problems that are **never solved add no penalty** — there is
  no reward for not trying.

### Worked example

A contest starts at 10:00 and lasts 3 hours. A member:

| Action | Clock | Effect |
| ------ | ----- | ------ |
| Wrong answer on B | 10:24 | B: 1 wrong try |
| Accepted on B | 10:41 | B solved at minute 41 |
| Accepted on A | 11:05 | A solved at minute 65, 0 wrong tries |
| Wrong answer on C | 11:40 | C: 1 wrong try (never solved) |

Final line: **2 solved**, penalty = (41 + 20×1) + (65 + 20×0) = **126**.
The wasted try on C costs nothing — which is deliberate: attempting a third
problem was still the right contest decision.

## 3. Ranking (tie-breaks, in order)

1. **More problems solved ranks higher.**
2. Equal solves → **smaller penalty ranks higher.**
3. Exact ties (same solves, same penalty) → ordered deterministically by
   member id, so scoreboards are stable across refreshes. This last rule
   exists for determinism only; real ties stay visibly tied.

## 4. Demo-judge honesty (important)

When the arena runs **without a Judge0 connection** (demo judge mode),
contest submissions are stored with the verdict **`recorded`** — no verdict
exists. These submissions:

- **never** count as solved,
- **never** add penalty,
- **cannot move the scoreboard** in either direction.

Only **judged** submissions (a real Judge0 verdict, or rows from the seeded
sample history) affect contest standings. There is no configuration in which
a fabricated verdict changes a rank. See
[docs/judge-integration.md](judge-integration.md) for connecting a real judge.

## 5. Practice leaderboard (separate rule)

`/leaderboard` ranks PRACTICE across all published problems, and states its
rule on the page:

1. Problems solved (distinct accepted solves), descending.
2. Equal counts → the member whose **latest accepted solve happened earlier**
   ranks higher (who reached the progress first).
3. Members who never solved are ordered by handle.

Contest solves count toward practice totals too — an accepted submission is
an accepted submission — but contest *penalties* apply only inside contest
standings.

## 6. Conduct rules the club actually enforces

- One account per person; handles are the public identity and cannot be
  impersonated (registration enforces uniqueness).
- During a round: no external code generators, no sharing solutions in the
  club chat until the scoreboard freezes. Coach judgment applies.
- Editorials unlock automatically after the round; reading them is part of
  training, not cheating — AFTER the clock.

# Mentorship — a Coach's Weekly Loop

The coach dashboard (`/coach`, sign in as `teacher@demo.local`) is designed
around one question: **what should the coach do in the 30 minutes before
this week's club session?** Everything on it is computed live from the
club's submissions — no cached summaries, no estimated numbers.

This document is the weekly routine the dashboard was built for.

---

## The 30-minute weekly loop

### 1. Read the pulse (2 min) — the three stat cards

| Card | What it means | Action threshold |
| ---- | ------------- | ---------------- |
| **Members** | registered club members | growth check |
| **Active (14 days)** | submitted something in the last two weeks | below half the club → announce a contest or practice set |
| **Need support** | members matching any support flag | any count > 0 → the names are listed below with reasons |

### 2. Review the week's submissions (10 min) — *Recent club submissions*

The newest 8 submissions with verdicts. In demo judge mode these arrive as
**`recorded`** (dashed badge, "demo · teacher review" tag) — this list IS
the review queue: open each problem, read the code, and give the member a
verdict in person or in the club chat. Seeded history rows carry a
`sample` tag so you never mistake demo data for a real member's work.

*With Judge0 connected the same list shows real verdicts and your review
shifts to wrong-answer debugging instead of raw reading.*

### 3. Check who needs a nudge (5 min) — *Needs support*

A member is flagged for exactly one of three stated reasons (the dashboard
shows the reason, never just a name):

- **0 solves ever despite submitting** → sit with them this session; usually
  an I/O-format or loop-boundary habit, fixable in 10 minutes;
- **no activity for 30+ days** → personal message, invite to the next round;
- **never submitted anything yet** → pair them with an active member on
  Path 01 problem 1 — the first accepted solve is the retention battle.

### 4. Look at what the club finds hard (5 min) — *Most difficult topics*

Accept ratio per topic across judged submissions, worst first. This is the
direct input to pacing: if `binary-search` sits at the top two weeks
running, re-teach the invariant before moving on (see
[docs/learning-paths.md](learning-paths.md) — the week order is a default,
this table is the evidence to override it).

### 5. Scan the wall of shame-free zone (3 min) — *Unresolved problems*

Published problems with zero accepted submissions club-wide, most attempted
first. High attempts + no solves = the problem is either a great teaching
moment or pitched too high — decide which, and either walk its editorial in
the session or move it down the path.

### 6. Close the loop on contests (5 min) — *Contest participation*

Every contest with participant count, average score and the current leader.
Low participation on a past round → schedule the next one at a better time;
upcoming rounds → announce the countdown in the club channel (`/contests`
shows it live).

---

## The weekly session plan (using the whole arena)

1. **Before the session** — run the 30-minute loop above; pick ONE problem
   to walk through based on *Most difficult topics*.
2. **Open the session** with that problem's hints (reveal hint 1 only) and
   let the club guess the approach before any code.
3. **Solve on-site** — members submit from their own accounts; in demo mode
   the submissions still land in your review queue with real code.
4. **Editorial moment** — after the solve window, open the editorial
   together (the explicit "I want to see the editorial" click is a feature:
   it marks the moment the answer is given away).
5. **Homework** — the rest of that week's path section (see the pacing
   tables in `docs/learning-paths.md`).
6. **Every few weeks** — create a round at *Coach → Create contest*:
   pick 3–5 published problems, a start time (UTC) and a duration; the
   countdown, scoreboard and post-round editorial unlock all happen
   automatically. Draft contests stay coach-only until published, exactly
   like draft problems.

## Authoring loop (coaches own the content)

- New problems are authored as **drafts** (invisible to students), each with
  statement, constraints, examples, 2–3 progressive hints, a full editorial
  **and a reference C++ solution** — the reference solution is what powers
  the demo "Run on sample" catalog, so never skip it.
- Publish when the week arrives; the problem instantly appears in the
  library, its path page, and can be added to contests.
- Fixed demo-club dates in seeds model a realistic semester timeline —
  your own content uses real dates.

## The honest-mode mentorship contract

The whole dashboard works in every mode because nothing on it is faked:
recorded-but-unjudged submissions are labeled recorded, seeded history rows
are labeled sample, and "Need support" flags state their reasons. The
coach's judgment — not a black box — remains the grading standard in demo
mode, and the numbers stay meaningful when a real judge is connected.

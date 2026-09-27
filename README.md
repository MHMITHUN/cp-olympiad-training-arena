# CP Arena — Competitive Programming & Olympiad Training Arena

An interactive training platform for school and college programming clubs,
ICT Olympiad preparation, and competitive programming mentorship: a curated
library of 40 original contest-style problems across ten learning paths,
club contests with live countdowns and ICPC scoring, a transparent
leaderboard, per-member progress analytics, a coach dashboard for
mentorship — and a judge pipeline that never fakes a verdict.

## Live Demo

> **Placeholder** — not deployed yet. Run it locally in under a minute with
> the steps in [Local Development](#local-development); everything below is
> exercisable with the demo accounts table.

## Screenshots

Captured with `node scripts/screenshots.mjs` against the demo-mode app
(desktop 1280x800, mobile 390x844):

| File | Shows |
| ---- | ----- |
| `docs/screenshots/01-home.png` | landing page, stats strip, ten-path grid |
| `docs/screenshots/02-problem.png` | problem page: statement, hints, CodeMirror C++ workspace |
| `docs/screenshots/03-contest.png` | contest page with its live countdown |
| `docs/screenshots/04-mobile.png` | problems list at phone width (390x844) |
| `docs/screenshots/05-coach.png` | coach dashboard: activity, hard topics, support list |

## Problem

School and college programming clubs in Bangladesh (and everywhere) run on
the same three gaps:

1. **No problem library.** Coaches paste problems into chat from scattered
   PDFs; there is no ordered curriculum from "first loop" to "first
   contest", no hints, no editorials, no record of who solved what.
2. **No honest judge.** Clubs cannot host a sandboxed C++ judge, so members
   never see a real verdict — or worse, use sites that gamify everything and
   teach nothing about reading a statement carefully.
3. **No mentorship loop.** A coach has no single view of who is active,
   which topic the club is stuck on, or who quietly stopped submitting.

CP Arena is the club's own online judge: original problem content (the
statements, hints and editorials ARE the product), real contest mechanics,
and a dashboard that turns submission data into teaching decisions.

## Educational Objective

A member who walks all ten paths can:

- read a problem statement and extract constraints, input/output format and
  edge cases before writing code;
- use the C++ STL (`vector`, `sort`, `string`, `lower_bound`) instead of
  hand-rolling;
- apply the standard toolkit — number theory, binary search, greedy with an
  exchange argument, recursion/backtracking, BFS/DFS, dynamic programming;
- survive a live contest: manage the clock, penalty and wrong-try cost
  (ICPC rules), and read editorials afterward as deliberate practice.

A coach, in parallel, learns to run data-informed sessions: pacing from the
"hardest topics" table, interventions from the "needs support" list.

## Features

- **Problem library (40 original problems)** — real competitive-programming
  statements with correct constraints, verified examples, 2–3 progressive
  hints, full editorials, starter C++ code, time/memory limits, topics and
  difficulty bands. Browsing is public; drafts stay coach-only.
- **Ten learning paths** — a curriculum-ordered progression (basics →
  problem solving → STL → number theory → searching/sorting → greedy →
  recursion → graphs → DP → contest strategy), each path page listing its
  problems in recommended solve order. See
  [docs/learning-paths.md](docs/learning-paths.md).
- **Honest code submission** — a CodeMirror 6 C++ workspace with a judge
  adapter: real verdicts through Judge0 when configured; otherwise
  submissions are recorded (verdict `recorded`) for teacher review and
  clearly labeled — never a fabricated AC/WA. "Run on sample" replays the
  pre-recorded reference-solution catalog with an honest miss message
  otherwise. See [docs/judge-integration.md](docs/judge-integration.md).
- **Club contests** — live countdown before the start, locked statements,
  ICPC scoring (20-minute wrong-try penalty, transparent tie-breaks), live
  scoreboards during the round, standings archived forever, editorials
  unlocked after the end. See [docs/contest-rules.md](docs/contest-rules.md).
- **Practice leaderboard** — ranked by problems solved with a rule stated
  on the page; filterable by learning path.
- **Member progress** — solved count, accuracy, topic coverage (a
  descriptive metric, not a skill claim), difficulty distribution chart,
  12-week activity strip, streak, contest history, public profile by handle.
- **Coach dashboard (`/coach`)** — active members, members who need support
  (with the reason), hardest topics by accept ratio, unresolved problems,
  contest participation, recent submissions. See
  [docs/mentorship.md](docs/mentorship.md).
- **Auth with roles** — scrypt password hashing, HMAC-signed session
  cookies, public browsing without login, student self-registration,
  TEACHER/ADMIN-gated content creation.
- **Dual-mode data layer** — in-memory demo store (zero setup, lazily
  seeded) or MongoDB (same interface, zod-parsed boundary, indexes).

## Technology Stack

| Layer | Choice | Version |
| ----- | ------ | ------- |
| Framework | Next.js (App Router, Server Actions) | 16.3.6 |
| UI | React | 19.3.0 |
| Language | TypeScript (strict) | 5.9.3 |
| Styling | Tailwind CSS v4 (`@theme` tokens, no config file) | 4.3.x |
| Validation | zod (schemas at the Mongo boundary + forms) | ^4.6.5 |
| Database | MongoDB Node driver (dual-mode store) | ^7.6.0 |
| Icons | lucide-react | ^1.48.0 |
| Charts | recharts (+ react-is) | 3.10.1 / ^19.3.0 |
| Code editor | @uiw/react-codemirror + codemirror + @codemirror/lang-cpp | ^4.25.12 / ^6.0.2 / ^6.0.3 |
| Unit tests | Vitest + happy-dom + Testing Library | ^5.0.2 |
| E2E tests | Playwright | 1.63.0 |
| Lint / format | ESLint (flat config) ^9.39.0, Prettier ^3.9.9 | |

Design: a dark competitive-arena theme with an amber accent, JetBrains Mono
for code and numbers, dense sortable tables — a serious online-judge feel,
not a gamified toy. Focus-visible states and WCAG-AA contrast on dark.

## Architecture

```text
                    Browser
        ┌──────────────┼─────────────────┐
   Server pages     Client comps      Route handler
 (force-dynamic)   (hints, editor,     /api/run
        │           workspace)            │
        │               │  Server Action  │
        ▼               ▼  (submit)       ▼
   ┌───────────────────────────────────────────┐
   │ Guards + Services (src/lib)               │
   │  auth/  scoring  stats  clock  contests/  │
   └───────────────┬───────────────┬───────────┘
                   │               │
                   ▼               ▼
          ┌──────────────┐  ┌─────────────────────┐
          │ getStore()   │  │ Judge adapter       │
          │ DemoStore    │  │ (src/lib/judge)     │
          │ (in-memory)  │  │  Judge0Judge  ←─────┼── JUDGE0_API_URL/KEY
          │ or MongoStore│  │  DemoJudge (record) │   (unset ⇒ demo mode)
          └──────┬───────┘  └─────────┬───────────┘
                 │                    │
                 ▼                    ▼
        MongoDB (optional)    Submission rows (same shape
        zod-parsed boundary   either way; verdict "recorded"
        + indexes             in demo mode — see below)
```

**Demo honesty note.** The judge adapter has exactly two implementations:
`Judge0Judge` (real verdicts from a Judge0-compatible service) and
`DemoJudge` (stores the submission with verdict `recorded` and the note
"Judge unavailable - submission recorded for teacher review. Connect Judge0
for real verdicts."). There is no code path that fabricates an
accepted/wrong-answer verdict, and `contestScore` ignores `recorded`
submissions by design — a demo submission can never move a scoreboard. Full
details: [docs/judge-integration.md](docs/judge-integration.md).

Pure rules are separated for testing: contest scoring and leaderboard
ordering live in `src/lib/scoring.ts`, progress metrics in
`src/lib/stats.ts`, the contest clock (before/during/after) in
`src/lib/contests/window.ts` — all deterministic, all unit-tested with
fixed timestamps.

## Database Model

Six collections (DemoStore mirrors them in memory):

| Collection | Key fields | Notes |
| ---------- | ---------- | ----- |
| `users` | id, name, email (unique), passwordHash (scrypt), role (`ADMIN`/`TEACHER`/`STUDENT`), handle (unique), createdAt | handle is the public contest identity |
| `problems` | id, slug (unique), title, statementMd, difficulty (`easy`/`medium`/`hard`), pathSlug, topics[], constraintsMd, examples[], starterCodeCpp, timeLimitMs, memoryLimitMb, hints[], editorialMd, status (`draft`/`published`), authorId, createdAt, solvedCount, attemptedCount | drafts visible to staff only |
| `submissions` | id, problemId, userId, language (`cpp`/`c`), code, verdict (`accepted`/`wrong_answer`/`time_limit`/`runtime_error`/`compile_error`/`recorded`), judgeMode (`judge0`/`demo`/`seed`), runtimeMs?, memoryKb?, createdAt, contestId? | `judgeMode: "seed"` rows are the labeled sample history |
| `paths` | slug, order, title, descriptionMd, problemSlugs[] | the ten-path curriculum |
| `contests` | id, slug (unique), title, descriptionMd, startsAt, endsAt, durationMinutes, problemSlugs[], rulesMd, status, createdBy | ISO timestamps; window inclusive both ends |
| `participations` | id, contestId+userId (unique), joinedAt, score, penalty | join-on-submit keeps the scoreboard honest |

Indexes (created by both `MongoStore.create()` and `npm run seed`): unique
email/handle/slug/path-slug/contest-slug and contestId+userId, plus
createdAt-descending composites for the submission feeds.

## Authentication and Authorization

- **Passwords**: scrypt (`node:crypto`), stored as `scrypt$<salt>$<hash>`,
  unique salt per user; verified with `timingSafeEqual`.
- **Sessions**: stateless tokens — base64url(JSON payload) +
  HMAC-SHA256 signature (`SESSION_SECRET`; 7-day expiry), set as an
  httpOnly, SameSite=Lax cookie. Tokens are cross-checked against the
  store (a role change invalidates the old token).
- **Guards, not middleware**: every protected surface guards itself
  (`getSessionUser` / `requireUser` / `requireRole` for pages,
  `apiGuard` for the route handler). There is no `middleware.ts` by design.
- **Roles**:
  - anonymous — browse problems, paths, contests, leaderboard, public
    profiles (public browsing is a spec rule);
  - STUDENT (self-registration, club reality) — submit code, track
    progress, join contests;
  - TEACHER/ADMIN — author problems, create/publish contests, see the
    coach dashboard and drafts.

## Testing

| Layer | Tool | What is covered |
| ----- | ---- | --------------- |
| Unit | Vitest (`npm run test:run`, 105 tests) | scoring + leaderboard rules; streak/mastery/topic stats; problem filters + pagination; editorial + draft gating; demo-judge honesty + sample-run catalog; auth (scrypt, session tokens, register validation, handle uniqueness); contest-window boundaries; register/login schemas; utils |
| E2E | Playwright (`npm run test:e2e`, needs the dev server on :3004) | smoke flows: home + path grid, difficulty filter, progressive hints + editorial confirm, register → submit → honest `recorded` verdict, upcoming-contest countdown, ordered leaderboard, teacher login → coach dashboard — with a no-console-errors assertion on every flow |

The judge-adapter honesty rules are pinned by unit tests: demo submissions
are `recorded`, counted as attempts but never as solves, and never affect
scoreboards.

## Local Development

```bash
npm install
npm run dev          # http://localhost:3004  (dev script pins the port)
```

No environment variables are required: without `MONGODB_URI` the app runs
in **demo mode** — an in-memory store, seeded lazily with a sample club
(24 accounts: 20 members, 3 coaches, 1 admin — plus 40 problems, sample
submission history and 3 contests) that resets on restart and is honestly
labeled in the UI.

Other commands: `npm run build` · `npm run start` · `npm run lint` ·
`npm run typecheck` · `npm run test:run` · `npm run test:e2e` ·
`npm run seed` (MongoDB mode only; demo mode prints a message and exits 0).

### Demo accounts

Password for every demo account: `Demo@12345`

| Email               | Role    | Handle          | Lands on |
| ------------------- | ------- | --------------- | -------- |
| admin@demo.local    | ADMIN   | club_admin      | /coach |
| teacher@demo.local  | TEACHER | coach_nusrat    | /coach |
| student@demo.local  | STUDENT | code_ninja      | /profile |

Anyone can self-register as a STUDENT ("Join your club"); coach accounts are
created by an admin.

## Environment Variables

All optional — the app runs with none of them set.

| Variable | Purpose |
| -------- | ------- |
| `MONGODB_URI` | Connection string. Unset ⇒ demo store; set ⇒ MongoStore (documents parsed with zod at the boundary). |
| `MONGODB_DB_NAME` | Database name when Mongo is used (default `cp_arena`). |
| `SESSION_SECRET` | HMAC key for session tokens. **Set in production** — the fallback demo secret lets anyone forge tokens. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JUDGE0_API_URL` | Judge0-compatible endpoint (e.g. `http://localhost:2358` self-hosted, or the RapidAPI URL). |
| `JUDGE0_API_KEY` | Judge0 API key. **Both** `JUDGE0_*` variables must be set together for real verdicts; otherwise the judge runs in honest demo mode. |

See [.env.example](.env.example) and
[docs/judge-integration.md](docs/judge-integration.md).

## Deployment

**Vercel, zero-env** (demo mode): import the repo, deploy — Next.js 16
App Router works out of the box; `next build` needs no database or judge.
The site is fully functional as a demo club with honest labeling.

**With persistence and real verdicts** (any Node host or VM):
set `MONGODB_URI` (+ `MONGODB_DB_NAME`), a strong `SESSION_SECRET`, and
optionally the `JUDGE0_*` pair; run `npm run seed` once against the
database, then `npm run build && npm run start`. Judge0 can be self-hosted
next to the app with one Docker command (see the judge doc) — keep it
network-reachable by the server only.

## Demo Accounts

(Same table as Local Development — the three seeded logins are the demo.)
`admin@demo.local` / `teacher@demo.local` / `student@demo.local`, password
`Demo@12345`; plus 21 additional seeded accounts (2 coaches, 19 members)
with handles and sample history visible on the leaderboard. The seeded
history is labeled `sample` in every feed so demo data can never
masquerade as real activity.

## Known Limitations

- **Demo submissions are recorded, not auto-judged.** Without a Judge0
  connection, verdicts are `recorded` and labeled "for teacher review" —
  no accepted/wrong-answer can occur. Connect Judge0 for real verdicts.
- **Seeded history is sample data.** Rows from the demo club's history are
  tagged `sample` (`judgeMode: "seed"`) in the UI and never presented as
  live judging.
- **The upcoming contest date regenerates at seed time.** The seeded
  "Autumn Training Contest" always starts 3 days after the store is seeded
  (demo boot or `npm run seed`) so its countdown is live; it is not a
  fixed calendar event.
- **Demo mode resets on restart** (in-memory store) and is single-process —
  two app instances would have separate demo clubs. Use MongoDB for
  anything shared.
- **C/C++ only** (the club's language); submissions are size-capped at
  100 KB; contest scoring uses the problem examples as tests (Judge0 runs
  each example with expected output attached).
- **No email verification / password reset** — a club tool with
  coach-mediated accounts, not a public SaaS.
- Screenshots and the live-demo URL are placeholders (see above).

## Future Enhancements

- Custom test files per problem (beyond the examples) for deeper judging.
- Coach verdicts on recorded submissions (human AC/WA after review).
- Discussion threads under problems; upvoted clarifications during rounds.
- Batch CSV import of members; invitation codes per club.
- Codeforces-style gym sync / external contest calendar embedding.
- Per-path analytics for members ("you are 60% through Number Theory").
- Dark/light theme toggle (currently dark-only by design).
- Judge0 webhook-based (non-wait) submission flow for large batches.

## Teaching Use Cases

- **Weekly club session**: walk one learning-path section on-site, assign
  the rest as homework (`docs/learning-paths.md` pacing tables).
- **Pre-Olympiad bootcamp**: paths 04 + 10 plus timed mini-contests;
  penalty discipline practiced under real ICPC rules.
- **Exam prep (ICT olympiad)**: number-theory and precision problems mirror
  national olympiad style statements.
- **Coaching practicum (for CSE teaching students)**: the coach dashboard
  demonstrates data-informed lesson planning — hardest-topics → next
  session's content.
- **Interview preparation for seniors**: greedy, DP and graph classics with
  editorials double as technical-interview rehearsal.

## Interview Talking Points

- **Honest-system design**: the demo judge records instead of fabricating;
  the scoreboard ignores unjudged submissions; sample history is labeled.
  How do you design a system that degrades gracefully without lying?
- **Dual-mode persistence**: one `Store` interface, in-memory demo and
  zod-boundaried Mongo implementations — swapping backends with zero page
  changes, and why validation lives at the boundary.
- **Pure-core architecture**: scoring/stats/clock rules as deterministic,
  unit-tested functions (fixed `now` parameters, no hidden `Date.now()`),
  with React pages as thin renderers.
- **Stateless auth without middleware**: HMAC-signed cookies, per-page
  guards, role re-check against the store — and the trade-offs vs.
  middleware-based protection.
- **Testing strategy**: 105 unit tests around pure rules + Playwright smoke
  flows asserting honest UI copy (the `recorded` verdict text) and zero
  console errors.
- **Next.js 16 specifics**: Promisified `cookies`/`params`/`searchParams`,
  `force-dynamic` on data pages, Server Actions for mutations.

## License

MIT — see [LICENSE](LICENSE).

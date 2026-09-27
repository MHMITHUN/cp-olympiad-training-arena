# Judge Integration — Judge0 and the Honest Demo Mode

CP Arena never executes student code itself. Code submission goes through a
**judge adapter** (spec 19.5): the same UI and the same stored `Submission`
row whether the backend is a real Judge0 service or the demo recorder.

```text
        +---------------------------------------------------+
        |  Next.js app                                       |
        |                                                    |
        |  ProblemWorkspace (UI)                             |
        |        |  submitSolutionAction (server action)      |
        |        v                                          |
        |  src/lib/judge/judge.ts  ---- getJudge() --------+ |
        |        |                                         | |
        |        v                                         v |
        |  +--------------+                       +--------------+
        |  | DemoJudge    |                       | Judge0Judge  |
        |  | (default)    |                       | (real mode)  |
        |  | verdict:     |                       | verdicts:    |
        |  | "recorded"   |                       | accepted /   |
        |  | never faked  |                       | WA / TLE /   |
        +--+--------------+-----------------------+ RE / CE      |
           |                      |               +--------------+
           v                      v                        |
        DemoStore / MongoStore (same Submission document)    |
           ^-------------------------------------------------+
```

The adapter picks its implementation **at request time** from the
environment (`src/lib/judge/config.ts`): real mode requires **both**
`JUDGE0_API_URL` **and** `JUDGE0_API_KEY`; anything else is demo mode.

---

## Real mode: connecting Judge0

### Option A — self-host Judge0 CE (recommended for a club)

On a machine (or a small VPS / school server) with Docker:

```bash
docker run -d --name judge0-server \
  -p 2358:2358 \
  -e REDIS_PASSWORD=your-redis-password \
  judge0/judge0:1.13.0
```

Then point the arena at it:

```bash
# .env.local
JUDGE0_API_URL=http://<judge0-host>:2358
JUDGE0_API_KEY=<your RapidAPI key or self-hosted key>
```

Self-hosted Judge0 CE ignores the key by default, but the arena requires the
variable to be present (both must be set — one alone stays in demo mode).

### Option B — RapidAPI hosted Judge0

1. Subscribe to Judge0 on RapidAPI (a free tier exists).
2. Copy the **X-RapidAPI-Key** value.
3. Set:

```bash
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=<your X-RapidAPI-Key>
```

### What real mode does per submission

- Every problem **example** is submitted as one Judge0 run
  (`base64_encoded=true&wait=true`) with the expected output attached, so
  Judge0 itself reports Wrong Answer on mismatch — the app never diffs
  outputs itself.
- The first non-accepted example decides the verdict. Status ids map
  directly: 3 accepted, 4 wrong answer, 5 time limit, 6 compile error,
  everything else runtime error. **No status is ever invented.**
- Time and memory from Judge0 are stored on the submission row.
- "Run on sample" **really executes** the program on each example input with
  Judge0 and shows the live stdout next to the expected output.

Restart the dev/prod server after changing these variables — the mode is
resolved per request from `process.env`, but the UI banner is rendered on
the server.

---

## Demo mode (default): honest recording

With no Judge0 configured the arena stays fully usable, and **never lies**:

- **Submissions are stored** with verdict `recorded` and judge mode `demo`,
  time-stamped, in the same feed the coach reviews.
- The problem page labels them plainly: *"Demo mode - submission recorded
  for teacher review, not auto-judged."* The verdict badge for `recorded` is
  deliberately styled with a dashed border so it can't be mistaken for a
  judged verdict.
- `recorded` submissions **cannot move scoreboards or leaderboards** — see
  [docs/contest-rules.md](contest-rules.md) §4. A demo submission never
  becomes an "accepted" solve by accident or configuration.
- **"Run on sample"** in demo mode replays the pre-recorded catalog: each of
  the 40 problems ships with a reference C++ solution, and *only* a
  whitespace-normalized exact match of that reference (for *that* problem)
  replays the recorded sample outputs. Any other program gets the honest
  miss note — "no live compiler is available, and this exact program is not
  in the pre-recorded catalog" — never a simulated execution.

## Demo-mode work flow for a club week

1. Members submit; every submission lands with `recorded`.
2. The coach opens `/coach` → *Recent club submissions*, reviews code by
   hand, and gives verdicts in the session (the human IS the judge).
3. The moment a Judge0 endpoint is configured, the same flow starts
   returning real verdicts — no data migration, the same collection.

## Environment variables (summary)

| Variable | Required | Effect |
| -------- | -------- | ------ |
| `JUDGE0_API_URL` | for real mode | Base URL of a Judge0-compatible API (`http://host:2358` or the RapidAPI URL). |
| `JUDGE0_API_KEY` | for real mode | API key (RapidAPI key, or any non-empty value for a self-hosted CE that ignores keys). **Both** variables must be set together. |
| *(unset)* | default | Demo judge: submissions recorded, never auto-judged. |

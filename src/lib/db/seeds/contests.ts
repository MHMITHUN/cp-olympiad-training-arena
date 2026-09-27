import type { Verdict } from "../types";
import { referenceSolutionsBasics } from "./problems-basics";
import { referenceSolutionsAdvanced } from "./problems-advanced";
import { contestScore } from "../../scoring";

/**
 * Club contest seeds (spec 19.7).
 *
 * - Two PAST contests with fixed dates and full result history: judged
 *   submissions (judgeMode "seed", labeled "sample" in the UI) plus
 *   participation rows whose score/penalty are COMPUTED with the same
 *   contestScore() that powers the live scoreboard — seed data and scoring
 *   rule can never disagree.
 * - One UPCOMING contest whose startsAt is computed at SEED TIME as now + 3
 *   days (endsAt = startsAt + duration) so its countdown is always live.
 *   Never hard-code a date for it in this file.
 *
 * usr-student-03 and usr-student-13 are deliberately absent: store tests
 * (tests/problem-filter.test.ts) pin their submission footprints.
 */

export interface SeedContest {
  slug: string;
  title: string;
  descriptionMd: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  problemSlugs: string[];
  rulesMd: string;
  status: "draft" | "published";
  createdBy: string;
}

export interface SeedContestSubmission {
  id: string;
  contestSlug: string;
  userId: string;
  problemSlug: string;
  language: "cpp" | "c";
  code: string;
  verdict: Verdict;
  createdAt: string;
  runtimeMs?: number;
  memoryKb?: number;
}

export interface SeedParticipation {
  contestSlug: string;
  userId: string;
  joinedAt: string;
  score: number;
  penalty: number;
}

const allReferences = {
  ...referenceSolutionsBasics,
  ...referenceSolutionsAdvanced,
};
const ref = (slug: string): string => allReferences[slug];

/** Shared ICPC rules text (also the default template for new contests). */
export const ICPC_RULES_TEMPLATE = `## Format

- Individual contest; every member solves alone.
- The contest window is the full duration. The scoreboard is visible while the contest runs.

## Scoring (ICPC style)

- Each solved problem scores 1 point.
- Your penalty is the sum, over problems you SOLVED, of:
  - the minute of the contest at which your first accepted solution was submitted, plus
  - 20 penalty minutes for every wrong submission on that problem made BEFORE the accepted one.
- Wrong submissions on problems you never solve add no penalty.
- Ranking: more problems solved first; on equal solves, the smaller penalty wins.

## Honesty

- Demo judge mode records submissions for coach review without judging them; only judged (Judge0) submissions and this club's archived history move the scoreboard.`;

/* ---- believable wrong submissions (short, single-bug programs) -------- */

const WA_SORT_BY_START = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n; cin >> n;
    vector<pair<long long,long long>> a(n);
    for (auto& p : a) cin >> p.first >> p.second;
    sort(a.begin(), a.end());            // BUG: sorted by START, not finish
    long long last = -1; int c = 0;
    for (auto& p : a) if (p.first >= last) { c++; last = p.second; }
    cout << c << "\\n";
}`;

const WA_PLATFORM_EQUALITY = `#include <bits/stdc++.h>
using namespace std;

int toMin(const string& s){ return stoi(s.substr(0,2))*60 + stoi(s.substr(3,2)); }

int main() {
    int n; cin >> n;
    vector<int> arr(n), dep(n);
    for (int i = 0; i < n; i++) { string a,b; cin >> a >> b; arr[i]=toMin(a); dep[i]=toMin(b); }
    sort(arr.begin(), arr.end()); sort(dep.begin(), dep.end());
    int p = 0, best = 0; size_t i = 0, j = 0;
    while (i < n && j < n) {
        if (arr[i] <= dep[j]) { p++; best = max(best, p); i++; }   // BUG: <= counts a
        else { p--; j++; }                                          // same-minute reuse twice
    }
    cout << best << "\\n";
}`;

const WA_PERM_NO_UNDO = `#include <bits/stdc++.h>
using namespace std;

int n;
vector<int> cur;
vector<bool> used;

void go() {
    if ((int)cur.size() == n) {
        for (int i = 0; i < n; i++) cout << cur[i] << " \\n"[i==n-1];
        return;
    }
    for (int v = 1; v <= n; v++) {
        if (used[v]) continue;
        used[v] = true;
        cur.push_back(v);
        go();
        cur.pop_back();      // BUG: forgot used[v] = false
    }
}

int main() { cin >> n; used.assign(n+1,false); go(); }`;

const WA_PRIME_SKIPS_TWO = `#include <iostream>
using namespace std;

int main() {
    long long n; cin >> n;
    bool prime = n >= 2;
    for (long long i = 3; i * i <= n; i += 2)      // BUG: never handles n == 2
        if (n % i == 0) { prime = false; break; }
    cout << (prime ? "YES" : "NO") << "\\n";
}`;

const WA_LCM_MULTIPLY_FIRST = `#include <iostream>
using namespace std;

long long gcd(long long a, long long b) { return b == 0 ? a : gcd(b, a % b); }

int main() {
    long long a, b; cin >> a >> b;
    cout << gcd(a, b) << " " << a * b / gcd(a, b) << "\\n";   // BUG: a*b overflows first
}`;

const WA_MODEXP_INIT_ONE = `#include <iostream>
using namespace std;

int main() {
    long long b, e, m; cin >> b >> e >> m;
    long long result = 1;              // BUG: must be 1 % m (m can be 1)
    while (e > 0) {
        if (e & 1) result = result * b % m;
        b = b * b % m;
        e >>= 1;
    }
    cout << result << "\\n";
}`;

const WA_COINS_ORDERED = `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int m; long long t; cin >> m >> t;
    vector<long long> coins(m);
    for (auto& c : coins) cin >> c;
    vector<long long> dp(t + 1, 0);
    dp[0] = 1;
    for (long long amount = 1; amount <= t; amount++)          // BUG: amount outer,
        for (long long c : coins)                               // coin inner counts
            if (amount >= c) dp[amount] += dp[amount - c];      // ORDERED sequences
    cout << dp[t] << "\\n";
}`;

const WRONG_CODE_BY_SLUG: Record<string, string> = {
  "activity-selection": WA_SORT_BY_START,
  "minimum-platforms": WA_PLATFORM_EQUALITY,
  "generate-permutations": WA_PERM_NO_UNDO,
  "prime-check": WA_PRIME_SKIPS_TWO,
  "gcd-lcm": WA_LCM_MULTIPLY_FIRST,
  "modular-exponentiation": WA_MODEXP_INIT_ONE,
  "coin-change-dp": WA_COINS_ORDERED,
};

const wrongCodeFor = (slug: string, seedIndex: number): string => {
  const code = WRONG_CODE_BY_SLUG[slug];
  if (code) return code;
  // Fallback: a plausible attempt that misses (unused for current contests).
  return `#include <iostream>\nusing namespace std;\n\nint main() {\n    // attempt ${seedIndex}: incomplete solution\n    return 0;\n}`;
};

/* ---- past contest definitions ---------------------------------------- */

const INTRA_ROUND_1: SeedContest = {
  slug: "intra-club-round-1",
  title: "Intra Club Contest Round 1",
  descriptionMd:
    "The club's first internal rated round of the spring season — three classics straight from the Greedy and Recursion paths. Intended for members who finished the first five learning paths.",
  startsAt: "2026-03-14T10:00:00.000Z",
  endsAt: "2026-03-14T12:00:00.000Z",
  durationMinutes: 120,
  problemSlugs: ["activity-selection", "minimum-platforms", "generate-permutations"],
  rulesMd: ICPC_RULES_TEMPLATE,
  status: "published",
  createdBy: "usr-teacher-01",
};

const MATH_LOGIC_ROUND: SeedContest = {
  slug: "math-logic-pre-olympiad",
  title: "Math-Logic Pre-Olympiad Round",
  descriptionMd:
    "A three-hour pre-Olympiad selection round focused on number theory and dynamic programming. The top finishers formed the club's Informatics Olympiad shortlist.",
  startsAt: "2026-06-06T09:00:00.000Z",
  endsAt: "2026-06-06T12:00:00.000Z",
  durationMinutes: 180,
  problemSlugs: [
    "prime-check",
    "gcd-lcm",
    "modular-exponentiation",
    "coin-change-dp",
  ],
  rulesMd: ICPC_RULES_TEMPLATE,
  status: "published",
  createdBy: "usr-teacher-02",
};

export const pastContestSeeds: SeedContest[] = [INTRA_ROUND_1, MATH_LOGIC_ROUND];

/**
 * The one UPCOMING contest. startsAt = seed time + 3 days, computed by the
 * CALLER (DemoStore.ensureSeeded / scripts/seed.ts) so the countdown on
 * /contests is always live relative to real time. Never give it a fixed date.
 */
export function makeUpcomingContest(now: Date): SeedContest {
  const startsAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + 120 * 60 * 1000);
  return {
    slug: "autumn-training-contest",
    title: "Autumn Training Contest",
    descriptionMd:
      "The season opener for the new training cycle: one problem from each of the strategy, graph, greedy and dynamic-programming paths. Two hours, individual, ICPC scoring. Register early and warm up on the learning paths.",
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    durationMinutes: 120,
    problemSlugs: [
      "multiple-test-cases",
      "bfs-shortest-path",
      "maximize-salary",
      "climbing-stairs",
    ],
    rulesMd: ICPC_RULES_TEMPLATE,
    status: "published",
    createdBy: "usr-teacher-01",
  };
}

/* ---- result history for the past contests ----------------------------- */

/**
 * Per member: the problems they touched. `acMin` is the contest minute of
 * the first accepted submission (omitted = never solved); `wrongTries` are
 * failed attempts that happened before it.
 */
interface ResultSpec {
  userId: string;
  problems: Array<{
    problemSlug: string;
    acMin?: number;
    wrongTries: number;
  }>;
}

const ROUND1_RESULTS: ResultSpec[] = [
  { userId: "usr-student-01", problems: [
    { problemSlug: "activity-selection", acMin: 24, wrongTries: 0 },
    { problemSlug: "minimum-platforms", acMin: 52, wrongTries: 0 },
    { problemSlug: "generate-permutations", acMin: 88, wrongTries: 1 },
  ] },
  { userId: "usr-student-02", problems: [
    { problemSlug: "activity-selection", acMin: 31, wrongTries: 0 },
    { problemSlug: "minimum-platforms", acMin: 74, wrongTries: 1 },
    { problemSlug: "generate-permutations", wrongTries: 1 },
  ] },
  { userId: "usr-student-04", problems: [
    { problemSlug: "activity-selection", acMin: 45, wrongTries: 1 },
    { problemSlug: "minimum-platforms", acMin: 99, wrongTries: 0 },
  ] },
  { userId: "usr-student-05", problems: [
    { problemSlug: "activity-selection", acMin: 27, wrongTries: 0 },
    { problemSlug: "generate-permutations", acMin: 110, wrongTries: 2 },
  ] },
  { userId: "usr-student-06", problems: [
    { problemSlug: "activity-selection", acMin: 38, wrongTries: 0 },
    { problemSlug: "minimum-platforms", acMin: 81, wrongTries: 0 },
  ] },
  { userId: "usr-student-07", problems: [
    { problemSlug: "activity-selection", acMin: 54, wrongTries: 1 },
  ] },
  { userId: "usr-student-08", problems: [
    { problemSlug: "minimum-platforms", acMin: 66, wrongTries: 0 },
  ] },
  { userId: "usr-student-09", problems: [
    { problemSlug: "activity-selection", acMin: 47, wrongTries: 0 },
    { problemSlug: "generate-permutations", acMin: 104, wrongTries: 1 },
  ] },
  { userId: "usr-student-10", problems: [
    { problemSlug: "activity-selection", acMin: 59, wrongTries: 1 },
  ] },
  { userId: "usr-student-11", problems: [
    { problemSlug: "minimum-platforms", acMin: 78, wrongTries: 1 },
  ] },
  { userId: "usr-student-12", problems: [
    { problemSlug: "activity-selection", acMin: 83, wrongTries: 0 },
  ] },
  { userId: "usr-student-14", problems: [
    { problemSlug: "generate-permutations", acMin: 118, wrongTries: 0 },
  ] },
  { userId: "usr-student-15", problems: [
    { problemSlug: "minimum-platforms", acMin: 92, wrongTries: 2 },
  ] },
  { userId: "usr-student-16", problems: [
    { problemSlug: "activity-selection", wrongTries: 1 },
  ] },
  { userId: "usr-student-17", problems: [
    { problemSlug: "activity-selection", acMin: 36, wrongTries: 0 },
    { problemSlug: "minimum-platforms", acMin: 85, wrongTries: 0 },
  ] },
];

const MATHLOGIC_RESULTS: ResultSpec[] = [
  { userId: "usr-student-01", problems: [
    { problemSlug: "prime-check", acMin: 22, wrongTries: 0 },
    { problemSlug: "gcd-lcm", acMin: 41, wrongTries: 0 },
    { problemSlug: "modular-exponentiation", acMin: 95, wrongTries: 1 },
    { problemSlug: "coin-change-dp", acMin: 142, wrongTries: 0 },
  ] },
  { userId: "usr-student-02", problems: [
    { problemSlug: "prime-check", acMin: 18, wrongTries: 0 },
    { problemSlug: "gcd-lcm", acMin: 55, wrongTries: 0 },
    { problemSlug: "modular-exponentiation", acMin: 121, wrongTries: 0 },
  ] },
  { userId: "usr-student-04", problems: [
    { problemSlug: "prime-check", acMin: 26, wrongTries: 1 },
    { problemSlug: "gcd-lcm", acMin: 88, wrongTries: 0 },
    { problemSlug: "modular-exponentiation", wrongTries: 1 },
  ] },
  { userId: "usr-student-06", problems: [
    { problemSlug: "prime-check", acMin: 20, wrongTries: 0 },
    { problemSlug: "gcd-lcm", acMin: 62, wrongTries: 1 },
    { problemSlug: "coin-change-dp", acMin: 160, wrongTries: 1 },
  ] },
  { userId: "usr-student-07", problems: [
    { problemSlug: "prime-check", acMin: 33, wrongTries: 0 },
    { problemSlug: "gcd-lcm", acMin: 74, wrongTries: 0 },
  ] },
  { userId: "usr-student-09", problems: [
    { problemSlug: "prime-check", acMin: 16, wrongTries: 0 },
    { problemSlug: "modular-exponentiation", acMin: 108, wrongTries: 2 },
  ] },
  { userId: "usr-student-10", problems: [
    { problemSlug: "prime-check", acMin: 39, wrongTries: 0 },
    { problemSlug: "gcd-lcm", acMin: 118, wrongTries: 1 },
  ] },
  { userId: "usr-student-12", problems: [
    { problemSlug: "prime-check", acMin: 28, wrongTries: 1 },
    { problemSlug: "gcd-lcm", acMin: 132, wrongTries: 0 },
  ] },
  { userId: "usr-student-15", problems: [
    { problemSlug: "prime-check", acMin: 35, wrongTries: 0 },
    { problemSlug: "gcd-lcm", wrongTries: 1 },
  ] },
  { userId: "usr-student-17", problems: [
    { problemSlug: "prime-check", acMin: 25, wrongTries: 0 },
    { problemSlug: "gcd-lcm", acMin: 66, wrongTries: 0 },
    { problemSlug: "modular-exponentiation", acMin: 150, wrongTries: 1 },
  ] },
  { userId: "usr-student-19", problems: [
    { problemSlug: "prime-check", acMin: 44, wrongTries: 0 },
    { problemSlug: "coin-change-dp", acMin: 168, wrongTries: 1 },
  ] },
  { userId: "usr-student-20", problems: [
    { problemSlug: "prime-check", wrongTries: 1 },
  ] },
];

function isoAt(startsAtIso: string, minutes: number): string {
  return new Date(new Date(startsAtIso).getTime() + minutes * 60 * 1000).toISOString();
}

function buildSubmissions(
  contest: SeedContest,
  results: ResultSpec[],
  idPrefix: string,
  counter: { value: number },
): SeedContestSubmission[] {
  const submissions: SeedContestSubmission[] = [];
  for (const result of results) {
    for (const problem of result.problems) {
      const acMin = problem.acMin;
      for (let w = problem.wrongTries; w >= 1; w--) {
        // Wrong tries spread in the ~20 minutes before the accept.
        const minute = acMin !== undefined ? Math.max(0, acMin - 6 * w) : 55;
        counter.value += 1;
        submissions.push({
          id: `${idPrefix}-${String(counter.value).padStart(3, "0")}`,
          contestSlug: contest.slug,
          userId: result.userId,
          problemSlug: problem.problemSlug,
          language: "cpp",
          code: wrongCodeFor(problem.problemSlug, counter.value),
          verdict: "wrong_answer",
          createdAt: isoAt(contest.startsAt, minute),
          runtimeMs: 3,
          memoryKb: 3100,
        });
      }
      if (acMin !== undefined) {
        counter.value += 1;
        submissions.push({
          id: `${idPrefix}-${String(counter.value).padStart(3, "0")}`,
          contestSlug: contest.slug,
          userId: result.userId,
          problemSlug: problem.problemSlug,
          language: "cpp",
          code: ref(problem.problemSlug),
          verdict: "accepted",
          createdAt: isoAt(contest.startsAt, acMin),
          runtimeMs: 4,
          memoryKb: 3120,
        });
      }
    }
  }
  return submissions;
}

/**
 * Everything the stores need: past + upcoming contests, their judged
 * submission history and participation rows (score/penalty computed with
 * contestScore — the exact rule the live scoreboard uses).
 */
export function buildContestSeeds(now: Date): {
  contests: SeedContest[];
  submissions: SeedContestSubmission[];
  participations: SeedParticipation[];
} {
  const upcoming = makeUpcomingContest(now);
  const counter = { value: 0 };

  const round1Subs = buildSubmissions(INTRA_ROUND_1, ROUND1_RESULTS, "sub-contest", counter);
  const mathSubs = buildSubmissions(MATH_LOGIC_ROUND, MATHLOGIC_RESULTS, "sub-contest", counter);

  const participations: SeedParticipation[] = [];
  const addParticipations = (contest: SeedContest, results: ResultSpec[]): void => {
    const standings = contestScore(
      [...round1Subs, ...mathSubs]
        .filter((s) => s.contestSlug === contest.slug)
        .map((s) => ({
          userId: s.userId,
          problemKey: s.problemSlug,
          verdict: s.verdict,
          createdAt: s.createdAt,
        })),
      contest,
    );
    results.forEach((result, index) => {
      const standing = standings.get(result.userId);
      participations.push({
        contestSlug: contest.slug,
        userId: result.userId,
        // joined shortly after the contest opened
        joinedAt: isoAt(contest.startsAt, 2 + (index % 7)),
        score: standing?.solved ?? 0,
        penalty: standing?.penalty ?? 0,
      });
    });
  };
  addParticipations(INTRA_ROUND_1, ROUND1_RESULTS);
  addParticipations(MATH_LOGIC_ROUND, MATHLOGIC_RESULTS);

  return {
    contests: [INTRA_ROUND_1, MATH_LOGIC_ROUND, upcoming],
    submissions: [...round1Subs, ...mathSubs],
    participations,
  };
}

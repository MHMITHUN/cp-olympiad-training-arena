import type { SeedProblem } from "./problems-basics";

/**
 * Problem bank, second half (paths 06-10 of spec 19.2). The slugs are the
 * agreed contract from src/lib/paths/paths.ts — every slug referenced by
 * paths 06-10 exists here. Same quality bar as the first half: full
 * statement, real constraints, VERIFIED examples (each one checked against
 * the reference solution), progressive hints and a complete editorial.
 *
 * `referenceSolutionsAdvanced` is the single source of truth: the editorial
 * embeds it and the demo sample-run catalog (src/lib/judge/catalog.ts)
 * registers it so Run-on-sample replays only honest recorded outputs.
 *
 * Dates run Feb-Mar 2026, after every basics problem, so createdAt-ascending
 * list order still equals curriculum order.
 */

export const referenceSolutionsAdvanced: Record<string, string> = {
  "activity-selection": `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<pair<long long, long long>> act(n);   // (finish, start)
    for (int i = 0; i < n; i++) {
        long long s, f;
        cin >> s >> f;
        act[i] = {f, s};
    }
    sort(act.begin(), act.end());

    long long lastFinish = -1;
    int count = 0;
    for (auto& [f, s] : act) {
        if (s >= lastFinish) {
            count++;
            lastFinish = f;
        }
    }
    cout << count << "\\n";
    return 0;
}`,
  "minimum-platforms": `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int toMinutes(const string& hhmm) {
    return stoi(hhmm.substr(0, 2)) * 60 + stoi(hhmm.substr(3, 2));
}

int main() {
    int n;
    cin >> n;
    vector<int> arr(n), dep(n);
    for (int i = 0; i < n; i++) {
        string a, d;
        cin >> a >> d;
        arr[i] = toMinutes(a);
        dep[i] = toMinutes(d);
    }
    sort(arr.begin(), arr.end());
    sort(dep.begin(), dep.end());

    int platforms = 0, best = 0;
    size_t i = 0, j = 0;
    while (i < n && j < n) {
        if (arr[i] < dep[j]) {
            platforms++;
            best = max(best, platforms);
            i++;
        } else {
            platforms--;
            j++;
        }
    }
    cout << best << "\\n";
    return 0;
}`,
  "coin-change-greedy": `#include <iostream>
using namespace std;

int main() {
    const long long coins[] = {1000, 500, 100, 50, 20, 10, 5, 2, 1};
    long long t;
    cin >> t;
    int count = 0;
    for (long long c : coins) {
        count += (int)(t / c);
        t %= c;
    }
    cout << count << "\\n";
    return 0;
}`,
  "maximize-salary": `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<string> nums(n);
    for (auto& x : nums) cin >> x;

    sort(nums.begin(), nums.end(), [](const string& a, const string& b) {
        return a + b > b + a;
    });

    string best;
    for (const auto& x : nums) best += x;
    cout << best << "\\n";
    return 0;
}`,
  "print-1-to-n": `#include <iostream>
using namespace std;

void printUpTo(int i, int n) {
    if (i > n) return;          // base case: nothing left to print
    cout << i << "\\n";
    printUpTo(i + 1, n);        // trust the function for the rest
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    cin >> n;
    printUpTo(1, n);
    return 0;
}`,
  "factorial-recursion": `#include <iostream>
using namespace std;

long long factorial(int n) {
    if (n <= 1) return 1;             // base case: 0! = 1! = 1
    return (long long)n * factorial(n - 1);
}

int main() {
    int n;
    cin >> n;
    cout << factorial(n) << "\\n";
    return 0;
}`,
  "tower-of-hanoi": `#include <iostream>
using namespace std;

void hanoi(int n, char from, char to, char via, int& moves) {
    if (n == 0) return;
    hanoi(n - 1, from, via, to, moves);   // move n-1 discs aside
    cout << from << " " << to << "\\n";   // move the largest disc
    moves++;
    hanoi(n - 1, via, to, from, moves);   // bring them back on top
}

int main() {
    int n;
    cin >> n;
    int moves = 0;
    hanoi(n, 'A', 'C', 'B', moves);
    cout << moves << "\\n";
    return 0;
}`,
  "generate-permutations": `#include <iostream>
#include <vector>
using namespace std;

int n;
vector<int> current;
vector<bool> used;

void backtrack() {
    if ((int)current.size() == n) {
        for (int i = 0; i < n; i++)
            cout << current[i] << " \\n"[i == n - 1];
        return;
    }
    for (int value = 1; value <= n; value++) {
        if (used[value]) continue;
        used[value] = true;
        current.push_back(value);
        backtrack();
        current.pop_back();     // undo the choice...
        used[value] = false;    // ...so the next choice starts clean
    }
}

int main() {
    cin >> n;
    used.assign(n + 1, false);
    backtrack();
    return 0;
}`,
  "build-adjacency-list": `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    for (int i = 1; i <= n; i++) {
        sort(adj[i].begin(), adj[i].end());
        for (size_t j = 0; j < adj[i].size(); j++)
            cout << adj[i][j] << " \\n"[j == adj[i].size() - 1];
        if (adj[i].empty()) cout << "\\n";
    }
    return 0;
}`,
  "degree-count": `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<int> degree(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        degree[u]++;
        degree[v]++;
    }
    for (int i = 1; i <= n; i++)
        cout << degree[i] << " \\n"[i == n];
    return 0;
}`,
  "bfs-shortest-path": `#include <iostream>
#include <vector>
#include <queue>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    int s, t;
    cin >> s >> t;

    const int UNVISITED = -1;
    vector<int> dist(n + 1, UNVISITED);
    queue<int> q;
    dist[s] = 0;
    q.push(s);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v : adj[u]) {
            if (dist[v] == UNVISITED) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    cout << dist[t] << "\\n";
    return 0;
}`,
  "connected-components": `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

vector<vector<int>> adj;
vector<bool> visited;
vector<int> component;

void dfs(int u) {
    visited[u] = true;
    component.push_back(u);
    for (int v : adj[u])
        if (!visited[v]) dfs(v);
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, m;
    cin >> n >> m;
    adj.assign(n + 1, {});
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    visited.assign(n + 1, false);
    vector<vector<int>> components;
    for (int u = 1; u <= n; u++) {
        if (visited[u]) continue;
        component.clear();
        dfs(u);
        sort(component.begin(), component.end());
        components.push_back(component);
    }
    sort(components.begin(), components.end());

    cout << components.size() << "\\n";
    for (const auto& comp : components) {
        for (size_t j = 0; j < comp.size(); j++)
            cout << comp[j] << " \\n"[j == comp.size() - 1];
    }
    return 0;
}`,
  "fibonacci-dp": `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> f(max(n + 1, 2));
    f[0] = 0;
    f[1] = 1;
    for (int i = 2; i <= n; i++) f[i] = f[i - 1] + f[i - 2];
    cout << f[n] << "\\n";
    return 0;
}`,
  "climbing-stairs": `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> ways(max(n + 1, 3));
    ways[1] = 1;   // one way: a single 1-step
    ways[2] = 2;   // 1+1 or 2
    for (int i = 3; i <= n; i++) ways[i] = ways[i - 1] + ways[i - 2];
    cout << ways[n] << "\\n";
    return 0;
}`,
  "coin-change-dp": `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int m;
    long long t;
    cin >> m >> t;
    vector<long long> coins(m);
    for (auto& c : coins) cin >> c;

    // dp[amount] = number of combinations (order ignored) paying exactly it.
    vector<long long> dp(t + 1, 0);
    dp[0] = 1;   // one way to pay nothing: choose no coins
    for (long long c : coins) {
        for (long long amount = c; amount <= t; amount++) {
            dp[amount] += dp[amount - c];
        }
    }
    cout << dp[t] << "\\n";
    return 0;
}`,
  "knapsack-small": `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    long long w;
    cin >> n >> w;
    vector<long long> dp(w + 1, 0);   // dp[c] = best value with capacity c
    for (int i = 0; i < n; i++) {
        long long weight, value;
        cin >> weight >> value;
        for (long long cap = w; cap >= weight; cap--) {
            dp[cap] = max(dp[cap], dp[cap - weight] + value);
        }
    }
    cout << dp[w] << "\\n";
    return 0;
}`,
  "a-plus-b-variants": `#include <iostream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    long long a, b;
    while (cin >> a >> b) {   // until end of input
        cout << a + b << "\\n";
    }
    return 0;
}`,
  "multiple-test-cases": `#include <iostream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int t;
    cin >> t;
    while (t--) {
        long long a, b;
        cin >> a >> b;
        cout << a + b << "\\n";
    }
    return 0;
}`,
  "fast-io-basics": `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;

    long long sum = 0, mx = a[0];
    for (long long x : a) {
        sum += x;
        if (x > mx) mx = x;
    }
    cout << sum << " " << mx << "\\n";
    return 0;
}`,
  "precision-output": `#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    int n;
    cin >> n;
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        sum += x;
    }
    double mean = (double)sum / n;
    cout << fixed << setprecision(2) << mean << "\\n";
    return 0;
}`,
};

/** Compose the editorial markdown around the reference solution. */
function editorial(
  approachMd: string,
  slug: string,
  complexityMd: string,
): string {
  return (
    "## Approach\n\n" +
    approachMd +
    "\n\n## Reference solution (C++)\n\n" +
    "```cpp\n" +
    referenceSolutionsAdvanced[slug] +
    "\n```\n\n" +
    "## Complexity\n\n" +
    complexityMd +
    "\n"
  );
}

const starter = (comment: string): string =>
  `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // ${comment}

    return 0;
}`;

// Same coach rotation as the first half; dates Feb-Mar 2026 (after every
// basics problem) keep createdAt order equal to curriculum order.
const AUTHORS = ["usr-teacher-01", "usr-teacher-02", "usr-teacher-03"];
const DATES = [
  "2026-02-17T09:00:00.000Z",
  "2026-02-19T09:00:00.000Z",
  "2026-02-21T09:00:00.000Z",
  "2026-02-23T09:00:00.000Z",
  "2026-02-25T09:00:00.000Z",
  "2026-02-27T09:00:00.000Z",
  "2026-03-01T09:00:00.000Z",
  "2026-03-03T09:00:00.000Z",
  "2026-03-05T09:00:00.000Z",
  "2026-03-07T09:00:00.000Z",
  "2026-03-09T09:00:00.000Z",
  "2026-03-11T09:00:00.000Z",
  "2026-03-13T09:00:00.000Z",
  "2026-03-15T09:00:00.000Z",
  "2026-03-17T09:00:00.000Z",
  "2026-03-19T09:00:00.000Z",
  "2026-03-21T09:00:00.000Z",
  "2026-03-23T09:00:00.000Z",
  "2026-03-25T09:00:00.000Z",
  "2026-03-27T09:00:00.000Z",
];

export const seedProblemsAdvanced: SeedProblem[] = [
  // ---------------- Path 06: Greedy ----------------
  {
    slug: "activity-selection",
    title: "Activity Selection",
    statementMd: `The club room can host only one activity at a time. This week \`n\` activities were requested; activity \`i\` occupies the room from minute \`s_i\` to minute \`f_i\` (finishing exactly at \`f_i\`, so an activity that starts at \`f_i\` can still use the room). Pick the largest possible set of activities that never overlap.

## Input

The first line contains \`n\`. Each of the next \`n\` lines contains two integers \`s_i\` and \`f_i\` — the start and finish minutes of activity \`i\`.

## Output

Print one integer: the maximum number of non-overlapping activities.`,
    difficulty: "medium",
    pathSlug: "greedy",
    topics: ["greedy", "sorting", "intervals"],
    constraintsMd: `- 1 <= n <= 5000.
- 0 <= s_i < f_i <= 10^6.
- Activities that touch at endpoints do NOT overlap: one ending at minute \`t\` and another starting at minute \`t\` can both run.`,
    examples: [
      {
        input: "6\n1 3\n2 5\n4 7\n1 8\n5 9\n8 10",
        output: "3",
        explanation:
          "Take (1,3), (4,7) and (8,10): they only touch at endpoints, never overlap. No set of four is possible.",
      },
      {
        input: "4\n1 2\n2 3\n3 4\n4 5",
        output: "4",
        explanation:
          "Every activity ends exactly when the next starts, so all four fit back to back.",
      },
    ],
    starterCodeCpp: starter("Read the activities and print the maximum non-overlapping count."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Sorting by START time fails: one long activity (1, 1000) would block everything. What ordering leaves the room free as early as possible?",
      "Sort by FINISH time ascending. Walk through and keep an activity whenever its start is at least the last kept finish.",
      "Why is this optimal? Among all optimal solutions, one agrees with the greedy choice for the first activity — exchange the greedy-picked (earliest-finishing) activity into any solution without losing size.",
    ],
    editorialMd: editorial(
      `The greedy rule: repeatedly take the activity that **finishes earliest** among those that still fit. Sorting by finish time and keeping every activity whose start is at least the last kept finish does exactly that. The proof is the classic exchange argument: take any optimal solution and swap its first activity for the earliest-finishing one — the replacement finishes no later, so everything after it still fits, and the size is unchanged. Repeating the argument for each position shows the greedy set is optimal. This "earliest finish first" pattern is the template for a whole family of interval problems.`,
      "activity-selection",
      "Sorting **O(n log n)**, the scan **O(n)**. Memory **O(n)**.",
    ),
    status: "published",
    authorId: AUTHORS[0],
    createdAt: DATES[0],
    solvedCount: 16,
    attemptedCount: 24,
  },
  {
    slug: "minimum-platforms",
    title: "Minimum Platforms",
    statementMd: `The club is helping the city station plan platforms. You know the arrival and departure time of every train today. A train occupies one platform from its arrival until its departure. Find the smallest number of platforms so that no train ever waits.

A platform freed at time \`T\` can immediately receive a train arriving at exactly \`T\`. Every train departs strictly later than it arrives, on the same day.

## Input

The first line contains \`n\`. Each of the next \`n\` lines contains two times in \`HH:MM\` format — the arrival and the departure of train \`i\`.

## Output

Print one integer: the minimum number of platforms needed.`,
    difficulty: "medium",
    pathSlug: "greedy",
    topics: ["greedy", "sorting", "intervals"],
    constraintsMd: `- 1 <= n <= 50000.
- Times are valid \`HH:MM\` values between 00:00 and 23:59, arrival < departure.
- Only the counts matter: two-pointer merging is all you need.`,
    examples: [
      {
        input:
          "6\n09:00 09:20\n09:45 12:00\n09:40 11:00\n09:50 11:45\n11:00 11:30\n18:00 19:00",
        output: "3",
        explanation:
          "Around 09:50 the trains from 09:40, 09:45 and 09:50 are all at the station, so three platforms are simultaneously occupied.",
      },
      {
        input: "3\n10:00 10:20\n10:10 10:15\n10:30 11:00",
        output: "2",
        explanation:
          "At 10:10 two trains overlap; the 10:30 train arrives after the 10:20 departure freed a platform.",
      },
    ],
    starterCodeCpp: starter("Read arrival/departure times and print the minimum platform count."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Convert each HH:MM to minutes since midnight — comparing integers is easier than comparing strings.",
      "Sort arrivals and departures SEPARATELY. Walk both sorted lists with two pointers.",
      "If the next arrival is strictly before the next departure, a train needs a new platform (counter up); otherwise a platform frees (counter down). The answer is the counter's maximum.",
    ],
    editorialMd: editorial(
      `Think of a station attendant watching the day: every arrival occupies a platform, every departure frees one. The maximum simultaneous occupancy is the answer. Sort the arrival list and the departure list independently and sweep both with two pointers: an arrival strictly earlier than the next departure increments the platform counter, otherwise a departure decrements it, and the running maximum is the required count. Sorting arrivals and departures separately is legitimate because we never need to know WHICH train owns a platform — only how many are present. Tie handling (arrival == departure) is decided by the problem statement: a platform freed at \`T\` serves a train arriving at \`T\`, so equality decrements first.`,
      "minimum-platforms",
      "Sorting **O(n log n)**, the sweep **O(n)**. Memory **O(n)**.",
    ),
    status: "published",
    authorId: AUTHORS[1],
    createdAt: DATES[1],
    solvedCount: 15,
    attemptedCount: 23,
  },
  {
    slug: "coin-change-greedy",
    title: "Coin Change (Greedy)",
    statementMd: `The club canteen only accepts exact change. Bangladeshi notes and coins come in the denominations

1, 2, 5, 10, 20, 50, 100, 500, 1000 taka

You must pay exactly \`T\` taka using the fewest notes and coins. With this particular denomination set, always taking the largest note that still fits is provably optimal — your job is to implement it (and, in the editorial, understand why it works here but not everywhere).

## Input

A single integer \`T\` — the amount to pay.

## Output

Print the minimum number of notes and coins that sum to exactly \`T\`.`,
    difficulty: "easy",
    pathSlug: "greedy",
    topics: ["greedy", "math"],
    constraintsMd: `- 1 <= T <= 10^15 — read it as \`long long\`; every intermediate amount also fits.
- The denomination set is fixed by the statement (it is a canonical coin system, so greedy is correct).`,
    examples: [
      { input: "70", output: "2", explanation: "One 50-taka note and one 20-taka note." },
      { input: "8", output: "3", explanation: "5 + 2 + 1 — three coins." },
    ],
    starterCodeCpp: starter("Pay T taka with the fewest notes/coins from the fixed denomination set."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Walk the denominations from largest to smallest; for each, take as many as fit (`count += T / coin; T %= coin`).",
      "Order the array largest-first (or loop it backwards) so no denomination is skipped.",
      "Why is greedy safe here? Each larger coin is a multiple-or-friendly combination of smaller ones (5 = 2+2+1, 10 = 5+5, ...) — see the editorial for the exchange argument, and for a coin set where greedy FAILS.",
    ],
    editorialMd: editorial(
      `Largest-first greedy: for each denomination from 1000 down to 1, take \`T / coin\` coins and reduce \`T\`. This coin system is **canonical** — every amount's optimal solution can be transformed into the greedy one without increasing the coin count (exchange argument: any optimal solution using two or more coins that a single larger coin replaces can be improved or matched, because each denomination is reachable exactly by combinations the next-larger one dominates). The warning every coach repeats: greedy coin change is NOT correct on arbitrary systems — with coins {1, 3, 4} and T = 6, greedy gives 4+1+1 (three coins) while 3+3 is better. On fixed real-world systems (taka, euro, dollars) it is optimal, which is why cash machines can work this way.`,
      "coin-change-greedy",
      "Time **O(9)** — one pass over the fixed denominations. Memory **O(1)**.",
    ),
    status: "published",
    authorId: AUTHORS[2],
    createdAt: DATES[2],
    solvedCount: 18,
    attemptedCount: 26,
  },
  {
    slug: "maximize-salary",
    title: "Maximize the Salary",
    statementMd: `The club won sponsorship money and wants to brag about the biggest possible figure on the notice board. You are given \`n\` numbers; concatenate ALL of them, in some order, to build one giant number. Print the largest number that can be built.

Leading zeros never occur — every given number is at least 1.

## Input

The first line contains \`n\`. The second line contains \`n\` integers \`a_1 ... a_n\`.

## Output

Print the largest number obtainable by concatenating all \`n\` numbers in some order. It may be far too large for any integer type — build it as a string.`,
    difficulty: "medium",
    pathSlug: "greedy",
    topics: ["greedy", "sorting", "strings"],
    constraintsMd: `- 1 <= n <= 1000.
- 1 <= a_i <= 1000.
- The result can have up to 4000 digits: never store it in an integer.`,
    examples: [
      {
        input: "5\n3 30 34 5 9",
        output: "9534330",
        explanation:
          "Order 9, 5, 34, 3, 30. Note 3 before 30 (330 > 303) and 34 before 3 (343 > 334).",
      },
      {
        input: "2\n1 112",
        output: "1121",
        explanation: "112 then 1 gives 1121, which beats 1112.",
      },
    ],
    starterCodeCpp: starter("Concatenate all numbers in the order that builds the largest figure."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Sorting numerically descending fails on (3, 30): 303 < 330. Sorting by length also fails.",
      "The correct comparator asks, for two numbers a and b as STRINGS: does a+b or b+a make the bigger string? Since equal-length numeric strings compare like numbers, this is a valid ordering.",
      "Sort with `[](const string& a, const string& b){ return a + b > b + a; }` and concatenate.",
    ],
    editorialMd: editorial(
      `Treat the numbers as strings and sort them with the comparator "a should come before b iff the string \`a+b\` is greater than \`b+a\`". For equal-length numeric strings lexicographic order equals numeric order, so the comparison is always decisive, and the comparator is a strict weak ordering (transitivity holds because a+b vs b+a is decided by the infinite periodic repetitions of the two strings). An exchange argument finishes the proof: if an optimal ordering ever places b before a while \`a+b > b+a\`, swapping them strictly increases the number — contradiction. This comparator classic appears in interview rounds constantly; remembering "compare the concatenations" solves it in five lines.`,
      "maximize-salary",
      "Sorting with an O(digits) comparator: **O(n log n x d)** where d <= 4. Memory **O(total digits)**.",
    ),
    status: "published",
    authorId: AUTHORS[0],
    createdAt: DATES[3],
    solvedCount: 14,
    attemptedCount: 22,
  },

  // ---------------- Path 07: Recursion & Backtracking ----------------
  {
    slug: "print-1-to-n",
    title: "Print 1 to n by Recursion",
    statementMd: `Print every integer from 1 to \`n\`, one per line — **without any loop** (\`for\`, \`while\`, \`do\`). The judge only checks the output, but the point of this exercise is the recursive leap of faith, so write it recursively.

## Input

A single integer \`n\`.

## Output

Print \`n\` lines: the numbers 1 to \`n\` in ascending order.`,
    difficulty: "easy",
    pathSlug: "recursion-and-backtracking",
    topics: ["recursion", "io"],
    constraintsMd: `- 1 <= n <= 100000.
- The recursion depth equals \`n\`; with small frames this fits the default stack. (If you ever hit the limit, that is a lesson for another day — not here.)`,
    examples: [
      { input: "5", output: "1\n2\n3\n4\n5" },
      { input: "1", output: "1" },
    ],
    starterCodeCpp: starter("Print 1..n recursively, no loops allowed."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Define a function that prints i, then asks itself to print the rest.",
      "Base case: when i > n, return immediately without printing.",
      "The order matters: print BEFORE recursing gives ascending order. Print AFTER the recursive call and you get n down to 1 — a nice experiment.",
    ],
    editorialMd: editorial(
      `The recursive structure every later problem builds on: \`printUpTo(i, n)\` prints \`i\` and delegates the rest to \`printUpTo(i + 1, n)\`; the base case \`i > n\` stops the chain. Notice what we do NOT do: track how deep we are, or plan the unwind. Each call only handles its own number and trusts the next call with the remainder — the "leap of faith" that makes recursive code readable. Also note the output buffering: \`ios_base::sync_with_stdio(false)\` plus \`"\\n"\` keeps 100,000 lines fast, because recursive printing is still n separate output operations.`,
      "print-1-to-n",
      "Time **O(n)**, memory **O(n)** stack frames (about 100,000 at most).",
    ),
    status: "published",
    authorId: AUTHORS[1],
    createdAt: DATES[4],
    solvedCount: 19,
    attemptedCount: 25,
  },
  {
    slug: "factorial-recursion",
    title: "Factorial by Recursion",
    statementMd: `Compute \`n!\` — the product \`1 x 2 x 3 x ... x n\` — using a recursive function, and print the exact value. By convention \`0! = 1\`.

## Input

A single integer \`n\`.

## Output

Print \`n!\` exactly.`,
    difficulty: "easy",
    pathSlug: "recursion-and-backtracking",
    topics: ["recursion", "math"],
    constraintsMd: `- 0 <= n <= 20.
- 20! = 2432902008176640000 fits in a signed 64-bit integer; 21! does not. Read the constraint before choosing the type.`,
    examples: [
      { input: "5", output: "120", explanation: "1 x 2 x 3 x 4 x 5 = 120." },
      { input: "0", output: "1", explanation: "The empty product is 1 by convention." },
      { input: "20", output: "2432902008176640000", explanation: "The largest factorial that fits in long long." },
    ],
    starterCodeCpp: starter("Compute n! recursively and print it exactly."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Definition: n! = n x (n-1)!, and 0! = 1. Translate it literally into a function.",
      "Base case: return 1 when n <= 1.",
      "Cast each multiplication to long long: `(long long)n * factorial(n - 1)` — int x int silently overflows.",
    ],
    editorialMd: editorial(
      `Factorial is the mathematical definition of recursion turned into code: a base case (\`n <= 1\` returns 1) and a self-step (\`n * factorial(n - 1)\`). The unwinding multiplies the values on the way back up. The practical lesson is the data type: 20! is the last factorial inside \`long long\` range, so every intermediate product must be 64-bit — writing \`(long long)n * factorial(n-1)\` guarantees it even though the recursive call already returns \`long long\`. Compare with the trailing-zeros problem on the Number Theory path: there you never need the giant factorial at all, only its factors of 5.`,
      "factorial-recursion",
      "Time **O(n)** multiplications, memory **O(n)** stack frames.",
    ),
    status: "published",
    authorId: AUTHORS[2],
    createdAt: DATES[5],
    solvedCount: 18,
    attemptedCount: 23,
  },
  {
    slug: "tower-of-hanoi",
    title: "Tower of Hanoi",
    statementMd: `Three pegs stand in the club room: **A** (left), **B** (middle) and **C** (right). \`n\` discs of distinct sizes sit on A, largest at the bottom — a proper tower. Move the whole tower to C, one disc at a time, never placing a larger disc on a smaller one.

Print every move, then the total move count.

## Input

A single integer \`n\` — the number of discs.

## Output

Print one move per line as \`<from> <to>\` (peg letters, e.g. \`A C\`). After the moves, print one line with the total number of moves.`,
    difficulty: "medium",
    pathSlug: "recursion-and-backtracking",
    topics: ["recursion", "divide-and-conquer"],
    constraintsMd: `- 1 <= n <= 10.
- The minimum solution has 2^n - 1 moves (at most 1023 lines). Printing more than the minimum will be judged wrong.`,
    examples: [
      {
        input: "2",
        output: "A B\nA C\nB C\n3",
        explanation:
          "Move the small disc to B, the big disc to C, then the small disc onto the big one.",
      },
      { input: "1", output: "A C\n1", explanation: "A single disc moves straight across." },
    ],
    starterCodeCpp: starter("Print the minimum Hanoi move sequence from A to C, then the count."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Think in three phases: move n-1 discs A->B, move disc n A->C, move n-1 discs B->C (using the free peg as helper).",
      "Write a recursive function hanoi(n, from, to, via) that prints those three steps; the base case n == 0 does nothing.",
      "The move count is 2^n - 1: each level doubles the work plus one move. Print it after the recursion finishes (or maintain a counter by reference).",
    ],
    editorialMd: editorial(
      `The classic divide-and-conquer recursion. To move \`n\` discs from \`from\` to \`to\` using \`via\`: move \`n-1\` discs to \`via\` (a smaller instance of the SAME problem, with the peg roles swapped), move disc \`n\` directly to \`to\`, then move the \`n-1\` stack from \`via\` onto \`to\`. The base case \`n == 0\` is the empty move. The recurrence \`T(n) = 2T(n-1) + 1\` solves to \`2^n - 1\`, and the legend of the 64-disc temple tower (about 585 billion years at one move per second) is the standard joke about exponential growth. Notice how the helper peg alternates roles at every level — that parameter juggling is the real skill being trained.`,
      "tower-of-hanoi",
      "Time **O(2^n)** (the output itself is that big). Memory **O(n)** stack depth.",
    ),
    status: "published",
    authorId: AUTHORS[0],
    createdAt: DATES[6],
    solvedCount: 13,
    attemptedCount: 21,
  },
  {
    slug: "generate-permutations",
    title: "Generate All Permutations",
    statementMd: `Generate every permutation of the numbers \`1 ... n\` in lexicographic order, one per line — the traditional first backtracking exercise.

## Input

A single integer \`n\`.

## Output

Print all \`n!\` permutations, each on one line, numbers separated by single spaces, in lexicographic order.`,
    difficulty: "medium",
    pathSlug: "recursion-and-backtracking",
    topics: ["backtracking", "recursion"],
    constraintsMd: `- 1 <= n <= 7.
- 7! = 5040 lines; larger n would explode the output limit, which is itself a lesson about factorial growth.`,
    examples: [
      {
        input: "3",
        output: "1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1",
        explanation: "All 3! = 6 permutations, lexicographically sorted.",
      },
      { input: "1", output: "1" },
    ],
    starterCodeCpp: starter("Print every permutation of 1..n in lexicographic order."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Maintain a partially built answer plus a `used[]` array of which numbers are already placed.",
      "At each depth, try every value from 1 to n that is not used yet: mark it, recurse, then UNMARK it.",
      "Trying values in ascending order automatically yields lexicographic output. (`next_permutation` also works — but write the backtracking version first; it is the template for N-queens, sudokus and every search problem after it.)",
    ],
    editorialMd: editorial(
      `Backtracking in its purest form. The state is a partial permutation plus a \`used\` bitmap; extending means choosing the smallest unused value, recursing, and **undoing** the choice so sibling branches start clean — the undo step is what separates backtracking from blind copying. Ascending value iteration gives lexicographic order for free, and the search tree has exactly \`n!\` leaves. The STL alternative — start from the sorted array and loop \`next_permutation\` until it returns false — is shorter and worth knowing for contests, but the explicit search tree teaches the structure you reuse whenever the objects are not pre-sortable: subsets, boards, matchings.`,
      "generate-permutations",
      "Time **O(n! x n)** (n! permutations, n work each to print). Memory **O(n)** depth.",
    ),
    status: "published",
    authorId: AUTHORS[1],
    createdAt: DATES[7],
    solvedCount: 11,
    attemptedCount: 19,
  },

  // ---------------- Path 08: Graph Basics ----------------
  {
    slug: "build-adjacency-list",
    title: "Build an Adjacency List",
    statementMd: `Every graph problem starts the same way: reading edges into a usable structure. Given an undirected graph, print its adjacency list.

## Input

The first line contains \`n\` and \`m\` — the number of nodes and edges. Each of the next \`m\` lines contains an edge \`u v\` (undirected).

## Output

Print \`n\` lines. Line \`i\` contains the neighbours of node \`i\` in ascending order, separated by single spaces. A node with no neighbours gets an empty line.`,
    difficulty: "easy",
    pathSlug: "graph-basics",
    topics: ["graphs", "io"],
    constraintsMd: `- 1 <= n <= 10^5, 0 <= m <= 2 x 10^5.
- 1 <= u, v <= n; no self-loops, no repeated edges.
- A \`vector<vector<int>>\` of size n+1 is the intended structure.`,
    examples: [
      {
        input: "4 3\n1 2\n2 3\n4 1",
        output: "2 4\n1 3\n2\n1",
        explanation:
          "Node 1 touches 2 and 4; node 2 touches 1 and 3; node 3 only touches 2; node 4 only touches 1.",
      },
      { input: "3 1\n1 3", output: "3\n\n1", explanation: "Node 2 has no neighbours, so its line is empty." },
    ],
    starterCodeCpp: starter("Read an undirected graph and print its adjacency list."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Use `vector<vector<int>> adj(n + 1)` so indices 1..n work directly.",
      "Each undirected edge is stored TWICE: adj[u].push_back(v) and adj[v].push_back(u).",
      "Sort each adjacency vector before printing — judges almost always demand sorted neighbour lists.",
    ],
    editorialMd: editorial(
      `The adjacency list is the default graph representation in contests: node-indexed buckets of neighbours, built in O(n + m) memory, iterating a node's neighbours in its degree. The two details that fail submissions here are structural: store each undirected edge in BOTH buckets, and sort each bucket before printing (or use a set / sorted insertion if the problem streams queries). Compare the alternatives — an adjacency matrix needs O(n^2) memory (10^10 bytes at n = 10^5: instant memory limit exceeded), while edge lists lose the "who is next to u" lookup. Every BFS, DFS and Dijkstra you will ever write starts with these four lines.`,
      "build-adjacency-list",
      "Building **O(n + m)**, sorting all buckets **O(n + m log m)** overall. Memory **O(n + m)**.",
    ),
    status: "published",
    authorId: AUTHORS[2],
    createdAt: DATES[8],
    solvedCount: 17,
    attemptedCount: 24,
  },
  {
    slug: "degree-count",
    title: "Count Node Degrees",
    statementMd: `The degree of a node is the number of edges touching it. For an undirected graph, print the degree of every node.

## Input

The first line contains \`n\` and \`m\`. Each of the next \`m\` lines contains an edge \`u v\` (undirected, no self-loops).

## Output

Print one line with \`n\` integers: the degrees of nodes 1 to \`n\`, space-separated.`,
    difficulty: "easy",
    pathSlug: "graph-basics",
    topics: ["graphs", "counting"],
    constraintsMd: `- 1 <= n <= 10^5, 0 <= m <= 2 x 10^5.
- 1 <= u, v <= n, u != v.
- You never need to store the edges themselves — a counter array is enough.`,
    examples: [
      {
        input: "4 3\n1 2\n2 3\n4 1",
        output: "2 2 1 1",
        explanation: "Nodes 1 and 2 each touch two edges; nodes 3 and 4 touch one each.",
      },
      { input: "5 2\n1 2\n4 5", output: "1 1 0 1 1", explanation: "Node 3 is isolated: degree 0." },
    ],
    starterCodeCpp: starter("Print the degree of every node in an undirected graph."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "An array `degree[n + 1]` starts at zero; each edge bumps BOTH endpoints.",
      "No adjacency list needed — reading an edge and incrementing two counters is the whole algorithm.",
      "Handshake lemma to check yourself: the degree sum equals 2m.",
    ],
    editorialMd: editorial(
      `Degree counting is edge-bookkeeping: each undirected edge contributes exactly one to each endpoint, so a counter array filled while reading input is the complete solution — O(n + m) time, O(n) memory, no graph structure stored. Two classic facts make degrees useful later: the handshake lemma (the sum of all degrees is 2m, so the number of odd-degree nodes is even) and Euler's condition (a cycle through every edge exists iff every degree is even, for a connected graph). When a later problem asks "can this graph have a node of degree n-1 and another of degree 0?", degree bookkeeping is also the argument.`,
      "degree-count",
      "Time **O(n + m)**, memory **O(n)**.",
    ),
    status: "published",
    authorId: AUTHORS[0],
    createdAt: DATES[9],
    solvedCount: 16,
    attemptedCount: 22,
  },
  {
    slug: "bfs-shortest-path",
    title: "BFS Shortest Path",
    statementMd: `In an unweighted graph, the shortest route between two nodes is the one with the fewest edges. Given a graph, a source \`s\` and a target \`t\`, print the number of edges on the shortest path from \`s\` to \`t\` — or \`-1\` if \`t\` is unreachable.

## Input

The first line contains \`n\` and \`m\`. Each of the next \`m\` lines contains an edge \`u v\` (undirected). The last line contains \`s\` and \`t\`.

## Output

Print the minimum edge count from \`s\` to \`t\`, or \`-1\` if no path exists. (When \`s = t\` the answer is 0.)`,
    difficulty: "medium",
    pathSlug: "graph-basics",
    topics: ["graphs", "bfs", "shortest-path"],
    constraintsMd: `- 2 <= n <= 10^5, 0 <= m <= 2 x 10^5.
- 1 <= s, t <= n.
- Every edge has weight 1 — that is exactly the condition under which BFS computes shortest paths.`,
    examples: [
      {
        input: "6 5\n1 2\n1 3\n2 4\n3 5\n5 6\n1 6",
        output: "3",
        explanation: "1 -> 3 -> 5 -> 6 uses three edges; no shorter route exists.",
      },
      { input: "4 2\n1 2\n3 4\n1 4", output: "-1", explanation: "Nodes {1,2} and {3,4} form two separate pieces." },
    ],
    starterCodeCpp: starter("BFS from s; print the edge distance to t or -1."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "BFS explores the graph in rings: distance 0, then all distance-1 nodes, then distance-2 — a plain queue does it.",
      "Store `dist[]` initialised to -1 (doubles as the visited marker). Pop a node, push every unvisited neighbour with dist+1.",
      "Stop early when t comes off the queue, or just run to the end — both are fast enough here.",
    ],
    editorialMd: editorial(
      `BFS visits nodes in order of increasing distance, so the first time a node is discovered, its distance is already final — that single sentence is the correctness proof, and it holds ONLY because all edges cost the same (with weights you need Dijkstra). Implementation: a \`dist\` array initialised to -1 (unvisited), a queue seeded with \`dist[s] = 0\`, and a loop that expands each popped node's unvisited neighbours. Complexity O(n + m) because every node and edge is touched once. The same skeleton, with a \`parent\` array, reconstructs the actual path; run twice on a grid, it is the flood-fill behind maze problems. If BFS is new to you, redraw example 1 as rings around node 1 and watch the algorithm walk into them.`,
      "bfs-shortest-path",
      "Time **O(n + m)**, memory **O(n)** for dist + queue.",
    ),
    status: "published",
    authorId: AUTHORS[1],
    createdAt: DATES[10],
    solvedCount: 12,
    attemptedCount: 20,
  },
  {
    slug: "connected-components",
    title: "Connected Components",
    statementMd: `A social club splits into friend groups: two members are in the same group if some chain of friendships connects them. Given the friendship graph, count the groups and list them.

## Input

The first line contains \`n\` and \`m\`. Each of the next \`m\` lines contains an edge \`u v\` (undirected).

## Output

On the first line print \`k\` — the number of connected components. Then print \`k\` lines: the nodes of each component in ascending order, space-separated, components ordered by their smallest node.`,
    difficulty: "medium",
    pathSlug: "graph-basics",
    topics: ["graphs", "dfs", "connected-components"],
    constraintsMd: `- 1 <= n <= 10^5, 0 <= m <= 2 x 10^5.
- 1 <= u, v <= n.
- Every node appears in exactly one output component — including isolated nodes (their own component).`,
    examples: [
      {
        input: "6 3\n1 2\n2 3\n4 5",
        output: "3\n1 2 3\n4 5\n6",
        explanation: "Three groups: {1,2,3} chained together, {4,5} paired, and 6 alone.",
      },
      {
        input: "4 2\n1 3\n2 4",
        output: "2\n1 3\n2 4",
        explanation: "Two pairs; ordering by smallest node puts 1's group first.",
      },
    ],
    starterCodeCpp: starter("Count and list the connected components."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Scan nodes 1..n; whenever an unvisited node appears, it starts a NEW component.",
      "From that seed, DFS (or BFS) marks everything reachable — that is the whole component.",
      "Collect the visited nodes, sort them, and repeat. Scanning seeds in ascending order automatically lists components by smallest node.",
    ],
    editorialMd: editorial(
      `A connected component is the set of nodes reachable from any one of its members, so the algorithm is a discovery loop: walk the node ids in order, and each unvisited id is the seed of a fresh component — flood out with DFS or BFS to mark it entirely, collect the members, repeat. Every node and edge is processed exactly once (O(n + m) total). Two implementation notes for contests: with n up to 10^5, recursive DFS is fine here but an explicit-stack DFS or BFS removes all stack-depth worry on long path-shaped graphs; and printing components "by smallest node" falls out of seeding the scan in ascending order. Counting components is also the first building block of union-find, which handles edge additions and "are these two connected?" queries in almost-constant time.`,
      "connected-components",
      "Time **O(n + m log n)** (the log is sorting each component for printing). Memory **O(n + m)**.",
    ),
    status: "published",
    authorId: AUTHORS[2],
    createdAt: DATES[11],
    solvedCount: 11,
    attemptedCount: 18,
  },

  // ---------------- Path 09: Dynamic Programming ----------------
  {
    slug: "fibonacci-dp",
    title: "Fibonacci with a Table",
    statementMd: `The naive recursive Fibonacci recomputes the same values billions of times. Fix it with a table. Print \`F(n)\`, where \`F(1) = F(2) = 1\` and \`F(n) = F(n-1) + F(n-2)\`.

## Input

A single integer \`n\`.

## Output

Print \`F(n)\` exactly.`,
    difficulty: "easy",
    pathSlug: "dynamic-programming",
    topics: ["dp", "memoization"],
    constraintsMd: `- 1 <= n <= 90.
- F(90) = 2880067194370816120 fits in a signed 64-bit integer; F(93) would overflow it. Store the table in \`long long\`.`,
    examples: [
      { input: "10", output: "55" },
      { input: "90", output: "2880067194370816120", explanation: "The largest value the constraints allow." },
    ],
    starterCodeCpp: starter("Compute F(n) with a dp table and print it."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Keep an array f[0..n]; fill it bottom-up from the base cases.",
      "Each entry is computed once from the two below it — that is the entire difference from the exponential recursion.",
      "`long long` everywhere: the values themselves are the overflow risk, not the loop index.",
    ],
    editorialMd: editorial(
      `Fibonacci is the canonical overlapping-subproblems example: the naive recursion computes F(n-2) inside F(n) and then AGAIN inside F(n-1), and the call tree doubles at every level (roughly 1.6^n calls for n = 50 — over 20 billion). The fix is a one-dimensional table filled bottom-up: \`f[i] = f[i-1] + f[i-2]\`, each subproblem solved exactly once, O(n) time and O(n) memory (O(1) if you keep only the last two values — the space-optimisation trick every 1-D DP can use). Notice the template being learned: define the subproblems (f[i]), find the transition (sum of two smaller), fix the base cases, choose an evaluation order. Every problem on this path after this one is that template with a different transition.`,
      "fibonacci-dp",
      "Time **O(n)**, memory **O(n)** (or **O(1)** keeping two values).",
    ),
    status: "published",
    authorId: AUTHORS[0],
    createdAt: DATES[12],
    solvedCount: 15,
    attemptedCount: 21,
  },
  {
    slug: "climbing-stairs",
    title: "Climbing Stairs",
    statementMd: `The club staircase has \`n\` steps. From any step you may climb 1 or 2 steps at a time. In how many distinct ways can you reach the top from the ground?

## Input

A single integer \`n\`.

## Output

Print the number of distinct ways to climb \`n\` steps.`,
    difficulty: "easy",
    pathSlug: "dynamic-programming",
    topics: ["dp", "counting"],
    constraintsMd: `- 1 <= n <= 70.
- Ways(70) = 308061521170129 fits comfortably in \`long long\`; count carefully anyway.`,
    examples: [
      {
        input: "3",
        output: "3",
        explanation: "1+1+1, 1+2 and 2+1 — three ways.",
      },
      { input: "10", output: "89" },
    ],
    starterCodeCpp: starter("Count the ways to climb n stairs taking 1 or 2 steps."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Think about the LAST move: you arrived at step n either from n-1 (a 1-step) or from n-2 (a 2-step).",
      "So ways(n) = ways(n-1) + ways(n-2) — Fibonacci in disguise, with different base cases: ways(1) = 1, ways(2) = 2.",
      "Fill a table bottom-up; do not try closed-form tricks.",
    ],
    editorialMd: editorial(
      `The art of DP is finding the decomposition of the FINAL state. The last move into step \`n\` came from step \`n-1\` or \`n-2\`, and those two families of paths are disjoint and cover everything, so \`ways(n) = ways(n-1) + ways(n-2)\` with bases \`ways(1) = 1\`, \`ways(2) = 2\` — Fibonacci shifted by one (ways(n) = F(n+1) in the F(1)=F(2)=1 indexing). Recognising a disguised Fibonacci is a genuine contest skill; stair/path/tile counting problems with two move options almost always reduce to it. The engineering details are the usual ones: \`long long\` (the count grows exponentially) and bottom-up table order so no value is used before it exists.`,
      "climbing-stairs",
      "Time **O(n)**, memory **O(n)** (or **O(1)**).",
    ),
    status: "published",
    authorId: AUTHORS[1],
    createdAt: DATES[13],
    solvedCount: 14,
    attemptedCount: 20,
  },
  {
    slug: "coin-change-dp",
    title: "Coin Change (Count Ways)",
    statementMd: `The greedy coin problem on the Greedy path paid an amount with the fewest notes. Now count instead: given \`m\` coin denominations and a target \`T\`, in how many ways can you pay exactly \`T\` when the ORDER of coins does not matter? (Paying 1+2 is the same way as paying 2+1.)

## Input

The first line contains \`m\` and \`T\`. The second line contains \`m\` distinct denominations (the first of them is always 1, so every amount is payable).

## Output

Print the number of distinct coin COMBINATIONS summing to exactly \`T\`.`,
    difficulty: "medium",
    pathSlug: "dynamic-programming",
    topics: ["dp", "counting"],
    constraintsMd: `- 1 <= m <= 10, 1 <= T <= 1000.
- Denominations are distinct positive integers; the smallest is 1.
- The count fits in \`long long\` for these bounds.`,
    examples: [
      {
        input: "3 4\n1 2 3",
        output: "4",
        explanation: "1+1+1+1, 1+1+2, 2+2 and 1+3.",
      },
      { input: "4 30\n1 5 10 25", output: "18" },
    ],
    starterCodeCpp: starter("Count the unordered ways to pay T with the given coins."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Let dp[a] = number of combinations paying exactly a. Base: dp[0] = 1.",
      "Process ONE coin at a time, updating dp left-to-right — this is what makes order irrelevant.",
      "If you loop amounts outer and coins inner instead, you count ordered sequences (compositions) — 1+2 and 2+1 become different. Same arrays, different answer; understand which loop order you need.",
    ],
    editorialMd: editorial(
      `The loop order IS the algorithm. Processing coins in the outer loop and amounts left-to-right inside means every combination is built with its coins in one canonical order, so each unordered combination is counted exactly once. Swap the loops (amounts outer, coins inner) and the same table counts ordered sequences — for coins {1,2,3} and T=4 that version answers 7, not 4. The recurrence per coin c is \`dp[a] += dp[a - c]\`, reading entries this same coin already updated — precisely what allows using coin c multiple times. This 1-D "unbounded knapsack by coin" pattern, its 0/1 cousin on \`knapsack-small\`, and the loop-order subtlety between them are among the most-tested DP facts in junior contests.`,
      "coin-change-dp",
      "Time **O(m x T)**, memory **O(T)**.",
    ),
    status: "published",
    authorId: AUTHORS[2],
    createdAt: DATES[14],
    solvedCount: 10,
    attemptedCount: 17,
  },
  {
    slug: "knapsack-small",
    title: "0/1 Knapsack",
    statementMd: `The contest goodie bag holds at most \`W\` units of weight. \`n\` items sit on the table; item \`i\` weighs \`w_i\` and is worth \`v_i\`. Take each item at most once (that is the "0/1") and maximise the total value within the capacity.

## Input

The first line contains \`n\` and \`W\`. Each of the next \`n\` lines contains \`w_i\` and \`v_i\`.

## Output

Print the maximum total value of items whose total weight is at most \`W\`.`,
    difficulty: "medium",
    pathSlug: "dynamic-programming",
    topics: ["dp", "knapsack"],
    constraintsMd: `- 1 <= n <= 100, 1 <= W <= 10^4.
- 1 <= w_i <= 1000 (items may be heavier than the whole bag — they are simply never taken), 1 <= v_i <= 10^5.
- The dp table has at most 10^6 cells — exactly the intended size.`,
    examples: [
      {
        input: "4 8\n2 3\n3 4\n4 5\n5 6",
        output: "10",
        explanation: "Take items 2 and 4: weight 3+5 = 8, value 4+6 = 10.",
      },
      {
        input: "5 4\n1 15\n2 25\n3 35\n4 45\n5 60",
        output: "50",
        explanation: "Items 1 and 3: weight 1+3 = 4, value 15+35 = 50 — better than any single item.",
      },
    ],
    starterCodeCpp: starter("Classic 0/1 knapsack: maximise value under weight capacity W."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "State: dp[c] = best value achievable with capacity exactly-at-most c, considering the items processed so far.",
      "Process items one by one; for each, sweep capacity DOWNWARD from W to w_i.",
      "Why downward? Updating upward would let item i be used twice (you would read the entry item i just wrote). Downward reads only pre-item-i values — that single detail makes the knapsack 0/1.",
    ],
    editorialMd: editorial(
      `The 0/1 knapsack is the flagship DP. Define \`dp[c]\` = the best value fillable into capacity \`c\` using the items considered so far; bringing in item \`i\` gives the choice \`dp[c] = max(dp[c], dp[c - w_i] + v_i)\`. The subtlety that names the problem: sweeping \`c\` from high to low means \`dp[c - w_i]\` still describes the state WITHOUT item \`i\`, so each item is taken at most once — sweep upward instead and you get the unbounded knapsack (compare the coin-change problem, where reusing IS allowed and the upward sweep is correct on purpose). n x W = 10^6 cells run instantly. When you later need to know WHICH items were taken, keep the 2-D table and walk backwards through the decisions.`,
      "knapsack-small",
      "Time **O(n x W)**, memory **O(W)** for the 1-D version.",
    ),
    status: "published",
    authorId: AUTHORS[0],
    createdAt: DATES[15],
    solvedCount: 9,
    attemptedCount: 16,
  },

  // ---------------- Path 10: Contest Strategy ----------------
  {
    slug: "a-plus-b-variants",
    title: "A + B (Until EOF)",
    statementMd: `Some judges never tell you how many test cases there are — the input simply ends. Read pairs of integers until end-of-input and print each sum.

This is the survival version of the first program every contestant writes: same arithmetic, but the loop condition is "input still available".

## Input

Zero or more lines, each with two integers \`a\` and \`b\`. The input can stop at any point (possibly with zero pairs).

## Output

For each input pair, print \`a + b\` on its own line.`,
    difficulty: "easy",
    pathSlug: "contest-strategy",
    topics: ["io", "warm-up"],
    constraintsMd: `- 0 <= number of pairs <= 10^5.
- -10^9 <= a, b <= 10^9, so each sum fits in \`long long\` (and in \`int\` only barely — use the safe type).`,
    examples: [
      { input: "1 2\n3 4\n10 -3", output: "3\n7\n7", explanation: "Three pairs arrive, three sums leave." },
      { input: "1000000000 1000000000", output: "2000000000" },
    ],
    starterCodeCpp: starter("Read a b pairs until end of input; print each sum."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "In C++ the stream itself is the loop condition: `while (cin >> a >> b)` is true exactly while a pair can be read.",
      "Never loop on `!cin.eof()` — eof is only set AFTER a failed read, so you process the last line twice.",
      "If a first line announces a count t, you need the other pattern — that is the next problem on this path.",
    ],
    editorialMd: editorial(
      `EOF-driven input is a judge convention you must simply know: when no count is given, the program reads until the stream ends. The C++ idiom \`while (cin >> a >> b)\` converts each read into a boolean — true while both values arrived, false at end of input (or malformed input). The classic bug it prevents: \`while (!cin.eof())\` checks the flag BEFORE the failing read happens, so the final pair is processed twice — a wrong answer that survives every local test with a trailing newline. Pair this with the count-driven \`t\` pattern from the next problem and you can read either judge format without thinking.`,
      "a-plus-b-variants",
      "Time **O(pairs)**; input speed dominates — the fast-io habits from later in this path matter here too.",
    ),
    status: "published",
    authorId: AUTHORS[1],
    createdAt: DATES[16],
    solvedCount: 17,
    attemptedCount: 24,
  },
  {
    slug: "multiple-test-cases",
    title: "Multiple Test Cases",
    statementMd: `Most modern judges pack many cases into one run: a first line announces \`t\`, then \`t\` cases follow. Read them all and answer each.

Here each case is a pair \`a b\`; answer with the sum — but the point is the pattern, which carries every multi-test problem you will meet.

## Input

The first line contains \`t\`. Each of the next \`t\` lines contains two integers \`a\` and \`b\`.

## Output

For each test case, print \`a + b\` on its own line, in input order.`,
    difficulty: "easy",
    pathSlug: "contest-strategy",
    topics: ["io", "warm-up"],
    constraintsMd: `- 1 <= t <= 10^5.
- -10^9 <= a, b <= 10^9 (sums fit in \`long long\`).
- No fancy structure needed — just do not re-read t inside the loop.`,
    examples: [
      { input: "3\n1 2\n5 7\n100 23", output: "3\n12\n123" },
      { input: "1\n-5 5", output: "0" },
    ],
    starterCodeCpp: starter("Read t, then t pairs; print each sum."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Read t once, then `while (t--) { ... }` — the most common contest loop in existence.",
      "With t up to 10^5, endl per line is slow (it flushes every time); print \"\\n\" instead.",
      "The pattern scales: each case may later carry several lines, arrays, even its own sub-cases — read one case fully, answer it, move on.",
    ],
    editorialMd: editorial(
      `The multi-test pattern in its simplest costume. Read the count once, loop \`while (t--)\`, consume exactly one case per iteration, print the answer immediately — no arrays of results needed unless the problem demands batching. The performance notes that matter at t = 10^5: prefer \`"\\n"\` over \`endl\` (which flushes the stream each line and can triple runtime), and set \`sync_with_stdio(false)\` + \`cin.tie(NULL)\` when the case bodies grow (the next problem measures exactly this). Strategically, multi-test rewards a "solve one case cleanly" mindset: wrap the per-case logic in a function and the main loop never changes, whatever the case contains.`,
      "multiple-test-cases",
      "Time **O(t)** per simple case. I/O volume, not computation, is usually the real constraint.",
    ),
    status: "published",
    authorId: AUTHORS[2],
    createdAt: DATES[17],
    solvedCount: 16,
    attemptedCount: 23,
  },
  {
    slug: "fast-io-basics",
    title: "Fast I/O Basics",
    statementMd: `A judge that feeds your program a MILLION numbers punishes slow input before your algorithm even starts. Read \`n\` integers, then print their sum and maximum on one line — fast enough that the input itself is the only real cost.

## Input

The first line contains \`n\`. The second line contains \`n\` integers \`a_1 ... a_n\`.

## Output

Print one line: \`sum max\` — the total sum and the maximum element, separated by a space.`,
    difficulty: "medium",
    pathSlug: "contest-strategy",
    topics: ["io", "performance"],
    constraintsMd: `- 1 <= n <= 10^6.
- -10^9 <= a_i <= 10^9, so the sum can reach 10^15: \`long long\` is mandatory for the sum (and harmless for the values).
- Naive \`cin\` WITH sync_with_stdio left ON can take several seconds for 10^6 numbers; the time limit is 1 second.`,
    examples: [
      { input: "5\n3 1 4 1 5", output: "14 5" },
      { input: "3\n-7 -2 -9", output: "-18 -2", explanation: "All-negative input: the max starts from a real element, never from 0." },
    ],
    starterCodeCpp: starter("Read n numbers fast; print their sum and maximum."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Two lines at the top of main: `ios_base::sync_with_stdio(false); cin.tie(NULL);` — this alone typically speeds cin/cout up by a factor of 5-10.",
      "Sum in `long long`; take the maximum in the same pass (initialise it from the first element, not from 0).",
      "Reading into a vector is fine, but a running sum and max in the read loop avoids storing a million numbers at all.",
    ],
    editorialMd: editorial(
      `Fast I/O is two lines and one habit. \`ios_base::sync_with_stdio(false)\` unties \`cin\`/\`cout\` from the C \`stdio\` buffers (the compatibility sync is what makes naive \`cin\` slow); \`cin.tie(NULL)\` stops \`cin\` from flushing \`cout\` before every read. Together they bring \`cin\`/\`cout\` within touching distance of \`scanf\`/\`printf\` — and they cannot be mixed with C-style I/O afterwards, so pick one family per program. The second lesson hides in the output: the sum of 10^6 values of magnitude 10^9 is about 10^15, far past \`int\`; and a maximum initialised to 0 fails on all-negative data (example 2 exists to catch exactly that). Contests are full of problems where these two details, not the algorithm, decide the verdict.`,
      "fast-io-basics",
      "Time **O(n)** — I/O-bound. Memory **O(1)** with a running sum/max (or **O(n)** if you store the vector).",
    ),
    status: "published",
    authorId: AUTHORS[0],
    createdAt: DATES[18],
    solvedCount: 12,
    attemptedCount: 19,
  },
  {
    slug: "precision-output",
    title: "Precision Output",
    statementMd: `When a judge compares floating-point output, "close enough" means **exactly the requested number of decimal digits** — no more, no less. Read \`n\` integers and print their mean with exactly two digits after the decimal point.

## Input

The first line contains \`n\`. The second line contains \`n\` integers \`a_1 ... a_n\`.

## Output

Print the mean with EXACTLY two decimal digits — \`2.50\`, never \`2.5\` and never \`2.500\`.`,
    difficulty: "easy",
    pathSlug: "contest-strategy",
    topics: ["io", "floating-point"],
    constraintsMd: `- 1 <= n <= 10^6.
- -10^9 <= a_i <= 10^9. Sum first in \`long long\`, divide ONCE as double — never average incrementally in floating point.
- The test data avoids values whose third decimal digit is exactly 5, so honest double rounding is safe here.`,
    examples: [
      { input: "4\n1 2 3 4", output: "2.50", explanation: "Mean 10/4 = 2.5, printed with two digits." },
      { input: "3\n10 4 3", output: "5.67", explanation: "17/3 = 5.6666... rounds to 5.67." },
    ],
    starterCodeCpp: starter("Print the mean with exactly two decimal digits."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Sum the integers in `long long` FIRST; convert to double only for the single final division.",
      "`cout << fixed << setprecision(2) << x` (header `<iomanip>`) prints exactly two decimals.",
      "Check for the classic traps: printing 2.5 instead of 2.50 (missing `fixed`), or averaging incrementally so rounding errors accumulate.",
    ],
    editorialMd: editorial(
      `Two disciplines in one problem. Arithmetic: integer inputs should be accumulated in \`long long\` and converted to floating point exactly once — \`(double)sum / n\`. Every intermediate double operation can inject a tiny error, so the fewer of them, the safer the last-digit rounding. Formatting: \`fixed << setprecision(2)\` pins the output format so the judge's exact-string (or tight-tolerance) comparison succeeds; without \`fixed\`, \`setprecision\` counts SIGNIFICANT digits instead of decimal digits and \`2.5\` stays \`2.5\`. When a problem truly sits on a rounding boundary, contestants add a tiny epsilon or compare with rationals — this problem's data deliberately avoids boundaries, because the lesson being tested is format discipline, not numerics.`,
      "precision-output",
      "Time **O(n)**, memory **O(1)**.",
    ),
    status: "published",
    authorId: AUTHORS[1],
    createdAt: DATES[19],
    solvedCount: 13,
    attemptedCount: 18,
  },
];

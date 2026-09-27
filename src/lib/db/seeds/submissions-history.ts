import type { Verdict } from "../types";
import { referenceSolutionsBasics } from "./problems-basics";

/**
 * Sample submission history for the demo club (judgeMode "seed": rows that
 * came from a real judge when this club ran on Judge0 — the UI labels them
 * "sample" so they are never confused with live demo-mode submissions,
 * which always carry judgeMode "demo" + verdict "recorded", spec 19.5/36).
 *
 * `problemSlug` is resolved to the seeded problem id by the store at seed
 * time, so this file never depends on generated ids.
 */

export interface SeedSubmission {
  id: string;
  userId: string;
  problemSlug: string;
  language: "cpp" | "c";
  code: string;
  verdict: Verdict;
  /** Fixed ISO timestamps, Feb–May 2026, kept in per-student order. */
  createdAt: string;
  runtimeMs?: number;
  memoryKb?: number;
}

/** Accepted rows reuse the editorial's reference solution (realistic). */
const ref = (slug: string): string => referenceSolutionsBasics[slug];

const WA_INT_SUM = `#include <iostream>
using namespace std;

int main() {
    int a, b;               // BUG: int overflows past ~2.1 x 10^9
    cin >> a >> b;
    cout << a + b << "\\n";
    return 0;
}`;

const WA_NO_PRECISION = `#include <iostream>
using namespace std;

int main() {
    long long c;
    cin >> c;
    double f = c * 9.0 / 5.0 + 32.0;
    cout << f << "\\n";     // BUG: judge wants exactly one decimal digit
    return 0;
}`;

const WA_MAX_FROM_ZERO = `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    long long sum = 0, mx = 0;   // BUG: max from 0 breaks all-negative input
    for (auto x : a) { sum += x; if (x > mx) mx = x; }
    cout << sum << " " << mx << "\\n";
    return 0;
}`;

const WA_SQRT_DOUBLE_COUNT = `#include <iostream>
using namespace std;

int main() {
    long long n;
    cin >> n;
    long long count = 0;
    for (long long i = 1; i * i <= n; i++) {
        if (n % i == 0) {
            if (i % 2 == 0) count++;
            if (n / i % 2 == 0) count++;   // BUG: counts i == n/i twice
        }
    }
    cout << count << "\\n";
    return 0;
}`;

const WA_LCM_OVERFLOW = `#include <iostream>
using namespace std;

long long gcd(long long a, long long b) { return b == 0 ? a : gcd(b, a % b); }

int main() {
    long long a, b;
    cin >> a >> b;
    cout << gcd(a, b) << " " << a * b / gcd(a, b) << "\\n";   // BUG: a*b can overflow first
    return 0;
}`;

const TLE_FACTORIAL_LOOP = `#include <iostream>
using namespace std;

int main() {
    long long n;
    cin >> n;
    long long fact = 1;            // BUG: tries to build n! itself (n up to 1e9)
    for (long long i = 2; i <= n; i++) fact *= i;
    long long zeros = 0;
    while (fact % 10 == 0) { zeros++; fact /= 10; }
    cout << zeros << "\\n";
    return 0;
}`;

const CE_MISSING_SEMI = `#include <iostream>
using namespace std;

int main() {
    long long b, e, m;
    cin >> b >> e >> m
    long long result = 1 % m;      // BUG: missing semicolon on the cin line
    while (e > 0) {
        if (e & 1) result = result * b % m;
        b = b * b % m;
        e >>= 1;
    }
    cout << result << "\\n";
    return 0;
}`;

const TLE_LINEAR_PER_QUERY = `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    int q;
    cin >> q;
    while (q--) {
        long long x;
        cin >> x;
        int answer = -1;           // BUG: linear scan per query -> ~10^10 ops
        for (int i = 0; i < n; i++) if (a[i] == x) { answer = i + 1; break; }
        cout << answer << "\\n";
    }
    return 0;
}`;

const WA_SAME_ELEMENT_TWICE = `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    sort(a.rbegin(), a.rend());
    cout << a[0] + a[0] << "\\n";   // BUG: uses a[0] twice - same position!
    return 0;
}`;

const WA_MERGE_DRAIN_BUG = `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    int m;
    cin >> m;
    vector<long long> b(m);
    for (auto &x : b) cin >> x;
    vector<long long> out;
    size_t i = 0, j = 0;
    while (i < a.size() && j < b.size()) {
        if (a[i] <= b[j]) out.push_back(a[i++]);
        else out.push_back(b[j++]);
    }
    while (i < a.size()) out.push_back(a[i++]);   // BUG: forgot to drain b
    for (size_t p = 0; p < out.size(); p++)
        cout << out[p] << " \\n"[p == out.size() - 1];
    return 0;
}`;

const WA_PRIME_INT_I = `#include <iostream>
using namespace std;

int main() {
    long long n;
    cin >> n;
    bool prime = n >= 2;
    for (int i = 2; i * i <= n; i++) {   // BUG: int i — i*i overflows near 10^6
        if (n % i == 0) { prime = false; break; }
    }
    cout << (prime ? "YES" : "NO") << "\\n";
    return 0;
}`;

const TLE_BUBBLE_KTH = `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    for (int i = 0; i < k; i++)              // BUG: k bubble passes —
        for (int j = 0; j + 1 < n; j++)      // O(n^2) at n = 2 x 10^5
            if (a[j] > a[j + 1]) swap(a[j], a[j + 1]);
    cout << a[k - 1] << "\\n";
    return 0;
}`;

export const seedSubmissionsHistory: SeedSubmission[] = [
  // January–February 2026: the basics paths fill up first.
  { id: "sub-seed-001", userId: "usr-student-01", problemSlug: "sum-two-numbers", language: "cpp", code: ref("sum-two-numbers"), verdict: "accepted", createdAt: "2026-01-08T15:02:00.000Z", runtimeMs: 2, memoryKb: 3120 },
  { id: "sub-seed-002", userId: "usr-student-02", problemSlug: "sum-two-numbers", language: "cpp", code: ref("sum-two-numbers"), verdict: "accepted", createdAt: "2026-01-09T10:14:00.000Z", runtimeMs: 2, memoryKb: 3088 },
  { id: "sub-seed-003", userId: "usr-student-03", problemSlug: "sum-two-numbers", language: "cpp", code: WA_INT_SUM, verdict: "wrong_answer", createdAt: "2026-01-10T17:40:00.000Z", runtimeMs: 2, memoryKb: 3096 },
  { id: "sub-seed-004", userId: "usr-student-03", problemSlug: "sum-two-numbers", language: "cpp", code: ref("sum-two-numbers"), verdict: "accepted", createdAt: "2026-01-10T17:52:00.000Z", runtimeMs: 2, memoryKb: 3120 },
  { id: "sub-seed-005", userId: "usr-student-01", problemSlug: "rectangle-area", language: "cpp", code: ref("rectangle-area"), verdict: "accepted", createdAt: "2026-01-11T09:05:00.000Z", runtimeMs: 2, memoryKb: 3056 },
  { id: "sub-seed-006", userId: "usr-student-04", problemSlug: "temperature-convert", language: "cpp", code: WA_NO_PRECISION, verdict: "wrong_answer", createdAt: "2026-01-15T14:22:00.000Z", runtimeMs: 2, memoryKb: 3064 },
  { id: "sub-seed-007", userId: "usr-student-04", problemSlug: "temperature-convert", language: "cpp", code: ref("temperature-convert"), verdict: "accepted", createdAt: "2026-01-15T14:31:00.000Z", runtimeMs: 2, memoryKb: 3088 },
  { id: "sub-seed-008", userId: "usr-student-05", problemSlug: "digit-sum", language: "cpp", code: ref("digit-sum"), verdict: "accepted", createdAt: "2026-01-18T11:00:00.000Z", runtimeMs: 2, memoryKb: 3040 },
  { id: "sub-seed-009", userId: "usr-student-06", problemSlug: "reverse-number", language: "cpp", code: ref("reverse-number"), verdict: "accepted", createdAt: "2026-01-20T16:45:00.000Z", runtimeMs: 2, memoryKb: 3064 },
  { id: "sub-seed-010", userId: "usr-student-02", problemSlug: "palindrome-check", language: "cpp", code: ref("palindrome-check"), verdict: "accepted", createdAt: "2026-01-22T18:10:00.000Z", runtimeMs: 2, memoryKb: 3056 },
  { id: "sub-seed-011", userId: "usr-student-07", problemSlug: "vector-sum-max", language: "cpp", code: WA_MAX_FROM_ZERO, verdict: "wrong_answer", createdAt: "2026-01-26T13:27:00.000Z", runtimeMs: 6, memoryKb: 4720 },
  { id: "sub-seed-012", userId: "usr-student-07", problemSlug: "vector-sum-max", language: "cpp", code: ref("vector-sum-max"), verdict: "accepted", createdAt: "2026-01-26T13:39:00.000Z", runtimeMs: 6, memoryKb: 4736 },
  { id: "sub-seed-013", userId: "usr-student-01", problemSlug: "sort-with-stl", language: "cpp", code: ref("sort-with-stl"), verdict: "accepted", createdAt: "2026-01-27T10:03:00.000Z", runtimeMs: 12, memoryKb: 5210 },
  { id: "sub-seed-014", userId: "usr-student-08", problemSlug: "string-ops", language: "cpp", code: ref("string-ops"), verdict: "accepted", createdAt: "2026-02-01T09:48:00.000Z", runtimeMs: 2, memoryKb: 3064 },

  // February 2026: number theory.
  { id: "sub-seed-015", userId: "usr-student-09", problemSlug: "even-divisors", language: "cpp", code: WA_SQRT_DOUBLE_COUNT, verdict: "wrong_answer", createdAt: "2026-02-04T15:19:00.000Z", runtimeMs: 4, memoryKb: 3064 },
  { id: "sub-seed-016", userId: "usr-student-09", problemSlug: "even-divisors", language: "cpp", code: ref("even-divisors"), verdict: "accepted", createdAt: "2026-02-05T08:56:00.000Z", runtimeMs: 4, memoryKb: 3064 },
  { id: "sub-seed-017", userId: "usr-student-10", problemSlug: "prime-check", language: "cpp", code: ref("prime-check"), verdict: "accepted", createdAt: "2026-02-08T19:31:00.000Z", runtimeMs: 9, memoryKb: 3064 },
  { id: "sub-seed-018", userId: "usr-student-12", problemSlug: "gcd-lcm", language: "cpp", code: ref("gcd-lcm"), verdict: "accepted", createdAt: "2026-02-12T12:12:00.000Z", runtimeMs: 2, memoryKb: 3056 },
  { id: "sub-seed-019", userId: "usr-student-11", problemSlug: "gcd-lcm", language: "cpp", code: WA_LCM_OVERFLOW, verdict: "wrong_answer", createdAt: "2026-02-13T10:41:00.000Z", runtimeMs: 2, memoryKb: 3064 },
  { id: "sub-seed-020", userId: "usr-student-11", problemSlug: "gcd-lcm", language: "cpp", code: ref("gcd-lcm"), verdict: "accepted", createdAt: "2026-02-13T10:58:00.000Z", runtimeMs: 2, memoryKb: 3056 },
  { id: "sub-seed-021", userId: "usr-student-06", problemSlug: "trailing-zeros-easy", language: "cpp", code: ref("trailing-zeros-easy"), verdict: "accepted", createdAt: "2026-02-18T17:09:00.000Z", runtimeMs: 2, memoryKb: 3064 },
  { id: "sub-seed-022", userId: "usr-student-13", problemSlug: "trailing-zeros-easy", language: "cpp", code: TLE_FACTORIAL_LOOP, verdict: "time_limit", createdAt: "2026-02-20T21:15:00.000Z", runtimeMs: 1000, memoryKb: 3104 },
  { id: "sub-seed-023", userId: "usr-student-01", problemSlug: "modular-exponentiation", language: "cpp", code: ref("modular-exponentiation"), verdict: "accepted", createdAt: "2026-02-25T14:02:00.000Z", runtimeMs: 2, memoryKb: 3064 },
  { id: "sub-seed-024", userId: "usr-student-12", problemSlug: "modular-exponentiation", language: "cpp", code: CE_MISSING_SEMI, verdict: "compile_error", createdAt: "2026-02-27T16:26:00.000Z" },
  { id: "sub-seed-025", userId: "usr-student-12", problemSlug: "modular-exponentiation", language: "cpp", code: ref("modular-exponentiation"), verdict: "accepted", createdAt: "2026-02-27T16:34:00.000Z", runtimeMs: 2, memoryKb: 3064 },

  // March 2026: searching and sorting.
  { id: "sub-seed-026", userId: "usr-student-14", problemSlug: "linear-search", language: "cpp", code: ref("linear-search"), verdict: "accepted", createdAt: "2026-03-02T11:47:00.000Z", runtimeMs: 8, memoryKb: 5140 },
  { id: "sub-seed-027", userId: "usr-student-16", problemSlug: "binary-search-basics", language: "cpp", code: TLE_LINEAR_PER_QUERY, verdict: "time_limit", createdAt: "2026-03-06T20:33:00.000Z", runtimeMs: 1000, memoryKb: 5232 },
  { id: "sub-seed-028", userId: "usr-student-16", problemSlug: "binary-search-basics", language: "cpp", code: ref("binary-search-basics"), verdict: "accepted", createdAt: "2026-03-06T20:51:00.000Z", runtimeMs: 18, memoryKb: 5472 },
  { id: "sub-seed-029", userId: "usr-student-05", problemSlug: "max-pair-sum", language: "cpp", code: WA_SAME_ELEMENT_TWICE, verdict: "wrong_answer", createdAt: "2026-03-10T13:08:00.000Z", runtimeMs: 14, memoryKb: 5216 },
  { id: "sub-seed-030", userId: "usr-student-05", problemSlug: "max-pair-sum", language: "cpp", code: ref("max-pair-sum"), verdict: "accepted", createdAt: "2026-03-11T09:22:00.000Z", runtimeMs: 8, memoryKb: 5216 },
  { id: "sub-seed-031", userId: "usr-student-18", problemSlug: "kth-smallest", language: "cpp", code: ref("kth-smallest"), verdict: "accepted", createdAt: "2026-03-15T15:44:00.000Z", runtimeMs: 22, memoryKb: 8210 },
  { id: "sub-seed-032", userId: "usr-student-15", problemSlug: "merge-two-sorted-arrays", language: "cpp", code: ref("merge-two-sorted-arrays"), verdict: "accepted", createdAt: "2026-03-20T10:19:00.000Z", runtimeMs: 26, memoryKb: 9832 },
  { id: "sub-seed-033", userId: "usr-student-17", problemSlug: "merge-two-sorted-arrays", language: "cpp", code: WA_MERGE_DRAIN_BUG, verdict: "wrong_answer", createdAt: "2026-03-22T18:05:00.000Z", runtimeMs: 24, memoryKb: 9800 },
  { id: "sub-seed-034", userId: "usr-student-17", problemSlug: "merge-two-sorted-arrays", language: "cpp", code: ref("merge-two-sorted-arrays"), verdict: "accepted", createdAt: "2026-03-22T18:20:00.000Z", runtimeMs: 25, memoryKb: 9832 },

  // April–May 2026: later members catching up.
  { id: "sub-seed-035", userId: "usr-student-10", problemSlug: "kth-smallest", language: "cpp", code: ref("kth-smallest"), verdict: "accepted", createdAt: "2026-04-02T12:37:00.000Z", runtimeMs: 21, memoryKb: 8196 },
  { id: "sub-seed-036", userId: "usr-student-19", problemSlug: "even-divisors", language: "cpp", code: ref("even-divisors"), verdict: "accepted", createdAt: "2026-04-10T17:52:00.000Z", runtimeMs: 4, memoryKb: 3064 },
  { id: "sub-seed-037", userId: "usr-student-20", problemSlug: "digit-sum", language: "cpp", code: ref("digit-sum"), verdict: "accepted", createdAt: "2026-04-18T09:13:00.000Z", runtimeMs: 2, memoryKb: 3040 },
  { id: "sub-seed-038", userId: "usr-student-15", problemSlug: "prime-check", language: "cpp", code: WA_PRIME_INT_I, verdict: "wrong_answer", createdAt: "2026-05-02T14:29:00.000Z", runtimeMs: 9, memoryKb: 3064 },
  { id: "sub-seed-039", userId: "usr-student-15", problemSlug: "prime-check", language: "cpp", code: ref("prime-check"), verdict: "accepted", createdAt: "2026-05-03T08:41:00.000Z", runtimeMs: 8, memoryKb: 3064 },
  { id: "sub-seed-040", userId: "usr-student-08", problemSlug: "kth-smallest", language: "cpp", code: TLE_BUBBLE_KTH, verdict: "time_limit", createdAt: "2026-05-20T21:02:00.000Z", runtimeMs: 1000, memoryKb: 8210 },
];

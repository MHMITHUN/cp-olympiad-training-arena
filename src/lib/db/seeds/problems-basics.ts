import type { Difficulty, ProblemExample } from "../types";

/**
 * Problem bank, first half (paths 01-05 of spec 19.2). Every problem ships
 * a full statement, real constraints, at least two VERIFIED examples, 2-3
 * progressive hints and a complete editorial with a working reference C++
 * solution — this content quality is the product.
 *
 * `referenceSolutionsBasics` powers the honest demo sample-run catalog
 * (src/lib/judge/catalog.ts): a Run-on-sample only replays recorded output
 * for the exact reference solution, never a fabricated run.
 */

export interface SeedProblem {
  slug: string;
  title: string;
  statementMd: string;
  difficulty: Difficulty;
  pathSlug: string;
  topics: string[];
  constraintsMd: string;
  examples: ProblemExample[];
  starterCodeCpp: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  hints: string[];
  editorialMd: string;
  status: "draft" | "published";
  authorId: string;
  createdAt: string;
  solvedCount: number;
  attemptedCount: number;
}

/** Reference C++ solution per slug — one source of truth for editorial + catalog. */
export const referenceSolutionsBasics: Record<string, string> = {
  "sum-two-numbers": `#include <iostream>
using namespace std;

int main() {
    long long a, b;
    cin >> a >> b;
    cout << a + b << "\\n";
    return 0;
}`,
  "rectangle-area": `#include <iostream>
using namespace std;

int main() {
    long long w, h;
    cin >> w >> h;
    cout << w * h << "\\n";
    return 0;
}`,
  "temperature-convert": `#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    long long c;
    cin >> c;
    double f = c * 9.0 / 5.0 + 32.0;
    cout << fixed << setprecision(1) << f << "\\n";
    return 0;
}`,
  "digit-sum": `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    long long sum = 0;
    for (char ch : s) sum += ch - '0';
    cout << sum << "\\n";
    return 0;
}`,
  "reverse-number": `#include <iostream>
using namespace std;

int main() {
    long long n;
    cin >> n;
    long long r = 0;
    while (n > 0) {
        r = r * 10 + n % 10;
        n /= 10;
    }
    cout << r << "\\n";
    return 0;
}`,
  "palindrome-check": `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    int i = 0, j = (int)s.size() - 1;
    bool ok = true;
    while (i < j) {
        if (s[i] != s[j]) { ok = false; break; }
        i++; j--;
    }
    cout << (ok ? "YES" : "NO") << "\\n";
    return 0;
}`,
  "grade-calc": `#include <iostream>
using namespace std;

int main() {
    int t;
    cin >> t;
    char grade;
    if (t >= 80) grade = 'A';
    else if (t >= 70) grade = 'B';
    else if (t >= 60) grade = 'C';
    else if (t >= 50) grade = 'D';
    else if (t >= 40) grade = 'E';
    else grade = 'F';
    cout << grade << "\\n";
    return 0;
}`,
  "vector-sum-max": `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    long long sum = 0, mx = a[0];
    for (auto x : a) {
        sum += x;
        if (x > mx) mx = x;
    }
    cout << sum << " " << mx << "\\n";
    return 0;
}`,
  "sort-with-stl": `#include <iostream>
#include <vector>
#include <algorithm>
#include <functional>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;

    sort(a.begin(), a.end());
    for (int i = 0; i < n; i++) cout << a[i] << " \\n"[i == n - 1];

    sort(a.begin(), a.end(), greater<long long>());
    for (int i = 0; i < n; i++) cout << a[i] << " \\n"[i == n - 1];
    return 0;
}`,
  "string-ops": `#include <iostream>
#include <string>
using namespace std;

bool isVowel(char c) {
    return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
}

int main() {
    string s;
    cin >> s;
    long long vowels = 0, consonants = 0;
    for (char c : s) {
        if (isVowel(c)) vowels++;
        else consonants++;
    }
    string r(s.rbegin(), s.rend());
    cout << vowels << "\\n" << consonants << "\\n" << r << "\\n";
    return 0;
}`,
  "even-divisors": `#include <iostream>
using namespace std;

int main() {
    long long n;
    cin >> n;
    long long count = 0;
    for (long long i = 1; i * i <= n; i++) {
        if (n % i == 0) {
            if (i % 2 == 0) count++;
            long long other = n / i;
            if (other != i && other % 2 == 0) count++;
        }
    }
    cout << count << "\\n";
    return 0;
}`,
  "prime-check": `#include <iostream>
using namespace std;

int main() {
    long long n;
    cin >> n;
    bool prime = n >= 2;
    for (long long i = 2; i * i <= n; i++) {
        if (n % i == 0) { prime = false; break; }
    }
    cout << (prime ? "YES" : "NO") << "\\n";
    return 0;
}`,
  "gcd-lcm": `#include <iostream>
using namespace std;

long long gcd(long long a, long long b) {
    while (b != 0) {
        long long t = a % b;
        a = b;
        b = t;
    }
    return a;
}

int main() {
    long long a, b;
    cin >> a >> b;
    long long g = gcd(a, b);
    long long l = a / g * b;
    cout << g << " " << l << "\\n";
    return 0;
}`,
  "trailing-zeros-easy": `#include <iostream>
using namespace std;

int main() {
    long long n;
    cin >> n;
    long long zeros = 0;
    for (long long p = 5; p <= n; p *= 5) {
        zeros += n / p;
    }
    cout << zeros << "\\n";
    return 0;
}`,
  "modular-exponentiation": `#include <iostream>
using namespace std;

int main() {
    long long b, e, m;
    cin >> b >> e >> m;
    long long result = 1 % m;
    b %= m;
    while (e > 0) {
        if (e & 1) result = result * b % m;
        b = b * b % m;
        e >>= 1;
    }
    cout << result << "\\n";
    return 0;
}`,
  "linear-search": `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    long long target;
    cin >> target;
    int answer = -1;
    for (int i = 0; i < n; i++) {
        if (a[i] == target) { answer = i + 1; break; }
    }
    cout << answer << "\\n";
    return 0;
}`,
  "binary-search-basics": `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    int q;
    cin >> q;
    while (q--) {
        long long x;
        cin >> x;
        auto it = lower_bound(a.begin(), a.end(), x);
        if (it != a.end() && *it == x) cout << (it - a.begin()) + 1 << "\\n";
        else cout << -1 << "\\n";
    }
    return 0;
}`,
  "max-pair-sum": `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    long long best = a[0], second = a[1];
    if (second > best) swap(best, second);
    for (int i = 2; i < n; i++) {
        if (a[i] > best) { second = best; best = a[i]; }
        else if (a[i] > second) { second = a[i]; }
    }
    cout << best + second << "\\n";
    return 0;
}`,
  "kth-smallest": `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n, k;
    cin >> n >> k;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    nth_element(a.begin(), a.begin() + (k - 1), a.end());
    cout << a[k - 1] << "\\n";
    return 0;
}`,
  "merge-two-sorted-arrays": `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto &x : a) cin >> x;
    int m;
    cin >> m;
    vector<long long> b(m);
    for (auto &x : b) cin >> x;

    vector<long long> merged;
    merged.reserve(n + m);
    size_t i = 0, j = 0;
    while (i < a.size() && j < b.size()) {
        if (a[i] <= b[j]) merged.push_back(a[i++]);
        else merged.push_back(b[j++]);
    }
    while (i < a.size()) merged.push_back(a[i++]);
    while (j < b.size()) merged.push_back(b[j++]);

    for (size_t p = 0; p < merged.size(); p++) {
        cout << merged[p] << " \\n"[p == merged.size() - 1];
    }
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
    referenceSolutionsBasics[slug] +
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

// Author rotation across the three coaches, dates spread Jan-Feb 2026 so the
// library appears in curriculum order (the list page sorts by createdAt).
const AUTHORS = ["usr-teacher-01", "usr-teacher-02", "usr-teacher-03"];
const DATES = [
  "2026-01-06T09:00:00.000Z",
  "2026-01-08T09:00:00.000Z",
  "2026-01-10T09:00:00.000Z",
  "2026-01-12T09:00:00.000Z",
  "2026-01-14T09:00:00.000Z",
  "2026-01-16T09:00:00.000Z",
  "2026-01-20T09:00:00.000Z",
  "2026-01-22T09:00:00.000Z",
  "2026-01-24T09:00:00.000Z",
  "2026-01-26T09:00:00.000Z",
  "2026-01-28T09:00:00.000Z",
  "2026-01-30T09:00:00.000Z",
  "2026-02-01T09:00:00.000Z",
  "2026-02-03T09:00:00.000Z",
  "2026-02-05T09:00:00.000Z",
  "2026-02-07T09:00:00.000Z",
  "2026-02-09T09:00:00.000Z",
  "2026-02-11T09:00:00.000Z",
  "2026-02-13T09:00:00.000Z",
  "2026-02-15T09:00:00.000Z",
];

export const seedProblemsBasics: SeedProblem[] = [
  // ---------------- Path 01: Programming Basics ----------------
  {
    slug: "sum-two-numbers",
    title: "Sum of Two Numbers",
    statementMd: `Every judge journey starts with the simplest possible task: read two integers and print their sum. It looks trivial — and that is the point. A judge checks the exact input format, the exact output format, and nothing else. Learn to be precise here and every later problem gets easier.

## Input

The first and only line of input contains two integers \`a\` and \`b\` separated by a single space.

## Output

Print a single integer: the sum \`a + b\`.`,
    difficulty: "easy",
    pathSlug: "programming-basics",
    topics: ["io", "arithmetic"],
    constraintsMd: `- -1000000000 <= a, b <= 1000000000 (that is, absolute values up to 10^9).
- The sum can reach 2 x 10^9, which does **not** fit in a 32-bit \`int\` (its limit is 2147483647). Use \`long long\`.`,
    examples: [
      { input: "10 20", output: "30", explanation: "10 + 20 = 30." },
      { input: "-5 8", output: "3", explanation: "-5 + 8 = 3; negatives are legal input." },
    ],
    starterCodeCpp: starter("Read two long long values a and b, then print their sum."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Read with `cin >> a >> b` — the stream skips the space automatically.",
      "Declare `a`, `b` and the sum as `long long`, because the sum can pass 2 billion.",
      "Print the number and a newline, nothing else: `cout << a + b << \"\\n\";`",
    ],
    editorialMd: editorial(
      `Read the two values, add them, print. The only trap is the data type: each value fits in a 32-bit \`int\`, but their sum can reach 2 x 10^9, just past \`int\`'s limit of 2147483647. Declaring everything \`long long\` removes the risk at zero cost.`,
      "sum-two-numbers",
      "Time **O(1)**, memory **O(1)**. Input and output dominate the runtime.",
    ),
    status: "published",
    authorId: AUTHORS[0],
    createdAt: DATES[0],
    solvedCount: 27,
    attemptedCount: 34,
  },
  {
    slug: "rectangle-area",
    title: "Rectangle Area",
    statementMd: `The club wants to paint a rectangular display board for the contest wall. The carpenter reports the board's width and height in centimetres; you must tell her how many square centimetres of paint to buy.

## Input

One line with two integers \`w\` and \`h\` — the width and the height of the board.

## Output

Print a single integer: the area of the rectangle.`,
    difficulty: "easy",
    pathSlug: "programming-basics",
    topics: ["io", "arithmetic", "geometry"],
    constraintsMd: `- 1 <= w, h <= 1000.
- The area is at most 10^6, so a plain \`int\` is safe — but \`long long\` never hurts.`,
    examples: [
      { input: "5 10", output: "50" },
      { input: "7 3", output: "21" },
    ],
    starterCodeCpp: starter("Read width w and height h, then print w * h."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "The area of a rectangle is width times height.",
      "Multiply before printing — do not print `w` and `h` separately.",
    ],
    editorialMd: editorial(
      `Multiply the two inputs. With w, h <= 1000 the product is at most a million, comfortably inside \`int\`; using \`long long\` is still good practice for contest muscle memory.`,
      "rectangle-area",
      "Time **O(1)**, memory **O(1)**.",
    ),
    status: "published",
    authorId: AUTHORS[1],
    createdAt: DATES[1],
    solvedCount: 26,
    attemptedCount: 31,
  },
  {
    slug: "temperature-convert",
    title: "Temperature Convert",
    statementMd: `The meteorology office stores daily temperatures in degrees Celsius, but your partner club abroad reports in Fahrenheit. Write the converter using the formula

F = C x 9 / 5 + 32

## Input

A single integer \`C\`: the temperature in degrees Celsius.

## Output

Print the temperature in degrees Fahrenheit with **exactly one digit after the decimal point** — for example \`32.0\`, not \`32\` or \`32.00\`.`,
    difficulty: "easy",
    pathSlug: "programming-basics",
    topics: ["io", "arithmetic", "floating-point"],
    constraintsMd: `- -1000 <= C <= 1000.
- The output must have exactly one decimal digit; use \`fixed\` and \`setprecision(1)\`.`,
    examples: [
      { input: "0", output: "32.0", explanation: "0 x 9/5 + 32 = 32." },
      { input: "37", output: "98.6", explanation: "Human body temperature: 37 x 9/5 + 32 = 98.6." },
      { input: "-40", output: "-40.0", explanation: "The famous point where both scales agree." },
    ],
    starterCodeCpp: starter("Read integer c, compute f = c * 9.0 / 5.0 + 32.0, print with one decimal."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Compute in `double`: `c * 9.0 / 5.0 + 32.0`. Write `9.0`, not `9` — integer division 9/5 gives 1.",
      "For the format: `cout << fixed << setprecision(1) << f << \"\\n\";` (header `<iomanip>`).",
    ],
    editorialMd: editorial(
      `Two tricks in one tiny problem. First, \`9.0 / 5.0\` must be floating-point division — the integer expression \`9 / 5\` collapses to \`1\` and silently ruins every answer. Second, the judge demands one decimal digit, so print with \`fixed << setprecision(1)\`.`,
      "temperature-convert",
      "Time **O(1)**, memory **O(1)**.",
    ),
    status: "published",
    authorId: AUTHORS[2],
    createdAt: DATES[2],
    solvedCount: 24,
    attemptedCount: 33,
  },

  // ---------------- Path 02: Problem Solving ----------------
  {
    slug: "digit-sum",
    title: "Digit Sum",
    statementMd: `The club lottery draws a big natural number \`n\`; members whose ticket's digit sum equals the drawn digit sum win a sticker. Compute the digit sum of \`n\`: add every decimal digit of the number together.

## Input

A single integer \`n\`.

## Output

Print one integer: the sum of the decimal digits of \`n\`.`,
    difficulty: "easy",
    pathSlug: "problem-solving",
    topics: ["digits", "math"],
    constraintsMd: `- 0 <= n <= 10^18.
- 10^18 does not fit in a 32-bit \`int\`. It does fit in \`long long\` — or skip numbers entirely and read it as a \`string\`.`,
    examples: [
      { input: "12345", output: "15", explanation: "1 + 2 + 3 + 4 + 5 = 15." },
      { input: "1000", output: "1", explanation: "1 + 0 + 0 + 0 = 1; zeros add nothing." },
    ],
    starterCodeCpp: starter("Read n (up to 10^18) and print the sum of its decimal digits."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Read `n` as a `string` — then no overflow question exists at all.",
      "A digit character `c` becomes its value with `c - '0'`.",
      "If you prefer arithmetic: `n % 10` is the last digit and `n /= 10` drops it; loop while `n > 0`.",
    ],
    editorialMd: editorial(
      `Treat the input as text: read a \`string\` and add \`c - '0'\` over its characters. This sidesteps every overflow question. The arithmetic version — repeatedly taking \`n % 10\` and dividing \`n\` by 10 — is equally valid with \`long long\` and is worth knowing for problems where n arrives inside a computation rather than as text.`,
      "digit-sum",
      "Time **O(number of digits)** — at most 19. Memory **O(1)**.",
    ),
    status: "published",
    authorId: AUTHORS[0],
    createdAt: DATES[3],
    solvedCount: 22,
    attemptedCount: 29,
  },
  {
    slug: "reverse-number",
    title: "Reverse a Number",
    statementMd: `Read a natural number and print it with its decimal digits reversed. Leading zeros of the reversed value vanish: reversing 1000 produces 1, not 0001 — numbers simply do not store leading zeros.

## Input

A single integer \`n\`.

## Output

Print \`n\` with its digits reversed.`,
    difficulty: "easy",
    pathSlug: "problem-solving",
    topics: ["digits", "math"],
    constraintsMd: `- 0 <= n <= 10^18 — use \`long long\`.
- The reversed value also fits in a signed 64-bit integer.`,
    examples: [
      { input: "12345", output: "54321" },
      { input: "1000", output: "1", explanation: "Reversed digits are 0001, which is just 1." },
    ],
    starterCodeCpp: starter("Read n and print its digits reversed (leading zeros dropped)."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Build the answer with `r = r * 10 + n % 10` inside a loop.",
      "Advance the loop with `n /= 10` and stop when `n` reaches 0.",
      "Why do the leading zeros disappear on their own? 0 * 10 + 0 is still 0 — notice what that means for the input 0 itself.",
    ],
    editorialMd: editorial(
      `The classic digit pump: keep \`r\`, and while n > 0 push its last digit onto r's front (\`r = r * 10 + n % 10\`) and chop it off n (\`n /= 10\`). Leading zeros cost nothing: multiplying zero by ten keeps zero, so reversed 1000 naturally becomes 1. Edge case: for n = 0 the loop never runs and the initial \`r = 0\` prints correctly.`,
      "reverse-number",
      "Time **O(number of digits)**, memory **O(1)**.",
    ),
    status: "published",
    authorId: AUTHORS[1],
    createdAt: DATES[4],
    solvedCount: 21,
    attemptedCount: 30,
  },
  {
    slug: "palindrome-check",
    title: "Palindrome Check",
    statementMd: `A word is a **palindrome** when it reads the same forwards and backwards — like \`level\` or \`racecar\`. Given a lowercase word, decide whether it is a palindrome.

## Input

A single line containing the word \`s\` (lowercase Latin letters only).

## Output

Print \`YES\` if \`s\` is a palindrome, \`NO\` otherwise.`,
    difficulty: "easy",
    pathSlug: "problem-solving",
    topics: ["strings", "two-pointers"],
    constraintsMd: `- 1 <= |s| <= 1000.
- The word consists only of the letters \`a\`–\`z\`; no spaces, no digits.`,
    examples: [
      { input: "level", output: "YES", explanation: "l-e-v-e-l mirrors around the middle v." },
      { input: "world", output: "NO", explanation: "w vs d differ already at the two ends." },
    ],
    starterCodeCpp: starter("Read string s and print YES if it is a palindrome, else NO."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Compare the first character with the last, the second with the second-last, and so on.",
      "Use two indices: `i = 0`, `j = s.size() - 1`, moving them towards each other while `i < j`.",
      "Any mismatch means NO — you can stop immediately.",
    ],
    editorialMd: editorial(
      `Two pointers meet in the middle: compare \`s[i]\` with \`s[j]\`, step i up and j down, and bail out with NO on the first mismatch. The loop runs |s| / 2 comparisons. Reversing the string and comparing (\`s == string(s.rbegin(), s.rend())\`) also works and is one line — but the two-pointer version generalises to arrays and to problems like longest palindromic substring later.`,
      "palindrome-check",
      "Time **O(|s|)**, memory **O(1)**.",
    ),
    status: "published",
    authorId: AUTHORS[2],
    createdAt: DATES[5],
    solvedCount: 23,
    attemptedCount: 28,
  },
  {
    slug: "grade-calc",
    title: "Grade Calculator",
    statementMd: `Club membership exams are scored from 0 to 100 marks. The official grading table is:

- **A** — 80 marks or above
- **B** — 70 to 79 marks
- **C** — 60 to 69 marks
- **D** — 50 to 59 marks
- **E** — 40 to 49 marks
- **F** — below 40 marks

Read one member's marks and print the letter grade.

## Input

A single integer \`t\`: the marks obtained.

## Output

Print exactly one character: the letter grade.`,
    difficulty: "easy",
    pathSlug: "problem-solving",
    topics: ["conditionals", "io"],
    constraintsMd: `- 0 <= t <= 100 — no invalid marks arrive, so no range checking is needed.`,
    examples: [
      { input: "85", output: "A" },
      { input: "70", output: "B", explanation: "70 lands inside 70–79: boundaries belong to the higher band." },
      { input: "39", output: "F", explanation: "One mark short of E." },
    ],
    starterCodeCpp: starter("Read marks t and print the letter grade A/B/C/D/E/F."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "An `if / else if` chain works perfectly — just check from the highest grade downwards.",
      "Each condition is a single `>=` test (e.g. `t >= 80`), because earlier branches already handled bigger values.",
    ],
    editorialMd: editorial(
      `Check the bands top-down with \`if / else if\`: the first matching branch wins, so each condition only needs \`t >=\` the band's lower edge. Checking bottom-up would need two-sided tests like \`t >= 70 && t < 80\` — correct, but noisier. Boundary care: exactly 80 is an A, exactly 39 is an F.`,
      "grade-calc",
      "Time **O(1)**, memory **O(1)**.",
    ),
    status: "published",
    authorId: AUTHORS[0],
    createdAt: DATES[6],
    solvedCount: 25,
    attemptedCount: 27,
  },

  // ---------------- Path 03: STL ----------------
  {
    slug: "vector-sum-max",
    title: "Vector Sum and Max",
    statementMd: `Your first job with the STL \`vector\`: read \`n\` numbers, then report their **sum** and their **maximum** on one line.

## Input

The first line contains an integer \`n\`. The second line contains \`n\` space-separated integers.

## Output

Print two integers separated by a single space: the sum, then the maximum.`,
    difficulty: "easy",
    pathSlug: "stl",
    topics: ["stl", "vectors", "arrays"],
    constraintsMd: `- 1 <= n <= 10^5.
- -10^9 <= a_i <= 10^9.
- The sum can reach 10^14: \`long long\` is mandatory for the accumulator.`,
    examples: [
      { input: "5\n3 1 4 1 5", output: "14 5", explanation: "3+1+4+1+5 = 14; the largest value is 5." },
      { input: "4\n-10 -3 -7 -2", output: "-22 -2", explanation: "All negative: sum -22, maximum is the least negative value." },
    ],
    starterCodeCpp: starter("Read n values into a vector, print their sum then their maximum."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Read into `vector<long long> a(n)` with `for (auto &x : a) cin >> x;`.",
      "Initialise the maximum with the FIRST element — starting from 0 breaks on all-negative input.",
      "Keep the running sum in `long long`; `int` overflows near 2 x 10^9.",
    ],
    editorialMd: editorial(
      `One pass, two accumulators: add every element to a \`long long\` sum and track the maximum seen. The classic bug is initialising the maximum to 0 — with all-negative input the program would wrongly report 0. Seeding from \`a[0]\` (which exists because n >= 1) is safe. \`std::accumulate\` and \`*max_element\` from \`<numeric>\` / \`<algorithm>\` do the same jobs and are worth knowing.`,
      "vector-sum-max",
      "Time **O(n)**, memory **O(n)**.",
    ),
    status: "published",
    authorId: AUTHORS[1],
    createdAt: DATES[7],
    solvedCount: 20,
    attemptedCount: 28,
  },
  {
    slug: "sort-with-stl",
    title: "Sort with the STL",
    statementMd: `Meet \`std::sort\`. Read \`n\` integers and print them twice: sorted **ascending** on the first line, sorted **descending** on the second line.

## Input

The first line contains \`n\`. The second line contains \`n\` space-separated integers.

## Output

Two lines. The first lists the numbers in ascending order, the second in descending order, each separated by single spaces.`,
    difficulty: "easy",
    pathSlug: "stl",
    topics: ["stl", "sorting"],
    constraintsMd: `- 1 <= n <= 10^5.
- -10^9 <= a_i <= 10^9.
- Duplicate values may appear; keep every copy.`,
    examples: [
      { input: "5\n3 1 4 1 5", output: "1 1 3 4 5\n5 4 3 1 1", explanation: "Ascending then descending; both 1s are kept." },
      { input: "3\n-2 7 0", output: "-2 0 7\n7 0 -2" },
    ],
    starterCodeCpp: starter("Read n values, print them ascending then descending."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "`sort(a.begin(), a.end())` sorts ascending in place.",
      "Descending: `sort(a.begin(), a.end(), greater<long long>())` — or sort ascending and print back-to-front.",
      "Print each line's values space-separated, and try not to leave a space after the final number (trailing whitespace is usually tolerated, but be tidy).",
    ],
    editorialMd: editorial(
      `\`std::sort\` is introsort — quicksort that falls back to heapsort on bad pivots — running in O(n log n) worst case. Ascending is the default; descending uses the comparator \`greater<long long>()\`. For printing, index the vector and emit a space before every element except the first of each line.`,
      "sort-with-stl",
      "Time **O(n log n)**, memory **O(n)**.",
    ),
    status: "published",
    authorId: AUTHORS[2],
    createdAt: DATES[8],
    solvedCount: 19,
    attemptedCount: 26,
  },
  {
    slug: "string-ops",
    title: "String Operations",
    statementMd: `Given a lowercase word, produce a three-line report: how many **vowels** it has, how many **consonants**, and the word **reversed**. Vowels are \`a e i o u\`; every other letter in a lowercase word is a consonant.

## Input

A single line containing the word \`s\` (lowercase Latin letters only).

## Output

Three lines:

1. the number of vowels,
2. the number of consonants,
3. the word reversed.`,
    difficulty: "easy",
    pathSlug: "stl",
    topics: ["stl", "strings"],
    constraintsMd: `- 1 <= |s| <= 1000.
- Only letters \`a\`–\`z\` appear, so vowels + consonants = |s|.`,
    examples: [
      { input: "arena", output: "3\n2\nanera", explanation: "Vowels a, e, a; consonants r, n; reversed reads anera." },
      { input: "code", output: "2\n2\nedoc", explanation: "Vowels o, e; consonants c, d." },
    ],
    starterCodeCpp: starter("Read word s; print vowel count, consonant count, and s reversed."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Test a character against all five vowels: `c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'`.",
      "`std::reverse(s.begin(), s.end())` reverses in place — or build `string r(s.rbegin(), s.rend())`.",
      "Three separate lines, in exactly the order: vowels, consonants, reversed word.",
    ],
    editorialMd: editorial(
      `One walk down the string classifies each character (a five-way comparison is plenty for five vowels) and a second copy reversed gives line three. \`std::reverse\` or the reverse-iterator constructor both make the reversed copy in one step.`,
      "string-ops",
      "Time **O(|s|)**, memory **O(|s|)**.",
    ),
    status: "published",
    authorId: AUTHORS[0],
    createdAt: DATES[9],
    solvedCount: 18,
    attemptedCount: 24,
  },

  // ---------------- Path 04: Number Theory ----------------
  {
    slug: "even-divisors",
    title: "Even Divisors",
    statementMd: `A divisor \`d\` of \`n\` is **even** when \`d\` is a multiple of 2. For example 12 has the divisors 1, 2, 3, 4, 6, 12 — four of which (2, 4, 6, 12) are even. Count the even divisors of \`n\`.

## Input

A single integer \`n\`.

## Output

Print the number of even divisors of \`n\`.`,
    difficulty: "medium",
    pathSlug: "number-theory",
    topics: ["number-theory", "math"],
    constraintsMd: `- 1 <= n <= 10^9.
- A loop all the way to n is far too slow — sqrt(n) is at most about 31623, which is instant.`,
    examples: [
      { input: "12", output: "4", explanation: "Even divisors: 2, 4, 6, 12." },
      { input: "7", output: "0", explanation: "7 is odd and its only divisors are 1 and 7 — none even." },
    ],
    starterCodeCpp: starter("Read n and count its even divisors (sqrt loop)."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Divisors arrive in pairs: if `i` divides `n`, so does `n / i`. Only scan `i` up to sqrt(n).",
      "For each divisor found, check BOTH members of the pair for evenness.",
      "When `i * i == n` (a perfect square) the pair is a single divisor — count it once.",
    ],
    editorialMd: editorial(
      `Enumerate i = 1, 2, ... up to sqrt(n). Whenever i divides n, the pair (i, n/i) are both divisors; add 1 for each even one, but when i equals n/i they are the same number and must be counted once. That is O(sqrt n) iterations — at most about 31623 for n up to 10^9.`,
      "even-divisors",
      "Time **O(sqrt n)**, memory **O(1)**.",
    ),
    status: "published",
    authorId: AUTHORS[1],
    createdAt: DATES[10],
    solvedCount: 14,
    attemptedCount: 25,
  },
  {
    slug: "prime-check",
    title: "Prime Check",
    statementMd: `Decide whether a number is prime. A prime has exactly two distinct positive divisors: 1 and itself. By this definition 0 and 1 are **not** prime.

## Input

A single integer \`n\`.

## Output

Print \`YES\` if \`n\` is prime, \`NO\` otherwise.`,
    difficulty: "easy",
    pathSlug: "number-theory",
    topics: ["number-theory", "math", "primes"],
    constraintsMd: `- 0 <= n <= 10^12.
- It is enough to test candidate divisors up to sqrt(n) <= 10^6 — but only with a 64-bit loop variable.`,
    examples: [
      { input: "97", output: "YES", explanation: "97 has no divisor between 2 and 9." },
      { input: "1", output: "NO", explanation: "1 has a single divisor — not prime by definition." },
      { input: "1000000000000", output: "NO", explanation: "10^12 = (10^6)^2, obviously composite." },
    ],
    starterCodeCpp: starter("Read n (up to 10^12) and print YES if prime, else NO."),
    timeLimitMs: 1500,
    memoryLimitMb: 256,
    hints: [
      "Handle n < 2 first: print NO immediately.",
      "Test divisors i = 2, 3, ... while `i * i <= n` — you never need to go past the square root.",
      "`i * i` overflows a 32-bit int near 10^6: make `i` a `long long`.",
    ],
    editorialMd: editorial(
      `Trial division up to sqrt(n): if n factors as a x b with both factors above sqrt(n), their product would exceed n — contradiction, so a composite number always exposes a divisor no larger than its square root. With n up to 10^12 the loop runs at most a million iterations, fine within the limit. The loop variable must be \`long long\`; otherwise \`i * i\` overflows exactly in this range and the loop can misbehave.`,
      "prime-check",
      "Time **O(sqrt n)** — up to 10^6 divisions. Memory **O(1)**.",
    ),
    status: "published",
    authorId: AUTHORS[2],
    createdAt: DATES[11],
    solvedCount: 21,
    attemptedCount: 30,
  },
  {
    slug: "gcd-lcm",
    title: "GCD and LCM",
    statementMd: `For two positive integers \`a\` and \`b\`, print their **greatest common divisor** and their **least common multiple**, separated by a space.

## Input

One line with two integers \`a\` and \`b\`.

## Output

Print two integers separated by a single space: gcd(a, b) then lcm(a, b).`,
    difficulty: "easy",
    pathSlug: "number-theory",
    topics: ["number-theory", "math"],
    constraintsMd: `- 1 <= a, b <= 10^9.
- lcm(a, b) <= 10^18, which fits in a signed 64-bit integer.`,
    examples: [
      { input: "12 18", output: "6 36", explanation: "gcd(12,18) = 6; lcm = 12 x 18 / 6 = 36." },
      { input: "5 7", output: "1 35", explanation: "Coprime numbers: gcd 1, lcm their product." },
    ],
    starterCodeCpp: starter("Read a and b; print gcd then lcm."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Euclid's algorithm: gcd(a, b) = gcd(b, a mod b), repeating until b is 0.",
      "lcm(a, b) = a x b / gcd(a, b) — but compute a / gcd FIRST, then multiply.",
      "a * b can reach 10^18 before dividing: still fine in long long, but `a / g * b` never even gets close to overflowing.",
    ],
    editorialMd: editorial(
      `Euclid: gcd(a, b) = gcd(b, a mod b) until the second argument hits zero — about O(log min(a, b)) steps. Then lcm = (a / g) x b. Dividing before multiplying keeps every intermediate comfortably inside 64-bit range. C++17's \`std::gcd\` / \`std::lcm\` from \`<numeric>\` are equivalent.`,
      "gcd-lcm",
      "Time **O(log min(a, b))**, memory **O(1)**.",
    ),
    status: "published",
    authorId: AUTHORS[0],
    createdAt: DATES[12],
    solvedCount: 22,
    attemptedCount: 29,
  },
  {
    slug: "trailing-zeros-easy",
    title: "Trailing Zeros of a Factorial",
    statementMd: `The **factorial** of n is the product 1 x 2 x ... x n, written \`n!\`. Count how many zeros sit at the **end** of \`n!\`'s decimal representation. With n up to a billion, \`n!\` itself has billions of digits — do not try to compute it.

## Input

A single integer \`n\`.

## Output

Print the number of trailing zeros of \`n!\`.`,
    difficulty: "medium",
    pathSlug: "number-theory",
    topics: ["number-theory", "math", "factorials"],
    constraintsMd: `- 0 <= n <= 10^9.
- Computing \`n!\` directly is impossible at this range — count prime factors instead.`,
    examples: [
      { input: "10", output: "2", explanation: "10! = 3628800 — two zeros at the end." },
      { input: "25", output: "6", explanation: "25 = 5 x 5 contributes two factors of 5; total 5s = 6, so 6 zeros." },
    ],
    starterCodeCpp: starter("Read n and count the trailing zeros of n! without computing it."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Each trailing zero is a factor 10 = 2 x 5 inside n!.",
      "Factors of 2 are far more plentiful than factors of 5, so the 5s decide the count.",
      "Legendre's formula: the exponent of 5 in n! is floor(n/5) + floor(n/25) + floor(n/125) + ... — stop when the power of 5 passes n.",
    ],
    editorialMd: editorial(
      `A trailing zero is one factor of ten, i.e. one pair (2, 5). Inside n! the twos outnumber the fives massively, so the answer is the exponent of 5 in n!'s factorisation. Count multiples of 5 (each contributes one 5), of 25 (one extra), of 125, and so on: floor(n/5) + floor(n/25) + floor(n/125) + ... The sum has at most log_5 n terms — 13 terms for n = 10^9. Keep the power variable in \`long long\`; the last term can overshoot 10^9 before the loop ends.`,
      "trailing-zeros-easy",
      "Time **O(log n)**, memory **O(1)**.",
    ),
    status: "published",
    authorId: AUTHORS[1],
    createdAt: DATES[13],
    solvedCount: 15,
    attemptedCount: 27,
  },
  {
    slug: "modular-exponentiation",
    title: "Modular Exponentiation",
    statementMd: `Compute \`b^e mod m\`. The true value of \`b^e\` can have billions of digits, so it must never be built — every multiplication happens modulo \`m\`.

## Input

One line with three integers \`b\`, \`e\` and \`m\`.

## Output

Print \`b^e mod m\`.`,
    difficulty: "medium",
    pathSlug: "number-theory",
    topics: ["number-theory", "math", "modular-arithmetic"],
    constraintsMd: `- 1 <= b <= 10^9.
- 0 <= e <= 10^18 — read it as \`long long\`.
- 2 <= m <= 10^9.
- Note b^0 = 1, so the answer for e = 0 is 1 mod m = 1.`,
    examples: [
      { input: "2 10 1000", output: "24", explanation: "2^10 = 1024 and 1024 mod 1000 = 24." },
      { input: "3 4 5", output: "1", explanation: "3^4 = 81 = 16 x 5 + 1." },
      { input: "7 0 13", output: "1", explanation: "Anything to the power 0 is 1." },
    ],
    starterCodeCpp: starter("Read b, e, m; print b^e mod m with fast exponentiation."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Repeated squaring: b^e = (b^(e/2))^2 when e is even, and that times b when e is odd.",
      "Reduce modulo m after EVERY multiplication — never hold a product bigger than m^2.",
      "Both operands stay below 10^9, so each product fits in long long (10^18 < 9.2 x 10^18).",
    ],
    editorialMd: editorial(
      `Binary exponentiation writes e in binary and squares b once per bit: start \`result = 1\`, and while e > 0, multiply result by b whenever the lowest bit of e is 1, then square b and shift e right. Exactly log2(e) <= 60 iterations, each doing one or two modular multiplications. All values stay below 10^9, so every product fits in \`long long\` — no \`__int128\` needed.`,
      "modular-exponentiation",
      "Time **O(log e)** — at most 60 squarings. Memory **O(1)**.",
    ),
    status: "published",
    authorId: AUTHORS[2],
    createdAt: DATES[14],
    solvedCount: 16,
    attemptedCount: 26,
  },

  // ---------------- Path 05: Searching & Sorting ----------------
  {
    slug: "linear-search",
    title: "Linear Search",
    statementMd: `The workhorse of all searching: given an array and a target value \`x\`, find the **first position** (counting from 1) where \`x\` occurs, or report that it never does.

## Input

The first line contains \`n\`. The second line contains \`n\` space-separated integers. The third line contains the target \`x\`.

## Output

Print the 1-based index of the first occurrence of \`x\`, or \`-1\` if \`x\` does not appear.`,
    difficulty: "easy",
    pathSlug: "searching-and-sorting",
    topics: ["searching", "arrays"],
    constraintsMd: `- 1 <= n <= 10^5.
- -10^9 <= a_i, x <= 10^9.
- Values may repeat; report the earliest index.`,
    examples: [
      { input: "6\n4 8 15 16 23 42\n15", output: "3", explanation: "15 first appears at position 3." },
      { input: "6\n4 8 15 16 23 42\n99", output: "-1", explanation: "99 is not in the array." },
    ],
    starterCodeCpp: starter("Read array and target x; print 1-based first index or -1."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Walk the array left to right with index i (0-based).",
      "The moment a[i] == x, print i + 1 and stop — later copies are irrelevant.",
      "If the loop finishes without a hit, print -1.",
    ],
    editorialMd: editorial(
      `Scan left to right; the first equality wins. n up to 10^5 makes one scan instant. Linear search needs no sorted input, which is exactly why it stays useful even after you learn binary search — the next problem shows what sortedness buys you.`,
      "linear-search",
      "Time **O(n)**, memory **O(n)**.",
    ),
    status: "published",
    authorId: AUTHORS[0],
    createdAt: DATES[15],
    solvedCount: 24,
    attemptedCount: 29,
  },
  {
    slug: "binary-search-basics",
    title: "Binary Search Basics",
    statementMd: `The array is sorted in non-decreasing order and may contain duplicates. For each query value \`x\`, find the **first** (smallest) 1-based position where \`x\` occurs, or report \`-1\`.

## Input

The first line contains \`n\`. The second line contains \`n\` integers in non-decreasing order. The third line contains \`q\`, the number of queries. Each of the following \`q\` lines contains one query value \`x\`.

## Output

For each query, print one line: the first 1-based index of \`x\`, or \`-1\`.`,
    difficulty: "medium",
    pathSlug: "searching-and-sorting",
    topics: ["searching", "binary-search"],
    constraintsMd: `- 1 <= n, q <= 10^5.
- -10^9 <= a_i, x <= 10^9.
- A linear scan per query is about 10^10 operations — far too slow. Each query must run in O(log n).`,
    examples: [
      { input: "6\n1 3 5 7 9 11\n3\n7\n4\n1", output: "4\n-1\n1", explanation: "7 sits at position 4; 4 is absent; 1 opens the array." },
      { input: "5\n2 2 2 5 8\n2\n2\n8", output: "1\n5", explanation: "Duplicates: the FIRST 2 is at position 1, and 8 is last." },
    ],
    starterCodeCpp: starter("Read sorted array and q queries; answer each with first index or -1."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "`lower_bound(a.begin(), a.end(), x)` returns an iterator to the first element >= x.",
      "If that iterator is a.end() or points at a value different from x, x is absent: print -1.",
      "The 1-based index is `it - a.begin() + 1`. Also add the fast-I/O two lines — 10^5 queries punish slow output.",
    ],
    editorialMd: editorial(
      `Each query is one \`lower_bound\` — binary search for the first element >= x. If it lands inside the array and equals x, that position is the first occurrence (exactly what duplicates demand); otherwise x never appears. Total O((n + q) log n). Use \`sync_with_stdio(false)\` and \`cin.tie(NULL)\`: with 10^5 queries, slow I/O alone can cause a time-limit verdict.`,
      "binary-search-basics",
      "Time **O((n + q) log n)**, memory **O(n)**.",
    ),
    status: "published",
    authorId: AUTHORS[1],
    createdAt: DATES[16],
    solvedCount: 17,
    attemptedCount: 28,
  },
  {
    slug: "max-pair-sum",
    title: "Maximum Pair Sum",
    statementMd: `From the array, choose two elements at **different positions** so that their sum is as large as possible, and print that sum. Equal values at different positions may both be chosen — two 9s make 18.

## Input

The first line contains \`n\` (at least 2). The second line contains \`n\` space-separated integers.

## Output

Print the maximum a_i + a_j over all pairs of different positions.`,
    difficulty: "easy",
    pathSlug: "searching-and-sorting",
    topics: ["arrays", "greedy"],
    constraintsMd: `- 2 <= n <= 10^5.
- -10^9 <= a_i <= 10^9, so the answer can reach 2 x 10^9: print it as \`long long\`.`,
    examples: [
      { input: "5\n1 5 3 9 9", output: "18", explanation: "The two 9s occupy different positions: 9 + 9 = 18." },
      { input: "4\n-10 -3 -5 -1", output: "-4", explanation: "Best pair is -1 + -3 = -4 — with all negatives, the two least negative win." },
    ],
    starterCodeCpp: starter("Read n values; print the largest sum of two different positions."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "The best pair is always the two largest values in the array.",
      "Track best and second-best in ONE left-to-right pass.",
      "Initialise both from the first two elements (order them first!) — not from 0.",
    ],
    editorialMd: editorial(
      `The answer is always (largest) + (second largest): swapping either pick for something smaller cannot help. One pass keeps the two biggest values seen — move the old best down to second when a new value beats it, otherwise replace second only when the value beats second alone. Sorting also works but costs O(n log n) for no benefit. The all-negative example punishes anyone initialising from 0.`,
      "max-pair-sum",
      "Time **O(n)**, memory **O(n)** (a running pair would need only **O(1)**).",
    ),
    status: "published",
    authorId: AUTHORS[2],
    createdAt: DATES[17],
    solvedCount: 19,
    attemptedCount: 26,
  },
  {
    slug: "kth-smallest",
    title: "K-th Smallest",
    statementMd: `Order statistics: among \`n\` numbers (duplicates counted separately), print the \`k\`-th smallest one. For the array \`7 1 5 2 9 4\` the sorted order is \`1 2 4 5 7 9\`, so the 3rd smallest is 4.

## Input

The first line contains two integers \`n\` and \`k\`. The second line contains \`n\` space-separated integers.

## Output

Print the \`k\`-th smallest value of the array.`,
    difficulty: "medium",
    pathSlug: "searching-and-sorting",
    topics: ["sorting", "searching"],
    constraintsMd: `- 1 <= n <= 2 x 10^5.
- 1 <= k <= n — k is always valid, no check needed.
- -10^9 <= a_i <= 10^9.`,
    examples: [
      { input: "6 3\n7 1 5 2 9 4", output: "4", explanation: "Sorted: 1 2 4 5 7 9 — the third is 4." },
      { input: "5 2\n10 -3 7 7 0", output: "0", explanation: "Sorted: -3 0 7 7 10 — the second is 0 (duplicates keep their slots)." },
    ],
    starterCodeCpp: starter("Read n, k and the array; print the k-th smallest value."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Simplest correct approach: sort the array, answer a[k-1].",
      "Reading n and k off one line: `cin >> n >> k` handles the space for you.",
      "Faster for the curious: `nth_element(a.begin(), a.begin()+k-1, a.end())` places the k-th smallest exactly at index k-1 in O(n) average time.",
    ],
    editorialMd: editorial(
      `Sort and index — O(n log n), trivially correct, plenty fast for n up to 2 x 10^5. The STL also offers \`nth_element\`, which partially reorders the vector so position k-1 holds exactly the k-th smallest; it runs in average O(n) and is the tool of choice when only one order statistic is needed.`,
      "kth-smallest",
      "Sorting **O(n log n)** / nth_element **O(n)** average. Memory **O(n)**.",
    ),
    status: "published",
    authorId: AUTHORS[0],
    createdAt: DATES[18],
    solvedCount: 18,
    attemptedCount: 25,
  },
  {
    slug: "merge-two-sorted-arrays",
    title: "Merge Two Sorted Arrays",
    statementMd: `The heart of merge sort: two arrays, each already sorted in non-decreasing order, must become one sorted array containing every element (duplicates kept).

## Input

The first line contains \`n\`. The second line contains \`n\` integers in non-decreasing order. The third line contains \`m\`. The fourth line contains \`m\` integers in non-decreasing order.

## Output

Print \`n + m\` integers on a single line: all values merged into non-decreasing order, space-separated.`,
    difficulty: "medium",
    pathSlug: "searching-and-sorting",
    topics: ["sorting", "two-pointers"],
    constraintsMd: `- 1 <= n, m <= 10^5, so n + m <= 2 x 10^5.
- -10^9 <= a_i, b_i <= 10^9.
- Both input arrays are already sorted — use that fact; do not re-sort everything.`,
    examples: [
      { input: "3\n1 5 9\n4\n2 3 8 10", output: "1 2 3 5 8 9 10" },
      { input: "2\n4 4\n3\n1 4 6", output: "1 4 4 4 6", explanation: "All three 4s survive the merge." },
    ],
    starterCodeCpp: starter("Read both sorted arrays and print them merged into one sorted line."),
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    hints: [
      "Two indices i and j start at the fronts of the arrays.",
      "Repeatedly append whichever front value is smaller (ties: take from the first array), advancing only that index.",
      "When one array empties, copy the rest of the other as-is.",
    ],
    editorialMd: editorial(
      `Classic two-pointer merge: compare the two current fronts, emit the smaller, advance that pointer; then drain whichever array still has elements. Each element is appended exactly once, so the work is O(n + m) — asymptotically better than concatenating and re-sorting, and it is precisely the merge step inside merge sort. The tie rule (take from the first array on equality) makes the merge **stable**, matching merge sort's behaviour.`,
      "merge-two-sorted-arrays",
      "Time **O(n + m)**, memory **O(n + m)**.",
    ),
    status: "published",
    authorId: AUTHORS[1],
    createdAt: DATES[19],
    solvedCount: 17,
    attemptedCount: 24,
  },
];

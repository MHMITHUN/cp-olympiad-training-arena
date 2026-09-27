# Learning Paths — the Club Curriculum

CP Arena organizes its 40-problem bank into **ten learning paths** (spec
19.2), each a small, finishable set of problems in a recommended solve
order. Paths 01–05 are deliberately beginner-friendly for school-level
members; paths 06–10 carry the standard competitive-programming canon.

This document is the **coach-facing pacing plan**: how to walk the paths
across one school-club semester (14 teaching weeks + contest week), and what
each path's problems train.

---

## Semester pacing at a glance

Assume the standard club format: **one 90-minute session per week**, members
solve 2–4 problems per week (the on-site problem plus homework).

| Weeks | Paths | Theme | Milestone for members |
| ----- | ----- | ----- | --------------------- |
| 1–2 | 01 Programming Basics | first submissions | 3 accepted solves |
| 3–4 | 02 Problem Solving | digit/string craft | first medium problem attempted |
| 5–6 | 03 STL | vectors, sort, strings | comfortable with `vector` + `sort` |
| 7–8 | 04 Number Theory | olympiad arithmetic | GCD/LCM + primality fluency |
| 9 | 05 Searching & Sorting | binary search | `lower_bound` mental model |
| 10–11 | 06 Greedy | exchange arguments | can state WHY a greedy is correct |
| 12 | 07 Recursion & Backtracking | trust the recursion | first backtracking problem |
| 13 | 08 Graph Basics | BFS/DFS | shortest path on a grid/graph |
| 14 | 09 Dynamic Programming | tables over recursion | knapsack solved unaided |
| 15 | 10 Contest Strategy + **club contest** | I/O craft | first live round |

Real clubs stretch: paths 07–09 easily become a second semester. The
ordering matters more than the calendar — DP before graphs works too, but
greedy *after* sorting/STL and *before* DP is the sequence that best matches
how contest problems decompose.

**Weekly session shape (90 min):** 15 min warm-up re-read of last week's
editorials → 10 min coach intro of the week's idea (one path section) →
45 min solve one path problem on-site → 20 min editorial walk-through →
homework: the remaining path problems.

---

## Path 01 — Programming Basics

*Start here after school-level C or the first ICT programming chapter.*

| # | Problem | Difficulty | Trains |
| - | ------- | ---------- | ------ |
| 1 | Sum of Two Numbers (`sum-two-numbers`) | easy | `cin`/`cout`, exact output format |
| 2 | Rectangle Area (`rectangle-area`) | easy | integer types, units in output |
| 3 | Temperature Convert (`temperature-convert`) | easy | floating-point output formatting |

Pacing: weeks 1–2. Everyone should finish this path in the first two weeks;
if a member cannot, pair them with a senior before moving on.

## Path 02 — Problem Solving

| # | Problem | Difficulty | Trains |
| - | ------- | ---------- | ------ |
| 1 | Digit Sum (`digit-sum`) | easy | peeling digits off a number |
| 2 | Reverse a Number (`reverse-number`) | easy | accumulation loops, trailing zeros |
| 3 | Palindrome Check (`palindrome-check`) | easy | two-pointer comparison |
| 4 | Grade Calculator (`grade-calc`) | easy | boundary tables, YES/NO patterns |

Pacing: weeks 3–4. The grade-table problem is the week-4 on-site problem —
boundary conditions are the lesson.

## Path 03 — STL

| # | Problem | Difficulty | Trains |
| - | ------- | ---------- | ------ |
| 1 | Vector Sum and Max (`vector-sum-max`) | easy | `vector`, `long long` overflow |
| 2 | Sort with the STL (`sort-with-stl`) | easy | `sort`, custom comparators |
| 3 | String Operations (`string-ops`) | easy | `std::string` methods |

Pacing: weeks 5–6. Emphasize: 100,000 numbers summed in `int` is the classic
overflow demo (`vector-sum-max` is built for exactly that moment).

## Path 04 — Number Theory

| # | Problem | Difficulty | Trains |
| - | ------- | ---------- | ------ |
| 1 | Even Divisors (`even-divisors`) | medium | √n divisor enumeration |
| 2 | Prime Check (`prime-check`) | easy | trial division bound |
| 3 | GCD and LCM (`gcd-lcm`) | easy | Euclid's algorithm |
| 4 | Trailing Zeros of a Factorial (`trailing-zeros-easy`) | medium | counting factors of 5 |
| 5 | Modular Exponentiation (`modular-exponentiation`) | medium | fast power, mod arithmetic |

Pacing: weeks 7–8. This is the Informatics-Olympiad heart of the first
semester — spend the extra week here rather than rushing to sorting.

## Path 05 — Searching & Sorting

| # | Problem | Difficulty | Trains |
| - | ------- | ---------- | ------ |
| 1 | Linear Search (`linear-search`) | easy | the baseline everyone must beat |
| 2 | Binary Search Basics (`binary-search-basics`) | medium | invariants, `lower_bound` |
| 3 | Maximum Pair Sum (`max-pair-sum`) | easy | one-pass max-two selection |
| 4 | K-th Smallest (`kth-smallest`) | medium | sort-then-index vs. quickselect |
| 5 | Merge Two Sorted Arrays (`merge-two-sorted-arrays`) | medium | the merge step of merge sort |

Pacing: week 9. Binary search is the single most-reused idea in the second
half of the curriculum — do not skip the invariant discussion.

## Path 06 — Greedy

| # | Problem | Difficulty | Trains |
| - | ------- | ---------- | ------ |
| 1 | Activity Selection (`activity-selection`) | medium | the canonical exchange argument |
| 2 | Minimum Platforms (`minimum-platforms`) | medium | event sweep-line thinking |
| 3 | Coin Change (Greedy) (`coin-change-greedy`) | easy | when greedy works — and when it doesn't |
| 4 | Maximize the Salary (`maximize-salary`) | medium | comparator design |

Pacing: weeks 10–11. Club rule: a member may not submit a greedy solution
until they can say the one-sentence argument for why it is correct.

## Path 07 — Recursion & Backtracking

| # | Problem | Difficulty | Trains |
| - | ------- | ---------- | ------ |
| 1 | Print 1 to n by Recursion (`print-1-to-n`) | easy | base case + recursive step |
| 2 | Factorial by Recursion (`factorial-recursion`) | easy | return-value accumulation |
| 3 | Tower of Hanoi (`tower-of-hanoi`) | medium | trust the sub-call |
| 4 | Generate All Permutations (`generate-permutations`) | medium | choose–explore–un-choose |

Pacing: week 12. Permutations is the first problem where the *undo step*
matters — walk it on the whiteboard slowly.

## Path 08 — Graph Basics

| # | Problem | Difficulty | Trains |
| - | ------- | ---------- | ------ |
| 1 | Build an Adjacency List (`build-adjacency-list`) | easy | graph representation |
| 2 | Count Node Degrees (`degree-count`) | easy | adjacency bookkeeping |
| 3 | BFS Shortest Path (`bfs-shortest-path`) | medium | queue + distance array |
| 4 | Connected Components (`connected-components`) | medium | DFS/BFS over unvisited nodes |

Pacing: week 13. No fancy algorithms — representation and traversal fluency
are the whole goal.

## Path 09 — Dynamic Programming

| # | Problem | Difficulty | Trains |
| - | ------- | ---------- | ------ |
| 1 | Fibonacci with a Table (`fibonacci-dp`) | easy | overlapping subproblems, memo vs. table |
| 2 | Climbing Stairs (`climbing-stairs`) | easy | counting paths |
| 3 | Coin Change (Count Ways) (`coin-change-dp`) | medium | state = amount; loop order matters |
| 4 | 0/1 Knapsack (`knapsack-small`) | medium | two-dimensional state, the DP template |

Pacing: week 14 (often spills into a second semester). Contrast
`coin-change-greedy` (path 06) with `coin-change-dp` — same story, correct
engine.

## Path 10 — Contest Strategy

| # | Problem | Difficulty | Trains |
| - | ------- | ---------- | ------ |
| 1 | A + B (Until EOF) (`a-plus-b-variants`) | easy | EOF-driven input loops |
| 2 | Multiple Test Cases (`multiple-test-cases`) | easy | the `t`-cases pattern |
| 3 | Fast I/O Basics (`fast-io-basics`) | medium | `sync_with_stdio(false)`, 10^6 numbers |
| 4 | Precision Output (`precision-output`) | easy | `fixed` + `setprecision` |

Pacing: week 15, immediately before the club contest. These four habits are
what separate "solved it" from "solved it in contest".

---

## How the arena supports the pacing

- **Path pages** (`/paths/<slug>`) list each path's problems in the exact
  recommended order above, with per-problem solve rates.
- **Hints (2–3 per problem)** let a stuck member take one nudge instead of
  reading the answer; the **editorial** stays locked behind an explicit
  "I want to see the editorial" click.
- **Draft problems** let coaches prepare next week's set without students
  seeing it — publish when the week arrives.
- The **coach dashboard** (`/coach`) shows which paths the club is actually
  grinding (topic coverage) so a coach can re-order weeks based on real
  submission data.

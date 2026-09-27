import type { Path } from "@/lib/db/types";

/**
 * The ten learning paths (spec 19.2), in curriculum order.
 *
 * `problemSlugs` lists the recommended solve order. Paths 01-05 reference
 * problems from seeds/problems-basics.ts; paths 06-10 reference problems
 * from the second half of the problem bank (seeds/problems-advanced.ts —
 * the slugs below are the agreed contract between both files).
 * Path pages render a problem link only for slugs that exist in the store,
 * so the paths stay presentable even if a problem is still a draft.
 */

export const PATH_SLUGS = [
  "programming-basics",
  "problem-solving",
  "stl",
  "number-theory",
  "searching-and-sorting",
  "greedy",
  "recursion-and-backtracking",
  "graph-basics",
  "dynamic-programming",
  "contest-strategy",
] as const;

export type PathSlug = (typeof PATH_SLUGS)[number];

export const learningPaths: Path[] = [
  {
    slug: "programming-basics",
    order: 1,
    title: "Programming Basics",
    descriptionMd:
      "Start here if you just finished school-level C or your first ICT programming chapter. These problems only need `cin`/`cout`, simple arithmetic and careful reading — the exact habits every contest starter needs. By the end you can read a problem, pick the right data type, and print output in exactly the format the judge expects.",
    problemSlugs: ["sum-two-numbers", "rectangle-area", "temperature-convert"],
  },
  {
    slug: "problem-solving",
    order: 2,
    title: "Problem Solving",
    descriptionMd:
      "Classic warm-up problems that train the thinking step between reading a statement and writing code. You will break numbers and strings apart digit by digit, handle edge cases like trailing zeros, and practise the YES/NO and grade-table patterns that appear in every beginner contest.",
    problemSlugs: [
      "digit-sum",
      "reverse-number",
      "palindrome-check",
      "grade-calc",
    ],
  },
  {
    slug: "stl",
    order: 3,
    title: "STL",
    descriptionMd:
      "The C++ Standard Template Library is the biggest practical advantage C++ gives a competitive programmer. Meet `vector`, `sort`, `string` and the loops that make them shine. These problems show how much code the STL writes for you — and how to keep the sum of 100,000 numbers from overflowing.",
    problemSlugs: ["vector-sum-max", "sort-with-stl", "string-ops"],
  },
  {
    slug: "number-theory",
    order: 4,
    title: "Number Theory",
    descriptionMd:
      "Divisors, primes, GCD/LCM and modular arithmetic — the heart of Informatics Olympiad number problems. Learn the square-root trick for testing divisibility, why factor-of-5 counting beats multiplying a huge factorial, and fast exponentiation for when powers grow past every integer type.",
    problemSlugs: [
      "even-divisors",
      "prime-check",
      "gcd-lcm",
      "trailing-zeros-easy",
      "modular-exponentiation",
    ],
  },
  {
    slug: "searching-and-sorting",
    order: 5,
    title: "Searching & Sorting",
    descriptionMd:
      "Half of contest problem solving is putting data in order and finding things in it fast. Compare a linear scan against binary search, learn what `lower_bound` really returns, pick the two largest values in one pass, and merge sorted sequences like merge sort does.",
    problemSlugs: [
      "linear-search",
      "binary-search-basics",
      "max-pair-sum",
      "kth-smallest",
      "merge-two-sorted-arrays",
    ],
  },
  {
    slug: "greedy",
    order: 6,
    title: "Greedy",
    descriptionMd:
      "Greedy problems reward a crisp argument more than a long program: prove that always taking the best local choice gives the best global answer, then code it in a few lines. These classics — activity selection, platforms, coins and salary building — are the standard interview-and-olympiad set.",
    problemSlugs: [
      "activity-selection",
      "minimum-platforms",
      "coin-change-greedy",
      "maximize-salary",
    ],
  },
  {
    slug: "recursion-and-backtracking",
    order: 7,
    title: "Recursion & Backtracking",
    descriptionMd:
      "Think in terms of the smallest step and trust the function to handle the rest. Start with counting and printing by recursion, move to the Tower of Hanoi classic, then generate full permutations — your first real backtracking with an undo step.",
    problemSlugs: [
      "print-1-to-n",
      "factorial-recursion",
      "tower-of-hanoi",
      "generate-permutations",
    ],
  },
  {
    slug: "graph-basics",
    order: 8,
    title: "Graph Basics",
    descriptionMd:
      "Graphs are just things connected by links, and BFS/DFS are the two ways to walk them. Build adjacency lists, count degrees, find shortest paths in unit-weight graphs and split a graph into connected components — the vocabulary every graph problem is written in.",
    problemSlugs: [
      "build-adjacency-list",
      "degree-count",
      "bfs-shortest-path",
      "connected-components",
    ],
  },
  {
    slug: "dynamic-programming",
    order: 9,
    title: "Dynamic Programming",
    descriptionMd:
      "Dynamic programming is recursion plus a memory: solve each subproblem once, store it, reuse it. Begin with Fibonacci and climbing stairs to see overlapping subproblems, then apply the same table to coin change and the 0/1 knapsack — the template behind hundreds of contest problems.",
    problemSlugs: [
      "fibonacci-dp",
      "climbing-stairs",
      "coin-change-dp",
      "knapsack-small",
    ],
  },
  {
    slug: "contest-strategy",
    order: 10,
    title: "Contest Strategy",
    descriptionMd:
      "The final path is not a topic — it is the craft of scoring well: reading several test cases off one input, keeping I/O fast enough for 10^6 numbers, printing floats to the exact required precision, and checking boundary cases before submitting. Master these and your first live contest will feel familiar.",
    problemSlugs: [
      "a-plus-b-variants",
      "multiple-test-cases",
      "fast-io-basics",
      "precision-output",
    ],
  },
];

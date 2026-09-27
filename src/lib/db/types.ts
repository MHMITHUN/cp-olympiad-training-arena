import { z } from "zod";

/**
 * Zod schemas + inferred TypeScript types for every collection.
 * MongoStore parses documents at the boundary with these schemas;
 * DemoStore produces values that already satisfy them.
 */

export const RoleSchema = z.enum(["ADMIN", "TEACHER", "STUDENT"]);
export type Role = z.infer<typeof RoleSchema>;

/** Handle regex: lowercase letters, digits, underscores (CP judge style). */
export const HANDLE_PATTERN = /^[a-z0-9_]+$/;

export const UserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  /** scrypt$<salt-hex>$<hash-hex> — see src/lib/auth/password.ts */
  passwordHash: z.string().min(1),
  role: RoleSchema,
  /** Unique display name shown on the leaderboard and in contests. */
  handle: z
    .string()
    .min(3)
    .max(20)
    .regex(HANDLE_PATTERN),
  createdAt: z.string(), // ISO date, e.g. "2026-01-05T09:00:00.000Z"
});
export type User = z.infer<typeof UserSchema>;
/** User shape safe to send to the client. */
export type PublicUser = Omit<User, "passwordHash">;

export const DifficultySchema = z.enum(["easy", "medium", "hard"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const ContentStatusSchema = z.enum(["draft", "published"]);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

export const ProblemExampleSchema = z.object({
  input: z.string(),
  output: z.string(),
  explanation: z.string().optional(),
});
export type ProblemExample = z.infer<typeof ProblemExampleSchema>;

export const ProblemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  /** Full problem statement in Markdown. */
  statementMd: z.string(),
  difficulty: DifficultySchema,
  /** Learning path this problem belongs to (Path.slug). */
  pathSlug: z.string().min(1),
  /** Free-form topic tags, e.g. ["arrays", "two-pointers"]. */
  topics: z.array(z.string()),
  constraintsMd: z.string(),
  examples: z.array(ProblemExampleSchema),
  starterCodeCpp: z.string(),
  timeLimitMs: z.number().int().positive(),
  memoryLimitMb: z.number().int().positive(),
  /** 2-3 progressive hints (each reveals more than the previous). */
  hints: z.array(z.string()),
  /** Full editorial in Markdown - revealed on demand, never by default. */
  editorialMd: z.string(),
  status: ContentStatusSchema,
  authorId: z.string(),
  createdAt: z.string(),
  solvedCount: z.number().int().min(0),
  attemptedCount: z.number().int().min(0),
});
export type Problem = z.infer<typeof ProblemSchema>;

export const PathSchema = z.object({
  slug: z.string().min(1),
  /** Sort order across the 10 learning paths (1 = first). */
  order: z.number().int().positive(),
  title: z.string().min(1),
  descriptionMd: z.string(),
  /** Ordered problem slugs - the recommended solve order. */
  problemSlugs: z.array(z.string()),
});
export type Path = z.infer<typeof PathSchema>;

export const LanguageSchema = z.enum(["cpp", "c"]);
export type Language = z.infer<typeof LanguageSchema>;

export const VerdictSchema = z.enum([
  "accepted",
  "wrong_answer",
  "time_limit",
  "runtime_error",
  "compile_error",
  /**
   * Demo judge mode: no real verdict exists. The submission is stored for
   * teacher review and the UI labels it honestly (spec 19.5 / 36).
   */
  "recorded",
]);
export type Verdict = z.infer<typeof VerdictSchema>;

export const JudgeModeSchema = z.enum(["judge0", "demo", "seed"]);
export type JudgeMode = z.infer<typeof JudgeModeSchema>;

export const SubmissionSchema = z.object({
  id: z.string().min(1),
  problemId: z.string().min(1),
  userId: z.string().min(1),
  language: LanguageSchema,
  code: z.string(),
  verdict: VerdictSchema,
  judgeMode: JudgeModeSchema,
  runtimeMs: z.number().int().min(0).optional(),
  memoryKb: z.number().int().min(0).optional(),
  createdAt: z.string(),
  /** Present when the submission was made inside a contest. */
  contestId: z.string().optional(),
});
export type Submission = z.infer<typeof SubmissionSchema>;

export const ContestSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  descriptionMd: z.string(),
  /** ISO date strings so both stores keep a comparable shape. */
  startsAt: z.string(),
  endsAt: z.string(),
  durationMinutes: z.number().int().positive(),
  problemSlugs: z.array(z.string()),
  rulesMd: z.string(),
  status: ContentStatusSchema,
  createdBy: z.string(),
});
export type Contest = z.infer<typeof ContestSchema>;

export const ParticipationSchema = z.object({
  id: z.string().min(1),
  contestId: z.string().min(1),
  userId: z.string().min(1),
  joinedAt: z.string(),
  /** Problems solved in the contest. */
  score: z.number().int().min(0),
  /** Accumulated penalty minutes (transparent leaderboard rule, spec 19.7). */
  penalty: z.number().int().min(0),
});
export type Participation = z.infer<typeof ParticipationSchema>;

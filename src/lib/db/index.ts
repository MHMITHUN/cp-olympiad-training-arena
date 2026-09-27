import type {
  Role,
  User,
  Problem,
  Path,
  Submission,
  Contest,
  Participation,
  ContentStatus,
  Difficulty,
  ProblemExample,
} from "./types";
import { DemoStore } from "./demo-store";
import { MongoStore } from "./mongo";

/**
 * Dual-mode data layer.
 *
 * - MONGODB_URI unset  -> DemoStore (in-memory, lazily seeded, resets on
 *   server restart). Good for club demos; every UI honestly labels it.
 * - MONGODB_URI set    -> MongoStore (mongodb driver) backed by the
 *   database named by MONGODB_DB_NAME (default "cp_arena").
 *
 * EXTENDING THIS INTERFACE (for later chunks): add the method signature
 * here first, then implement it in BOTH DemoStore and MongoStore. Keep the
 * methods domain-level (e.g. listPublished(filters) rather than raw
 * collection access) so both stores stay swappable and Mongo documents are
 * always zod-parsed at the boundary.
 */

/** Paged result shape used by problem listings. */
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListProblemsFilters {
  difficulty?: Difficulty;
  pathSlug?: string;
  /** Matches problems whose topics array contains this topic. */
  topic?: string;
  /** Case-insensitive search over title and slug. */
  q?: string;
  page?: number;
  pageSize?: number;
  /**
   * Personal status filter for signed-in students (applied INSIDE the store
   * so pagination stays honest):
   * - "solved"   — at least one accepted submission by this user
   * - "attempted" — submitted but never accepted
   * - "untried"  — no submissions at all
   */
  status?: "solved" | "attempted" | "untried";
  /** Required when `status` is set; ignored otherwise. */
  userId?: string;
}

/** Input shape for creating a problem (id/createdAt/counters are store-made). */
export interface CreateProblemInput {
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
  status: ContentStatus;
  authorId: string;
  /** Initial counters (demo/seed data only); default 0. */
  solvedCount?: number;
  attemptedCount?: number;
}

export type UpdateProblemInput = Partial<Omit<CreateProblemInput, "slug">>;

/** Input shape for creating a contest. */
export interface CreateContestInput {
  slug: string;
  title: string;
  descriptionMd: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  problemSlugs: string[];
  rulesMd: string;
  status: ContentStatus;
  createdBy: string;
}

export type UpdateContestInput = Partial<Omit<CreateContestInput, "slug">>;

export interface RecordSubmissionInput {
  problemId: string;
  userId: string;
  language: Submission["language"];
  code: string;
  verdict: Submission["verdict"];
  judgeMode: Submission["judgeMode"];
  runtimeMs?: number;
  memoryKb?: number;
  contestId?: string;
}

/** Submission joined with the problem fields list pages need. */
export interface SubmissionWithProblem extends Submission {
  problemSlug: string;
  problemTitle: string;
  problemDifficulty: Difficulty;
}

export interface Store {
  // ---- users -------------------------------------------------------------
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  /** Public profile lookup by display handle. */
  findByHandle(handle: string): Promise<User | null>;
  /** Unique-handle check; pass excludeUserId for profile updates. */
  isHandleTaken(handle: string, excludeUserId?: string): Promise<boolean>;
  /** Student self-registration (role is always STUDENT, spec: club reality). */
  createByRegister(input: {
    name: string;
    email: string;
    handle: string;
    passwordHash: string;
  }): Promise<User>;
  listByRole(role?: Role): Promise<User[]>;

  // ---- problems ------------------------------------------------------------
  /** Published problems only, filtered + paged for the public list page. */
  listPublished(filters?: ListProblemsFilters): Promise<Paged<Problem>>;
  /** Every problem, drafts included - coach/admin views only. */
  listAll(): Promise<Problem[]>;
  /**
   * Single problem by slug INCLUDING drafts. Callers guard visibility:
   * drafts are only served to TEACHER/ADMIN (spec: public browsing without
   * login shows published content only).
   */
  getBySlug(slug: string): Promise<Problem | null>;
  createProblem(input: CreateProblemInput): Promise<Problem>;
  updateProblem(id: string, patch: UpdateProblemInput): Promise<Problem | null>;
  setProblemStatus(id: string, status: ContentStatus): Promise<Problem | null>;
  /** Counters for the public solve/attempt stats. */
  incAttempted(slug: string): Promise<void>;
  incSolved(slug: string): Promise<void>;
  /** Distinct topics across published problems, alphabetically — filter chips. */
  listTopics(): Promise<string[]>;

  // ---- submissions ----------------------------------------------------------
  recordSubmission(input: RecordSubmissionInput): Promise<Submission>;
  /** Newest first, joined with problem slug/title/difficulty. */
  listSubmissionsByUser(userId: string): Promise<SubmissionWithProblem[]>;
  /** Newest first - a problem's submission feed. */
  listSubmissionsByProblem(problemId: string): Promise<Submission[]>;
  /** Newest first - every submission tagged with a contest (scoreboard). */
  listSubmissionsByContest(contestId: string): Promise<Submission[]>;
  /** Newest first - coach review views. */
  listAllSubmissions(): Promise<Submission[]>;

  // ---- paths -----------------------------------------------------------------
  /** All learning paths in curriculum order. */
  listPaths(): Promise<Path[]>;
  getPathBySlug(slug: string): Promise<Path | null>;

  // ---- contests ----------------------------------------------------------------
  /** Published contests, newest first. */
  listPublishedContests(): Promise<Contest[]>;
  /** Contest by slug INCLUDING drafts; callers guard visibility. */
  getContestBySlug(slug: string): Promise<Contest | null>;
  createContest(input: CreateContestInput): Promise<Contest>;
  updateContest(id: string, patch: UpdateContestInput): Promise<Contest | null>;
  /** Create-or-update a student's contest row (score/penalty are optional). */
  upsertParticipation(input: {
    contestId: string;
    userId: string;
    score?: number;
    penalty?: number;
  }): Promise<Participation>;
  /** Ranked by score DESC, penalty ASC - the documented leaderboard rule. */
  listParticipationsByContest(contestId: string): Promise<Participation[]>;
  /** A member's contest rows, newest joined first (profile history). */
  listParticipationsByUser(userId: string): Promise<Participation[]>;
}

const globalForStore = globalThis as unknown as {
  __cpArenaStore?: Store;
};

/** Get the process-wide store singleton (DemoStore or MongoStore). */
export async function getStore(): Promise<Store> {
  if (!globalForStore.__cpArenaStore) {
    if (process.env.MONGODB_URI) {
      globalForStore.__cpArenaStore = await MongoStore.create();
    } else {
      globalForStore.__cpArenaStore = await DemoStore.create();
    }
  }
  return globalForStore.__cpArenaStore;
}

/** Test helper: forget the singleton so the next getStore() re-initializes. */
export function resetStoreForTests(): void {
  delete globalForStore.__cpArenaStore;
}

export type { DemoStore, MongoStore };

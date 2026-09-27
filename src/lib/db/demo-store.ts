import { randomUUID } from "node:crypto";
import type {
  Role,
  User,
  Problem,
  Path,
  Submission,
  Contest,
  Participation,
  ContentStatus,
} from "./types";
import { hashPassword } from "@/lib/auth/password";
import { DEMO_PASSWORD, seedUsers } from "./seeds/users";
import { learningPaths } from "@/lib/paths/paths";
import { seedProblemsBasics } from "./seeds/problems-basics";
import { seedProblemsAdvanced } from "./seeds/problems-advanced";
import { seedSubmissionsHistory } from "./seeds/submissions-history";
import { buildContestSeeds } from "./seeds/contests";
import type {
  Store,
  ListProblemsFilters,
  Paged,
  CreateProblemInput,
  UpdateProblemInput,
  CreateContestInput,
  UpdateContestInput,
  RecordSubmissionInput,
  SubmissionWithProblem,
} from "./index";

/**
 * In-memory store used when MONGODB_URI is absent. Seeded lazily on first
 * access; data resets when the server restarts. All mutations are real —
 * they write to the in-memory Maps, and reads see them (spec section 36:
 * never fake functionality).
 *
 * SEED EXTENSION POINTS (chunks B/C): import the problem/path/contest seed
 * modules here and insert them inside ensureSeeded() below, next to the
 * user seeds. Keep each seed module a plain array of typed objects.
 */

const nowIso = () => new Date().toISOString();

export class DemoStore implements Store {
  private usersByEmail = new Map<string, User>();
  private usersByHandle = new Map<string, User>();
  private usersById = new Map<string, User>();
  private problemsById = new Map<string, Problem>();
  private problemsBySlug = new Map<string, Problem>();
  private pathsBySlug = new Map<string, Path>();
  private submissions: Submission[] = [];
  private contestsById = new Map<string, Contest>();
  private contestsBySlug = new Map<string, Contest>();
  /** participation key: `${contestId}::${userId}` */
  private participationsByKey = new Map<string, Participation>();
  private seeded = false;

  static async create(): Promise<DemoStore> {
    const store = new DemoStore();
    await store.ensureSeeded();
    return store;
  }

  /** Idempotent: seed exactly once per process. */
  async ensureSeeded(): Promise<void> {
    if (this.seeded) return;
    for (const seed of seedUsers) {
      const user: User = { ...seed, passwordHash: hashPassword(DEMO_PASSWORD) };
      this.usersByEmail.set(user.email, user);
      this.usersByHandle.set(user.handle, user);
      this.usersById.set(user.id, user);
    }
    for (const path of learningPaths) {
      this.pathsBySlug.set(path.slug, path);
    }
    for (const seed of [...seedProblemsBasics, ...seedProblemsAdvanced]) {
      const problem: Problem = {
        ...seed,
        id: `prb-${seed.slug}`,
        solvedCount: seed.solvedCount ?? 0,
        attemptedCount: seed.attemptedCount ?? 0,
      };
      this.problemsById.set(problem.id, problem);
      this.problemsBySlug.set(problem.slug, problem);
    }
    for (const seed of seedSubmissionsHistory) {
      const problem = this.problemsBySlug.get(seed.problemSlug);
      if (!problem) continue; // forward-compatible with later seed chunks
      this.submissions.push({
        id: seed.id,
        problemId: problem.id,
        userId: seed.userId,
        language: seed.language,
        code: seed.code,
        verdict: seed.verdict,
        judgeMode: "seed",
        ...(seed.runtimeMs !== undefined ? { runtimeMs: seed.runtimeMs } : {}),
        ...(seed.memoryKb !== undefined ? { memoryKb: seed.memoryKb } : {}),
        createdAt: seed.createdAt,
      });
    }
    // Contests + result history. The one upcoming contest computes
    // startsAt/endsAt as seed time + 3 days HERE (never a fixed date in the
    // seed file) so its /contests countdown is live (spec 19.7).
    const contestSeeds = buildContestSeeds(new Date());
    const contestIdBySlug = new Map<string, string>();
    for (const seed of contestSeeds.contests) {
      const contest: Contest = { ...seed, id: `cst-${seed.slug}` };
      contestIdBySlug.set(contest.slug, contest.id);
      this.contestsById.set(contest.id, contest);
      this.contestsBySlug.set(contest.slug, contest);
    }
    for (const seed of contestSeeds.submissions) {
      const problem = this.problemsBySlug.get(seed.problemSlug);
      const contestId = contestIdBySlug.get(seed.contestSlug);
      if (!problem || !contestId) continue;
      this.submissions.push({
        id: seed.id,
        problemId: problem.id,
        userId: seed.userId,
        language: seed.language,
        code: seed.code,
        verdict: seed.verdict,
        judgeMode: "seed",
        ...(seed.runtimeMs !== undefined ? { runtimeMs: seed.runtimeMs } : {}),
        ...(seed.memoryKb !== undefined ? { memoryKb: seed.memoryKb } : {}),
        createdAt: seed.createdAt,
        contestId,
      });
    }
    for (const seed of contestSeeds.participations) {
      const contestId = contestIdBySlug.get(seed.contestSlug);
      if (!contestId) continue;
      const participation: Participation = {
        id: `par-${seed.contestSlug}-${seed.userId}`,
        contestId,
        userId: seed.userId,
        joinedAt: seed.joinedAt,
        score: seed.score,
        penalty: seed.penalty,
      };
      this.participationsByKey.set(
        `${participation.contestId}::${participation.userId}`,
        participation,
      );
    }
    this.seeded = true;
  }

  // ---- users ------------------------------------------------------------

  async findByEmail(email: string): Promise<User | null> {
    await this.ensureSeeded();
    return this.usersByEmail.get(email.toLowerCase()) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    await this.ensureSeeded();
    return this.usersById.get(id) ?? null;
  }

  async findByHandle(handle: string): Promise<User | null> {
    await this.ensureSeeded();
    return this.usersByHandle.get(handle) ?? null;
  }

  async isHandleTaken(handle: string, excludeUserId?: string): Promise<boolean> {
    await this.ensureSeeded();
    const existing = this.usersByHandle.get(handle);
    if (!existing) return false;
    return existing.id !== excludeUserId;
  }

  async createByRegister(input: {
    name: string;
    email: string;
    handle: string;
    passwordHash: string;
  }): Promise<User> {
    await this.ensureSeeded();
    const email = input.email.toLowerCase();
    if (this.usersByEmail.has(email)) {
      throw new Error(`A user with email ${email} already exists.`);
    }
    if (this.usersByHandle.has(input.handle)) {
      throw new Error(`The handle ${input.handle} is already taken.`);
    }
    const user: User = {
      id: `usr-${randomUUID()}`,
      name: input.name,
      email,
      passwordHash: input.passwordHash,
      role: "STUDENT",
      handle: input.handle,
      createdAt: nowIso(),
    };
    this.usersByEmail.set(user.email, user);
    this.usersByHandle.set(user.handle, user);
    this.usersById.set(user.id, user);
    return user;
  }

  async listByRole(role?: Role): Promise<User[]> {
    await this.ensureSeeded();
    const all = [...this.usersById.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
    return role ? all.filter((u) => u.role === role) : all;
  }

  // ---- problems ------------------------------------------------------------

  async listPublished(filters?: ListProblemsFilters): Promise<Paged<Problem>> {
    await this.ensureSeeded();
    const page = Math.max(1, filters?.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, filters?.pageSize ?? 20));
    const q = filters?.q?.trim().toLowerCase();

    // Personal status sets (applied before pagination so paging stays honest).
    let solvedIds: Set<string> | null = null;
    let attemptedIds: Set<string> | null = null;
    if (filters?.status && filters.userId) {
      const mine = this.submissions.filter((s) => s.userId === filters.userId);
      const attempted = new Set(mine.map((s) => s.problemId));
      const solved = new Set(
        mine.filter((s) => s.verdict === "accepted").map((s) => s.problemId),
      );
      if (filters.status === "solved") solvedIds = solved;
      else if (filters.status === "attempted") {
        solvedIds = solved; // to subtract below
        attemptedIds = attempted;
      } else attemptedIds = attempted; // "untried": everything not attempted
    }

    const filtered = [...this.problemsBySlug.values()]
      .filter((p) => p.status === "published")
      .filter((p) => !filters?.difficulty || p.difficulty === filters.difficulty)
      .filter((p) => !filters?.pathSlug || p.pathSlug === filters.pathSlug)
      .filter((p) => !filters?.topic || p.topics.includes(filters.topic as string))
      .filter(
        (p) =>
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q),
      )
      .filter((p) => {
        if (filters?.status === "solved" && solvedIds)
          return solvedIds.has(p.id);
        if (filters?.status === "attempted" && solvedIds && attemptedIds)
          return attemptedIds.has(p.id) && !solvedIds.has(p.id);
        if (filters?.status === "untried" && attemptedIds)
          return !attemptedIds.has(p.id);
        return true;
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  async listAll(): Promise<Problem[]> {
    await this.ensureSeeded();
    return [...this.problemsBySlug.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  }

  async getBySlug(slug: string): Promise<Problem | null> {
    await this.ensureSeeded();
    return this.problemsBySlug.get(slug) ?? null;
  }

  async createProblem(input: CreateProblemInput): Promise<Problem> {
    await this.ensureSeeded();
    if (this.problemsBySlug.has(input.slug)) {
      throw new Error(`A problem with slug ${input.slug} already exists.`);
    }
    const problem: Problem = {
      ...input,
      id: `prb-${randomUUID()}`,
      createdAt: nowIso(),
      solvedCount: input.solvedCount ?? 0,
      attemptedCount: input.attemptedCount ?? 0,
    };
    this.problemsById.set(problem.id, problem);
    this.problemsBySlug.set(problem.slug, problem);
    return problem;
  }

  async updateProblem(
    id: string,
    patch: UpdateProblemInput,
  ): Promise<Problem | null> {
    await this.ensureSeeded();
    const current = this.problemsById.get(id);
    if (!current) return null;
    const updated: Problem = { ...current, ...patch };
    this.problemsById.set(id, updated);
    this.problemsBySlug.set(updated.slug, updated);
    return updated;
  }

  async setProblemStatus(
    id: string,
    status: ContentStatus,
  ): Promise<Problem | null> {
    return this.updateProblem(id, { status });
  }

  async incAttempted(slug: string): Promise<void> {
    await this.ensureSeeded();
    const problem = this.problemsBySlug.get(slug);
    if (problem) problem.attemptedCount += 1;
  }

  async incSolved(slug: string): Promise<void> {
    await this.ensureSeeded();
    const problem = this.problemsBySlug.get(slug);
    if (problem) problem.solvedCount += 1;
  }

  async listTopics(): Promise<string[]> {
    await this.ensureSeeded();
    const topics = new Set<string>();
    for (const problem of this.problemsBySlug.values()) {
      if (problem.status !== "published") continue;
      for (const topic of problem.topics) topics.add(topic);
    }
    return [...topics].sort();
  }

  // ---- submissions ----------------------------------------------------------

  async recordSubmission(input: RecordSubmissionInput): Promise<Submission> {
    await this.ensureSeeded();
    const submission: Submission = {
      id: `sub-${randomUUID()}`,
      problemId: input.problemId,
      userId: input.userId,
      language: input.language,
      code: input.code,
      verdict: input.verdict,
      judgeMode: input.judgeMode,
      ...(input.runtimeMs !== undefined ? { runtimeMs: input.runtimeMs } : {}),
      ...(input.memoryKb !== undefined ? { memoryKb: input.memoryKb } : {}),
      createdAt: nowIso(),
      ...(input.contestId !== undefined ? { contestId: input.contestId } : {}),
    };
    this.submissions.push(submission);
    return submission;
  }

  async listSubmissionsByUser(
    userId: string,
  ): Promise<SubmissionWithProblem[]> {
    await this.ensureSeeded();
    return this.submissions
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .flatMap((s) => {
        const problem = this.problemsById.get(s.problemId);
        if (!problem) return [];
        return [
          {
            ...s,
            problemSlug: problem.slug,
            problemTitle: problem.title,
            problemDifficulty: problem.difficulty,
          },
        ];
      });
  }

  async listSubmissionsByProblem(problemId: string): Promise<Submission[]> {
    await this.ensureSeeded();
    return this.submissions
      .filter((s) => s.problemId === problemId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listSubmissionsByContest(contestId: string): Promise<Submission[]> {
    await this.ensureSeeded();
    return this.submissions
      .filter((s) => s.contestId === contestId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listAllSubmissions(): Promise<Submission[]> {
    await this.ensureSeeded();
    return [...this.submissions].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  // ---- paths -----------------------------------------------------------------

  async listPaths(): Promise<Path[]> {
    await this.ensureSeeded();
    return [...this.pathsBySlug.values()].sort((a, b) => a.order - b.order);
  }

  async getPathBySlug(slug: string): Promise<Path | null> {
    await this.ensureSeeded();
    return this.pathsBySlug.get(slug) ?? null;
  }

  // ---- contests ----------------------------------------------------------------

  async listPublishedContests(): Promise<Contest[]> {
    await this.ensureSeeded();
    return [...this.contestsBySlug.values()]
      .filter((c) => c.status === "published")
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  }

  async getContestBySlug(slug: string): Promise<Contest | null> {
    await this.ensureSeeded();
    return this.contestsBySlug.get(slug) ?? null;
  }

  async createContest(input: CreateContestInput): Promise<Contest> {
    await this.ensureSeeded();
    if (this.contestsBySlug.has(input.slug)) {
      throw new Error(`A contest with slug ${input.slug} already exists.`);
    }
    const contest: Contest = { ...input, id: `cst-${randomUUID()}` };
    this.contestsById.set(contest.id, contest);
    this.contestsBySlug.set(contest.slug, contest);
    return contest;
  }

  async updateContest(
    id: string,
    patch: UpdateContestInput,
  ): Promise<Contest | null> {
    await this.ensureSeeded();
    const current = this.contestsById.get(id);
    if (!current) return null;
    const updated: Contest = { ...current, ...patch };
    this.contestsById.set(id, updated);
    this.contestsBySlug.set(updated.slug, updated);
    return updated;
  }

  async upsertParticipation(input: {
    contestId: string;
    userId: string;
    score?: number;
    penalty?: number;
  }): Promise<Participation> {
    await this.ensureSeeded();
    const key = `${input.contestId}::${input.userId}`;
    const existing = this.participationsByKey.get(key);
    if (existing) {
      const updated: Participation = {
        ...existing,
        ...(input.score !== undefined ? { score: input.score } : {}),
        ...(input.penalty !== undefined ? { penalty: input.penalty } : {}),
      };
      this.participationsByKey.set(key, updated);
      return updated;
    }
    const participation: Participation = {
      id: `par-${randomUUID()}`,
      contestId: input.contestId,
      userId: input.userId,
      joinedAt: nowIso(),
      score: input.score ?? 0,
      penalty: input.penalty ?? 0,
    };
    this.participationsByKey.set(key, participation);
    return participation;
  }

  async listParticipationsByContest(
    contestId: string,
  ): Promise<Participation[]> {
    await this.ensureSeeded();
    return [...this.participationsByKey.values()]
      .filter((p) => p.contestId === contestId)
      .sort((a, b) => b.score - a.score || a.penalty - b.penalty);
  }

  async listParticipationsByUser(userId: string): Promise<Participation[]> {
    await this.ensureSeeded();
    return [...this.participationsByKey.values()]
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
  }
}

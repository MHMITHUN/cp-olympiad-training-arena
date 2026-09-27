import { randomUUID } from "node:crypto";
import { MongoClient, type Collection, type Document } from "mongodb";
import type { ZodType } from "zod";
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
import {
  UserSchema,
  ProblemSchema,
  PathSchema,
  SubmissionSchema,
  ContestSchema,
  ParticipationSchema,
} from "./types";
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
 * MongoDB-backed store (mongodb driver), used when MONGODB_URI is set.
 * Every document is zod-parsed at the boundary so pages get typed, trusted
 * objects. Content is created by coaches in-app or seeded with npm run seed.
 */

const globalForMongo = globalThis as unknown as {
  __cpArenaMongoClient?: MongoClient;
};

function getMongoClient(): MongoClient {
  if (!globalForMongo.__cpArenaMongoClient) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set.");
    globalForMongo.__cpArenaMongoClient = new MongoClient(uri);
  }
  return globalForMongo.__cpArenaMongoClient;
}

function getDbName(): string {
  return process.env.MONGODB_DB_NAME || "cp_arena";
}

function getCollection<T extends Document>(name: string): Collection<T> {
  return getMongoClient().db(getDbName()).collection<T>(name);
}

/** Mongo document shape: our typed fields plus the Mongo _id. */
interface UserDoc extends User, Document {
  _id?: unknown;
}
interface ProblemDoc extends Problem, Document {
  _id?: unknown;
}
interface PathDoc extends Path, Document {
  _id?: unknown;
}
interface SubmissionDoc extends Submission, Document {
  _id?: unknown;
}
interface ContestDoc extends Contest, Document {
  _id?: unknown;
}
interface ParticipationDoc extends Participation, Document {
  _id?: unknown;
}

const nowIso = () => new Date().toISOString();

function parse<T>(schema: ZodType<T>, doc: (T & Document) | null): T | null {
  if (!doc) return null;
  const parsed = schema.safeParse({ ...doc, _id: undefined });
  return parsed.success ? parsed.data : null;
}

function parseMany<T>(
  schema: ZodType<T>,
  docs: Array<T & Document>,
): T[] {
  return docs
    .map((doc) => parse(schema, doc))
    .filter((v): v is T => v !== null);
}

/** Escape user text before using it inside a Mongo $regex. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isDuplicateKey(error: unknown): boolean {
  return error instanceof Error && /duplicate key/.test(error.message);
}

export class MongoStore implements Store {
  static async create(): Promise<MongoStore> {
    const store = new MongoStore();
    await store.ensureIndexes();
    return store;
  }

  /** Create indexes once per process. Extend as collections are added. */
  private indexesEnsured = false;
  private async ensureIndexes(): Promise<void> {
    if (this.indexesEnsured) return;
    await getCollection<UserDoc>("users").createIndex(
      { email: 1 },
      { unique: true },
    );
    await getCollection<UserDoc>("users").createIndex(
      { handle: 1 },
      { unique: true },
    );
    await getCollection<ProblemDoc>("problems").createIndex(
      { slug: 1 },
      { unique: true },
    );
    await getCollection<ProblemDoc>("problems").createIndex({ status: 1 });
    await getCollection<ProblemDoc>("problems").createIndex({ pathSlug: 1 });
    await getCollection<SubmissionDoc>("submissions").createIndex({
      userId: 1,
      createdAt: -1,
    });
    await getCollection<SubmissionDoc>("submissions").createIndex({
      problemId: 1,
      createdAt: -1,
    });
    await getCollection<PathDoc>("paths").createIndex(
      { slug: 1 },
      { unique: true },
    );
    await getCollection<ContestDoc>("contests").createIndex(
      { slug: 1 },
      { unique: true },
    );
    await getCollection<ContestDoc>("contests").createIndex({ startsAt: 1 });
    await getCollection<ParticipationDoc>("participations").createIndex(
      { contestId: 1, userId: 1 },
      { unique: true },
    );
    await getCollection<ParticipationDoc>("participations").createIndex({
      userId: 1,
      joinedAt: -1,
    });
    await getCollection<SubmissionDoc>("submissions").createIndex({
      contestId: 1,
      createdAt: -1,
    });
    this.indexesEnsured = true;
  }

  // ---- users ------------------------------------------------------------

  async findByEmail(email: string): Promise<User | null> {
    const doc = await getCollection<UserDoc>("users").findOne({
      email: email.toLowerCase(),
    });
    return parse(UserSchema, doc);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await getCollection<UserDoc>("users").findOne({ id });
    return parse(UserSchema, doc);
  }

  async findByHandle(handle: string): Promise<User | null> {
    const doc = await getCollection<UserDoc>("users").findOne({ handle });
    return parse(UserSchema, doc);
  }

  async isHandleTaken(handle: string, excludeUserId?: string): Promise<boolean> {
    const doc = await getCollection<UserDoc>("users").findOne({ handle });
    if (!doc) return false;
    return doc.id !== excludeUserId;
  }

  async createByRegister(input: {
    name: string;
    email: string;
    handle: string;
    passwordHash: string;
  }): Promise<User> {
    const user: User = {
      id: `usr-${randomUUID()}`,
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: "STUDENT",
      handle: input.handle,
      createdAt: nowIso(),
    };
    try {
      await getCollection<UserDoc>("users").insertOne({ ...user });
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new Error(
          `A user with email ${user.email} or handle ${user.handle} already exists.`,
        );
      }
      throw error;
    }
    return user;
  }

  async listByRole(role?: Role): Promise<User[]> {
    const docs = await getCollection<UserDoc>("users")
      .find(role ? { role } : {})
      .sort({ createdAt: 1 })
      .toArray();
    return parseMany(UserSchema, docs);
  }

  // ---- problems ------------------------------------------------------------

  async listPublished(filters?: ListProblemsFilters): Promise<Paged<Problem>> {
    const page = Math.max(1, filters?.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, filters?.pageSize ?? 20));

    const filter: Record<string, unknown> = { status: "published" };
    if (filters?.difficulty) filter.difficulty = filters.difficulty;
    if (filters?.pathSlug) filter.pathSlug = filters.pathSlug;
    if (filters?.topic) filter.topics = filters.topic;
    const q = filters?.q?.trim();
    if (q) {
      const pattern = { $regex: escapeRegex(q), $options: "i" };
      filter.$or = [{ title: pattern }, { slug: pattern }];
    }

    // Personal status filter: derive the user's solved/attempted problem ids
    // with one query, then constrain the problem filter (before pagination).
    if (filters?.status && filters.userId) {
      const subs = await getCollection<SubmissionDoc>("submissions")
        .find({ userId: filters.userId })
        .project<{ problemId: string; verdict: string }>({
          problemId: 1,
          verdict: 1,
        })
        .toArray();
      const attempted = new Set(subs.map((s) => s.problemId));
      const solved = new Set(
        subs.filter((s) => s.verdict === "accepted").map((s) => s.problemId),
      );
      if (filters.status === "solved") {
        filter.id = { $in: [...solved] };
      } else if (filters.status === "attempted") {
        const ids = [...attempted].filter((id) => !solved.has(id));
        filter.id = { $in: ids };
      } else {
        // "untried"
        filter.id = { $nin: [...attempted] };
      }
    }

    const collection = getCollection<ProblemDoc>("problems");
    const total = await collection.countDocuments(filter);
    const docs = await collection
      .find(filter)
      .sort({ createdAt: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    return {
      items: parseMany(ProblemSchema, docs),
      total,
      page,
      pageSize,
    };
  }

  async listAll(): Promise<Problem[]> {
    const docs = await getCollection<ProblemDoc>("problems")
      .find({})
      .sort({ createdAt: 1 })
      .toArray();
    return parseMany(ProblemSchema, docs);
  }

  async getBySlug(slug: string): Promise<Problem | null> {
    const doc = await getCollection<ProblemDoc>("problems").findOne({ slug });
    return parse(ProblemSchema, doc);
  }

  async createProblem(input: CreateProblemInput): Promise<Problem> {
    const problem: Problem = {
      ...input,
      id: `prb-${randomUUID()}`,
      createdAt: nowIso(),
      solvedCount: input.solvedCount ?? 0,
      attemptedCount: input.attemptedCount ?? 0,
    };
    try {
      await getCollection<ProblemDoc>("problems").insertOne({ ...problem });
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new Error(`A problem with slug ${input.slug} already exists.`);
      }
      throw error;
    }
    return problem;
  }

  async updateProblem(
    id: string,
    patch: UpdateProblemInput,
  ): Promise<Problem | null> {
    const doc = await getCollection<ProblemDoc>("problems").findOneAndUpdate(
      { id },
      { $set: patch },
      { returnDocument: "after" },
    );
    return parse(ProblemSchema, doc);
  }

  async setProblemStatus(
    id: string,
    status: ContentStatus,
  ): Promise<Problem | null> {
    return this.updateProblem(id, { status });
  }

  async incAttempted(slug: string): Promise<void> {
    await getCollection<ProblemDoc>("problems").updateOne(
      { slug },
      { $inc: { attemptedCount: 1 } },
    );
  }

  async incSolved(slug: string): Promise<void> {
    await getCollection<ProblemDoc>("problems").updateOne(
      { slug },
      { $inc: { solvedCount: 1 } },
    );
  }

  async listTopics(): Promise<string[]> {
    const topics = await getCollection<ProblemDoc>("problems").distinct(
      "topics",
      { status: "published" },
    );
    return topics.filter((t): t is string => typeof t === "string").sort();
  }

  // ---- submissions ----------------------------------------------------------

  async recordSubmission(input: RecordSubmissionInput): Promise<Submission> {
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
    await getCollection<SubmissionDoc>("submissions").insertOne({
      ...submission,
    });
    return submission;
  }

  async listSubmissionsByUser(
    userId: string,
  ): Promise<SubmissionWithProblem[]> {
    const submissions = await getCollection<SubmissionDoc>("submissions")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    const parsed = parseMany(SubmissionSchema, submissions);
    if (parsed.length === 0) return [];

    // Join problem fields with a second query (typed + zod-parsed).
    const problemIds = [...new Set(parsed.map((s) => s.problemId))];
    const problemDocs = await getCollection<ProblemDoc>("problems")
      .find({ id: { $in: problemIds } })
      .toArray();
    const problemsById = new Map(
      parseMany(ProblemSchema, problemDocs).map((p) => [p.id, p]),
    );

    return parsed.flatMap((s) => {
      const problem = problemsById.get(s.problemId);
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
    const docs = await getCollection<SubmissionDoc>("submissions")
      .find({ problemId })
      .sort({ createdAt: -1 })
      .toArray();
    return parseMany(SubmissionSchema, docs);
  }

  async listSubmissionsByContest(contestId: string): Promise<Submission[]> {
    const docs = await getCollection<SubmissionDoc>("submissions")
      .find({ contestId })
      .sort({ createdAt: -1 })
      .toArray();
    return parseMany(SubmissionSchema, docs);
  }

  async listAllSubmissions(): Promise<Submission[]> {
    const docs = await getCollection<SubmissionDoc>("submissions")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return parseMany(SubmissionSchema, docs);
  }

  // ---- paths -----------------------------------------------------------------

  async listPaths(): Promise<Path[]> {
    const docs = await getCollection<PathDoc>("paths")
      .find({})
      .sort({ order: 1 })
      .toArray();
    return parseMany(PathSchema, docs);
  }

  async getPathBySlug(slug: string): Promise<Path | null> {
    const doc = await getCollection<PathDoc>("paths").findOne({ slug });
    return parse(PathSchema, doc);
  }

  // ---- contests ----------------------------------------------------------------

  async listPublishedContests(): Promise<Contest[]> {
    const docs = await getCollection<ContestDoc>("contests")
      .find({ status: "published" })
      .sort({ startsAt: -1 })
      .toArray();
    return parseMany(ContestSchema, docs);
  }

  async getContestBySlug(slug: string): Promise<Contest | null> {
    const doc = await getCollection<ContestDoc>("contests").findOne({ slug });
    return parse(ContestSchema, doc);
  }

  async createContest(input: CreateContestInput): Promise<Contest> {
    const contest: Contest = { ...input, id: `cst-${randomUUID()}` };
    try {
      await getCollection<ContestDoc>("contests").insertOne({ ...contest });
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new Error(`A contest with slug ${input.slug} already exists.`);
      }
      throw error;
    }
    return contest;
  }

  async updateContest(
    id: string,
    patch: UpdateContestInput,
  ): Promise<Contest | null> {
    const doc = await getCollection<ContestDoc>("contests").findOneAndUpdate(
      { id },
      { $set: patch },
      { returnDocument: "after" },
    );
    return parse(ContestSchema, doc);
  }

  async upsertParticipation(input: {
    contestId: string;
    userId: string;
    score?: number;
    penalty?: number;
  }): Promise<Participation> {
    const collection = getCollection<ParticipationDoc>("participations");
    const filter = { contestId: input.contestId, userId: input.userId };

    const set: Record<string, unknown> = {};
    const setOnInsert: Record<string, unknown> = {
      id: `par-${randomUUID()}`,
      contestId: input.contestId,
      userId: input.userId,
      joinedAt: nowIso(),
    };
    if (input.score !== undefined) set.score = input.score;
    else setOnInsert.score = 0;
    if (input.penalty !== undefined) set.penalty = input.penalty;
    else setOnInsert.penalty = 0;

    const doc = await collection.findOneAndUpdate(
      filter,
      { $set: set, $setOnInsert: setOnInsert },
      { returnDocument: "after", upsert: true },
    );
    const parsed = parse(ParticipationSchema, doc);
    if (parsed) return parsed;
    throw new Error("Failed to upsert participation.");
  }

  async listParticipationsByContest(
    contestId: string,
  ): Promise<Participation[]> {
    const docs = await getCollection<ParticipationDoc>("participations")
      .find({ contestId })
      .sort({ score: -1, penalty: 1 })
      .toArray();
    return parseMany(ParticipationSchema, docs);
  }

  async listParticipationsByUser(userId: string): Promise<Participation[]> {
    const docs = await getCollection<ParticipationDoc>("participations")
      .find({ userId })
      .sort({ joinedAt: -1 })
      .toArray();
    return parseMany(ParticipationSchema, docs);
  }
}

/**
 * Seed script (npm run seed).
 *
 * With MONGODB_URI set: connects to MongoDB, ensures the same indexes the
 * app creates (mirrors MongoStore.ensureIndexes in src/lib/db/mongo.ts) and
 * writes ALL seed collections idempotently:
 *   - users (by email) with scrypt-hashed demo passwords,
 *   - learning paths (by slug),
 *   - problems (by slug),
 *   - the sample submission history and contest-round submissions (by id),
 *   - contests (by slug) and their participations (by contestId+userId).
 * Everything uses $setOnInsert, so re-running never overwrites coach edits
 * or real user activity - it only fills what is missing.
 *
 * ONE deliberate exception: the auto-generated UPCOMING contest ("Autumn
 * Training Contest") has its startsAt/endsAt REFRESHED on every run (they
 * are computed at run time as seed time + 3 days) so its /contests countdown
 * is always live. That row is a seed artifact, not coach content.
 *
 * Without MONGODB_URI: the app runs on the in-memory DemoStore, which seeds
 * itself lazily on first access - so there is nothing to persist here.
 * Exits 0 both ways.
 */

import type { Collection, Document } from "mongodb";
import { hashPassword } from "../src/lib/auth/password";
import { seedUsers, DEMO_PASSWORD } from "../src/lib/db/seeds/users";
import { learningPaths } from "../src/lib/paths/paths";
import {
  seedProblemsBasics,
  referenceSolutionsBasics,
} from "../src/lib/db/seeds/problems-basics";
import {
  seedProblemsAdvanced,
  referenceSolutionsAdvanced,
} from "../src/lib/db/seeds/problems-advanced";
import { seedSubmissionsHistory } from "../src/lib/db/seeds/submissions-history";
import { buildContestSeeds } from "../src/lib/db/seeds/contests";
import type {
  Problem,
  Submission,
  Contest,
  Participation,
} from "../src/lib/db/types";

interface SeedReport {
  inserted: number;
  alreadyPresent: number;
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log(
      "Demo mode: no MONGODB_URI. The in-app demo store seeds itself automatically - nothing to do.",
    );
    return;
  }

  const seedProblemsAll = [...seedProblemsBasics, ...seedProblemsAdvanced];
  const referenceSolutionsAll = {
    ...referenceSolutionsBasics,
    ...referenceSolutionsAdvanced,
  };
  // The upcoming round's window is computed AT RUN TIME (now + 3 days) so
  // its countdown is live whenever the seed runs.
  const contestSeeds = buildContestSeeds(new Date());

  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const dbName = process.env.MONGODB_DB_NAME || "cp_arena";
    const db = client.db(dbName);
    console.log(`Connected to MongoDB (database: ${dbName}).`);

    // Untyped collections on purpose: seedAll works against Document and the
    // row arrays below are typed, so the seed data itself is still checked.
    const users = db.collection("users");
    const paths = db.collection("paths");
    const problems = db.collection("problems");
    const submissions = db.collection("submissions");
    const contests = db.collection("contests");
    const participations = db.collection("participations");

    // ---- indexes (mirrors MongoStore.ensureIndexes; MongoStore.create()
    // creates the same ones when the app boots) --------------------------
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ handle: 1 }, { unique: true });
    await paths.createIndex({ slug: 1 }, { unique: true });
    await problems.createIndex({ slug: 1 }, { unique: true });
    await problems.createIndex({ status: 1 });
    await submissions.createIndex({ userId: 1, createdAt: -1 });
    await submissions.createIndex({ problemId: 1, createdAt: -1 });
    await submissions.createIndex({ contestId: 1, createdAt: -1 });
    await contests.createIndex({ slug: 1 }, { unique: true });
    await contests.createIndex({ startsAt: 1 });
    await participations.createIndex(
      { contestId: 1, userId: 1 },
      { unique: true },
    );
    console.log("Indexes ensured.");

    /** Insert-if-missing counter; never touches existing documents. */
    async function seedAll<T extends object>(
      collection: Collection<Document>,
      rows: T[],
      keyOf: (row: T) => Record<string, unknown>,
      label: string,
    ): Promise<SeedReport> {
      let inserted = 0;
      for (const row of rows) {
        const result = await collection.updateOne(
          keyOf(row) as Document,
          { $setOnInsert: row as Document },
          { upsert: true },
        );
        if (result.upsertedCount > 0) inserted += 1;
      }
      const report = { inserted, alreadyPresent: rows.length - inserted };
      console.log(
        `${label}: ${rows.length} seed rows -> ${report.inserted} inserted, ` +
          `${report.alreadyPresent} already present (collection total: ` +
          `${await collection.countDocuments()}).`,
      );
      return report;
    }

    // ---- users (password is scrypt-hashed here, never stored in seeds) --
    await seedAll(
      users,
      seedUsers.map((seed) => ({
        ...seed,
        passwordHash: hashPassword(DEMO_PASSWORD),
      })),
      (row) => ({ email: row.email }),
      "Users",
    );

    // ---- curriculum: paths + the full problem bank ---------------------
    await seedAll(paths, learningPaths, (row) => ({ slug: row.slug }), "Paths");

    const problemRows: Problem[] = seedProblemsAll.map((seed) => ({
      slug: seed.slug,
      title: seed.title,
      statementMd: seed.statementMd,
      difficulty: seed.difficulty,
      pathSlug: seed.pathSlug,
      topics: seed.topics,
      constraintsMd: seed.constraintsMd,
      examples: seed.examples,
      starterCodeCpp: seed.starterCodeCpp,
      timeLimitMs: seed.timeLimitMs,
      memoryLimitMb: seed.memoryLimitMb,
      hints: seed.hints,
      editorialMd: seed.editorialMd,
      status: seed.status,
      authorId: seed.authorId,
      createdAt: seed.createdAt,
      solvedCount: seed.solvedCount,
      attemptedCount: seed.attemptedCount,
      id: `prb-${seed.slug}`,
    }));
    await seedAll(problems, problemRows, (row) => ({ slug: row.slug }), "Problems");

    // Sanity: every problem must have a reference solution (the sample-run
    // catalog depends on it).
    const missingSolutions = seedProblemsAll.filter(
      (problem) => !referenceSolutionsAll[problem.slug],
    );
    if (missingSolutions.length > 0) {
      console.warn(
        `WARNING: missing reference solutions for: ${missingSolutions
          .map((p) => p.slug)
          .join(", ")}`,
      );
    }

    // ---- sample practice history (judgeMode "seed", labeled in the UI) --
    const problemIdBySlug = new Map(problemRows.map((p) => [p.slug, p.id]));
    const historyRows: Submission[] = seedSubmissionsHistory.map((seed) => ({
      id: seed.id,
      problemId: problemIdBySlug.get(seed.problemSlug) ?? `prb-${seed.problemSlug}`,
      userId: seed.userId,
      language: seed.language,
      code: seed.code,
      verdict: seed.verdict,
      judgeMode: "seed",
      createdAt: seed.createdAt,
      ...(seed.runtimeMs !== undefined ? { runtimeMs: seed.runtimeMs } : {}),
      ...(seed.memoryKb !== undefined ? { memoryKb: seed.memoryKb } : {}),
    }));
    await seedAll(
      submissions,
      historyRows,
      (row) => ({ id: row.id }),
      "Sample submissions",
    );

    // ---- contests (upcoming window = run time + 3 days, refreshed) -----
    let contestsInserted = 0;
    for (const seed of contestSeeds.contests) {
      const contest: Contest = { ...seed, id: `cst-${seed.slug}` };
      const result = await contests.updateOne(
        { slug: contest.slug },
        { $setOnInsert: contest as Document },
        { upsert: true },
      );
      if (result.upsertedCount > 0) {
        contestsInserted += 1;
        console.log(`  seeded contest ${contest.slug} (starts ${contest.startsAt})`);
      }
    }
    // The one deliberate overwrite: the auto-generated UPCOMING round gets
    // its window REFRESHED on every run (computed above as now + 3 days) so
    // its /contests countdown stays live. That row is a seed artifact, not
    // coach content - past rounds and hand-made contests keep their dates.
    const upcomingSeed = contestSeeds.contests.find(
      (c) => Date.parse(c.startsAt) > Date.now(),
    );
    if (upcomingSeed) {
      await contests.updateOne(
        { slug: upcomingSeed.slug },
        {
          $set: { startsAt: upcomingSeed.startsAt, endsAt: upcomingSeed.endsAt },
        },
      );
    }
    console.log(
      `Contests: ${contestSeeds.contests.length} seed rows -> ${contestsInserted} inserted, ` +
        `${contestSeeds.contests.length - contestsInserted} already present ` +
        `(collection total: ${await contests.countDocuments()}).`,
    );

    // ---- contest result history (submissions tagged with contestId) ----
    const contestIdBySlug = new Map<string, string>();
    for (const doc of await contests
      .find({}, { projection: { id: 1, slug: 1 } })
      .toArray()) {
      contestIdBySlug.set(doc.slug, doc.id);
    }
    const contestSubmissionRows: Submission[] = contestSeeds.submissions
      .filter(
        (seed) =>
          problemIdBySlug.has(seed.problemSlug) &&
          contestIdBySlug.has(seed.contestSlug),
      )
      .map((seed) => ({
        id: seed.id,
        problemId: problemIdBySlug.get(seed.problemSlug)!,
        contestId: contestIdBySlug.get(seed.contestSlug)!,
        userId: seed.userId,
        language: seed.language,
        code: seed.code,
        verdict: seed.verdict,
        judgeMode: "seed" as const,
        createdAt: seed.createdAt,
        ...(seed.runtimeMs !== undefined ? { runtimeMs: seed.runtimeMs } : {}),
        ...(seed.memoryKb !== undefined ? { memoryKb: seed.memoryKb } : {}),
      }));
    await seedAll(
      submissions,
      contestSubmissionRows,
      (row) => ({ id: row.id }),
      "Contest submissions",
    );

    // ---- participations (score/penalty precomputed with contestScore) --
    const participationRows: Participation[] = contestSeeds.participations
      .filter((seed) => contestIdBySlug.has(seed.contestSlug))
      .map((seed) => ({
        id: `par-${seed.contestSlug}-${seed.userId}`,
        contestId: contestIdBySlug.get(seed.contestSlug)!,
        userId: seed.userId,
        joinedAt: seed.joinedAt,
        score: seed.score,
        penalty: seed.penalty,
      }));
    await seedAll(
      participations,
      participationRows,
      (row) => ({ contestId: row.contestId, userId: row.userId }),
      "Participations",
    );

    console.log(
      "Seed complete. Tip: members sign in with student@demo.local / Demo@12345.",
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

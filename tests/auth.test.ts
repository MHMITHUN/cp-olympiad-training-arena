import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_MAX_AGE,
  type SessionPayload,
} from "@/lib/auth/session";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import { getStore, resetStoreForTests } from "@/lib/db";

/**
 * Auth stack (P01-style coverage): scrypt password hashing, signed session
 * tokens, register/login validation schemas, and the STORE rules behind
 * self-registration — especially handle uniqueness (the public contest
 * identity). The server actions themselves need a Next.js request scope and
 * are covered by the Playwright login/register flow instead.
 */

const TEST_SECRET = "unit-test-session-secret";

/** Sign a payload with the same scheme the module uses (HMAC-SHA256). */
function forgeToken(payload: SessionPayload, secret: string): string {
  const b64url = (input: Buffer | string) =>
    Buffer.from(input)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  const encoded = b64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(encoded).digest();
  return `${encoded}.${b64url(signature)}`;
}

beforeEach(() => {
  process.env.SESSION_SECRET = TEST_SECRET;
  resetStoreForTests();
});

afterEach(() => {
  delete process.env.SESSION_SECRET;
});

/* ------------------------------------------------------------------ */
/* Password hashing (scrypt)                                           */
/* ------------------------------------------------------------------ */

describe("hashPassword / verifyPassword", () => {
  it("roundtrips: a hashed password verifies as correct", () => {
    const stored = hashPassword("Demo@12345");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("Demo@12345", stored)).toBe(true);
  });

  it("rejects a wrong password (case-sensitive, non-empty)", () => {
    const stored = hashPassword("Demo@12345");
    expect(verifyPassword("Demo@12346", stored)).toBe(false);
    expect(verifyPassword("demo@12345", stored)).toBe(false);
    expect(verifyPassword("", stored)).toBe(false);
  });

  it("generates a unique salt per hash for the same password", () => {
    const first = hashPassword("SamePassword1!");
    const second = hashPassword("SamePassword1!");
    expect(first).not.toBe(second);

    const [, saltA] = first.split("$");
    const [, saltB] = second.split("$");
    expect(saltA).not.toBe(saltB);

    expect(verifyPassword("SamePassword1!", first)).toBe(true);
    expect(verifyPassword("SamePassword1!", second)).toBe(true);
  });

  it("rejects malformed stored hashes instead of throwing", () => {
    expect(verifyPassword("Demo@12345", "")).toBe(false);
    expect(verifyPassword("Demo@12345", "plaintext")).toBe(false);
    expect(verifyPassword("Demo@12345", "bcrypt$salt$hash")).toBe(false);
    expect(verifyPassword("Demo@12345", "scrypt$onlytwo")).toBe(false);
    expect(verifyPassword("Demo@12345", "scrypt$$hash")).toBe(false);
    expect(verifyPassword("Demo@12345", "scrypt$salt$")).toBe(false);
    expect(verifyPassword("Demo@12345", "scrypt$not-hex$also-not-hex")).toBe(
      false,
    );
  });
});

/* ------------------------------------------------------------------ */
/* Session tokens (HMAC-SHA256, stateless)                             */
/* ------------------------------------------------------------------ */

describe("createSessionToken / verifySessionToken", () => {
  it("roundtrips and carries the same uid and role", () => {
    const token = createSessionToken({ uid: "usr-student-01", role: "STUDENT" });
    const payload = verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.uid).toBe("usr-student-01");
    expect(payload!.role).toBe("STUDENT");

    const nowSec = Math.floor(Date.now() / 1000);
    expect(payload!.exp).toBeGreaterThan(nowSec);
    expect(payload!.exp).toBeLessThanOrEqual(nowSec + SESSION_MAX_AGE);
  });

  it("rejects a tampered payload (role escalation breaks the signature)", () => {
    const token = createSessionToken({ uid: "usr-student-01", role: "STUDENT" });
    const [encodedPayload, encodedSignature] = token.split(".");

    const payload = JSON.parse(
      Buffer.from(
        encodedPayload.replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString("utf8"),
    ) as SessionPayload;
    payload.role = "ADMIN";
    const forgedPayload = Buffer.from(JSON.stringify(payload))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    expect(
      verifySessionToken(`${forgedPayload}.${encodedSignature}`),
    ).toBeNull();
  });

  it("rejects a signature made with the wrong secret", () => {
    const payload: SessionPayload = {
      uid: "usr-student-01",
      role: "STUDENT",
      exp: Math.floor(Date.now() / 1000) + 60,
    };
    expect(
      verifySessionToken(forgeToken(payload, "a-different-secret")),
    ).toBeNull();
  });

  it("rejects an expired token (expiry boundary is inclusive)", () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const expired: SessionPayload = {
      uid: "usr-student-01",
      role: "STUDENT",
      exp: nowSec - 1,
    };
    expect(verifySessionToken(forgeToken(expired, TEST_SECRET))).toBeNull();

    const boundary: SessionPayload = { ...expired, exp: nowSec };
    expect(verifySessionToken(forgeToken(boundary, TEST_SECRET))).toBeNull();
  });

  it("rejects a valid-signature token with an invalid payload schema", () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const badRole = forgeToken(
      { uid: "usr-1", role: "SUPERUSER", exp: nowSec + 60 } as unknown as SessionPayload,
      TEST_SECRET,
    );
    expect(verifySessionToken(badRole)).toBeNull();

    const noExp = forgeToken(
      { uid: "usr-1", role: "STUDENT" } as unknown as SessionPayload,
      TEST_SECRET,
    );
    expect(verifySessionToken(noExp)).toBeNull();

    const emptyUid = forgeToken(
      { uid: "", role: "STUDENT", exp: nowSec + 60 } as unknown as SessionPayload,
      TEST_SECRET,
    );
    expect(verifySessionToken(emptyUid)).toBeNull();
  });

  it("rejects malformed tokens without throwing", () => {
    expect(verifySessionToken("")).toBeNull();
    expect(verifySessionToken("nodots")).toBeNull();
    expect(verifySessionToken(".signature")).toBeNull();
    expect(verifySessionToken("payload.")).toBeNull();
    expect(verifySessionToken("not-base64.!!!")).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Register / login validation                                         */
/* ------------------------------------------------------------------ */

describe("registerSchema", () => {
  const valid = {
    name: "Rakib Hasan",
    handle: "code_ninja",
    email: "rakib@club.test",
    password: "Demo@12345",
  };

  it("accepts a well-formed registration", () => {
    const parsed = registerSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("trims name, handle and email before validating", () => {
    const parsed = registerSchema.safeParse({
      ...valid,
      name: "  Rakib Hasan  ",
      handle: " code_ninja ",
      email: "  rakib@club.test ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.handle).toBe("code_ninja");
      expect(parsed.data.email).toBe("rakib@club.test");
    }
  });

  it("rejects a handle that is too short, too long or wrongly cased", () => {
    for (const handle of ["ab", "a".repeat(21), "CodeNinja", "code ninja", "code-ninja"]) {
      const parsed = registerSchema.safeParse({ ...valid, handle });
      expect(parsed.success, `handle "${handle}" should be rejected`).toBe(false);
    }
  });

  it("rejects an invalid email", () => {
    for (const email of ["", "not-an-email", "a@b", "a b@c.test"]) {
      const parsed = registerSchema.safeParse({ ...valid, email });
      expect(parsed.success, `email "${email}" should be rejected`).toBe(false);
    }
  });

  it("rejects a short name or a short password", () => {
    expect(registerSchema.safeParse({ ...valid, name: "R" }).success).toBe(false);
    expect(
      registerSchema.safeParse({ ...valid, password: "short" }).success,
    ).toBe(false);
    // 8 characters is the documented minimum.
    expect(
      registerSchema.safeParse({ ...valid, password: "12345678" }).success,
    ).toBe(true);
  });
});

describe("loginSchema", () => {
  it("accepts a valid login pair and rejects missing fields", () => {
    expect(
      loginSchema.safeParse({ email: "student@demo.local", password: "Demo@12345" })
        .success,
    ).toBe(true);
    expect(loginSchema.safeParse({ email: "student@demo.local" }).success).toBe(false);
    expect(loginSchema.safeParse({ password: "Demo@12345" }).success).toBe(false);
    expect(
      loginSchema.safeParse({ email: "not-an-email", password: "Demo@12345" })
        .success,
    ).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Store rules behind self-registration (handle uniqueness)            */
/* ------------------------------------------------------------------ */

describe("createByRegister / isHandleTaken", () => {
  it("reports seeded handles as taken and fresh ones as free", async () => {
    const store = await getStore();
    expect(await store.isHandleTaken("code_ninja")).toBe(true); // seeded member
    expect(await store.isHandleTaken("brand_new_handle")).toBe(false);
  });

  it("excludes the user's own handle (profile-update path)", async () => {
    const store = await getStore();
    const student = await store.findByHandle("code_ninja");
    expect(student).not.toBeNull();
    expect(
      await store.isHandleTaken("code_ninja", student!.id),
    ).toBe(false); // keeping your own handle is allowed
    expect(
      await store.isHandleTaken("coach_nusrat", student!.id),
    ).toBe(true); // someone else's is not
  });

  it("rejects registration with a taken handle even under a new email", async () => {
    const store = await getStore();
    await expect(
      store.createByRegister({
        name: "Handle Thief",
        email: "thief@club.test",
        handle: "code_ninja",
        passwordHash: hashPassword("Demo@12345"),
      }),
    ).rejects.toThrow(/handle code_ninja is already taken/i);
  });

  it("rejects registration with an existing email even under a new handle", async () => {
    const store = await getStore();
    await expect(
      store.createByRegister({
        name: "Duplicate Email",
        email: "student@demo.local",
        handle: "duplicate_email_user",
        passwordHash: hashPassword("Demo@12345"),
      }),
    ).rejects.toThrow(/email student@demo.local already exists/i);
  });

  it("creates a STUDENT with a scrypt hash, findable by email AND handle", async () => {
    const store = await getStore();
    const created = await store.createByRegister({
      name: "Test Newcomer",
      email: "Newcomer@CLUB.test", // mixed case on purpose
      handle: "test_newcomer",
      passwordHash: hashPassword("Demo@12345"),
    });

    // Self-registration is STUDENT-only (club reality; coaches are added by
    // an admin).
    expect(created.role).toBe("STUDENT");

    // The stored hash is never the plaintext and verifies.
    expect(created.passwordHash).not.toBe("Demo@12345");
    expect(verifyPassword("Demo@12345", created.passwordHash)).toBe(true);

    // Email is matched case-insensitively; handle exactly.
    expect(await store.findByEmail("newcomer@club.test")).not.toBeNull();
    expect(await store.findByHandle("test_newcomer")).not.toBeNull();
    expect(await store.isHandleTaken("test_newcomer")).toBe(true);
  });
});

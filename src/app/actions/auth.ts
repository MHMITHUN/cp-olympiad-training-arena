"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { getStore } from "@/lib/db";
import { loginSchema, registerSchema } from "@/lib/validation/auth";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Partial<
    Record<"name" | "handle" | "email" | "password", string>
  >;
}

function homeForRole(role: "ADMIN" | "TEACHER" | "STUDENT"): string {
  return role === "STUDENT" ? "/profile" : "/coach";
}

/** First validation message per field, from a zod error's issues. */
function fieldErrorsFromIssues(
  issues: z.ZodIssue[],
): AuthFormState["fieldErrors"] {
  const out: AuthFormState["fieldErrors"] = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (
      (key === "name" ||
        key === "handle" ||
        key === "email" ||
        key === "password") &&
      !out[key]
    ) {
      out[key] = issue.message;
    }
  }
  return out;
}

function safeNextPath(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  // Only same-site absolute paths, no protocol tricks.
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const issues = parsed.error.issues;
    return { fieldErrors: fieldErrorsFromIssues(issues) };
  }

  const { email, password } = parsed.data;
  const store = await getStore();
  const user = await store.findByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Incorrect email or password." };
  }

  await setSessionCookie(
    createSessionToken({ uid: user.id, role: user.role }),
  );

  const next = safeNextPath(formData.get("next"));
  redirect(next ?? homeForRole(user.role));
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    handle: formData.get("handle"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const issues = parsed.error.issues;
    return { fieldErrors: fieldErrorsFromIssues(issues) };
  }

  const { name, handle, email, password } = parsed.data;
  const store = await getStore();

  const existingEmail = await store.findByEmail(email);
  if (existingEmail) {
    return { fieldErrors: { email: "An account with this email already exists." } };
  }
  const handleTaken = await store.isHandleTaken(handle);
  if (handleTaken) {
    return { fieldErrors: { handle: "That handle is already taken." } };
  }

  // Self-registration is STUDENT-only; coach accounts are created by an admin.
  const user = await store.createByRegister({
    name,
    email,
    handle,
    passwordHash: hashPassword(password),
  });

  await setSessionCookie(
    createSessionToken({ uid: user.id, role: user.role }),
  );
  redirect(homeForRole(user.role));
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/guards";
import { getStore } from "@/lib/db";
import { slugify } from "@/lib/utils";
import {
  CreateContestSchema,
  type CreateContestFormState,
} from "@/lib/validation/contests";
import { ICPC_RULES_TEMPLATE } from "@/lib/db/seeds/contests";

/**
 * Create a contest (TEACHER/ADMIN only, spec 19.7). Slug is derived from
 * the title; endsAt is derived from start + duration so the two can never
 * disagree. Published immediately — coaches announce by sharing the link.
 */
export async function createContestAction(
  _prev: CreateContestFormState,
  formData: FormData,
): Promise<CreateContestFormState> {
  const user = await getSessionUser();
  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
    return { error: "Only coaches and admins can create contests." };
  }

  const parsed = CreateContestSchema.safeParse({
    title: formData.get("title") ?? "",
    startsAt: formData.get("startsAt") ?? "",
    durationMinutes: formData.get("durationMinutes") ?? "",
    descriptionMd: formData.get("descriptionMd") ?? "",
    rulesMd: formData.get("rulesMd") ?? "",
    problemSlugs: formData.getAll("problemSlugs"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        title: flat.title?.[0],
        startsAt: flat.startsAt?.[0],
        durationMinutes: flat.durationMinutes?.[0],
        descriptionMd: flat.descriptionMd?.[0],
        rulesMd: flat.rulesMd?.[0],
        problemSlugs:
          flat.problemSlugs?.[0] ?? (flat as Record<string, string[] | undefined>)[""]?.[0],
      },
    };
  }

  const input = parsed.data;

  // Every selected problem must exist and be published.
  const store = await getStore();
  for (const slug of input.problemSlugs) {
    const problem = await store.getBySlug(slug);
    if (!problem || problem.status !== "published") {
      return {
        fieldErrors: {
          problemSlugs: `Problem "${slug}" is not available (draft or missing).`,
        },
      };
    }
  }

  const slug = slugify(input.title);
  if (!slug) {
    return { fieldErrors: { title: "The title needs some letters or digits." } };
  }
  if (await store.getContestBySlug(slug)) {
    return {
      fieldErrors: {
        title: `A contest with the address "${slug}" already exists — pick a different title.`,
      },
    };
  }

  // datetime-local value interpreted as UTC (the field is labelled UTC).
  const startsAtMs = new Date(`${input.startsAt}:00Z`).getTime();
  if (Number.isNaN(startsAtMs)) {
    return { fieldErrors: { startsAt: "That start time could not be read." } };
  }
  const startsAt = new Date(startsAtMs).toISOString();
  const endsAt = new Date(startsAtMs + input.durationMinutes * 60 * 1000).toISOString();

  await store.createContest({
    slug,
    title: input.title,
    descriptionMd: input.descriptionMd || "A club contest on CP Arena.",
    startsAt,
    endsAt,
    durationMinutes: input.durationMinutes,
    problemSlugs: input.problemSlugs,
    rulesMd: input.rulesMd || ICPC_RULES_TEMPLATE,
    status: "published",
    createdBy: user.id,
  });

  revalidatePath("/contests");
  redirect(`/contests/${slug}`);
}

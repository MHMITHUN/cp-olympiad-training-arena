import { z } from "zod";

/**
 * Contest creation validation (spec 19.7, teacher create-contest form).
 * `startsAt` arrives from an <input type="datetime-local"> and is treated as
 * UTC (the field is labelled so) — club contests are scheduled in one
 * timezone and the scoreboard clock is UTC anyway.
 */

const DATETIME_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const CreateContestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Give the contest a descriptive title (5+ characters).")
    .max(120, "Keep the title under 120 characters."),
  startsAt: z
    .string()
    .regex(DATETIME_LOCAL, "Pick a start date and time (UTC)."),
  durationMinutes: z.coerce
    .number()
    .int("Duration must be a whole number of minutes.")
    .min(10, "A contest needs at least 10 minutes.")
    .max(600, "Contests longer than 10 hours are not supported."),
  descriptionMd: z
    .string()
    .trim()
    .max(4000, "Keep the description under 4000 characters.")
    .optional()
    .default(""),
  rulesMd: z
    .string()
    .trim()
    .max(20000, "Keep the rules under 20000 characters.")
    .optional()
    .default(""),
  problemSlugs: z
    .array(z.string().min(1))
    .min(1, "Select at least one published problem.")
    .max(10, "A contest can hold at most 10 problems."),
});

export type CreateContestInput = z.infer<typeof CreateContestSchema>;

export interface CreateContestFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof CreateContestInput, string>>;
}

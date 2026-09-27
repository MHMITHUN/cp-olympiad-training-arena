import { z } from "zod";

/** POST /api/run — "Run on sample" body (login required). */
export const runSampleSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required.")
    .max(100_000, "Code is too large (100 KB limit)."),
  problemSlug: z.string().min(1, "Problem slug is required.").max(120),
});

export type RunSampleInput = z.infer<typeof runSampleSchema>;

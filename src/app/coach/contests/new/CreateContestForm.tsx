"use client";

import { useActionState } from "react";
import { createContestAction } from "@/app/actions/contests";
import type { CreateContestFormState } from "@/lib/validation/contests";
import { ICPC_RULES_TEMPLATE } from "@/lib/db/seeds/contests";
import { DifficultyBadge } from "@/components/problems/DifficultyBadge";
import { Button, Field, Input, Textarea } from "@/components/ui";

export interface PickableProblem {
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  pathTitle: string;
}

const initialState: CreateContestFormState = {};

export function CreateContestForm({ problems }: { problems: PickableProblem[] }) {
  const [state, formAction, pending] = useActionState(
    createContestAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      <Field
        label="Title"
        name="contest-title"
        error={state.fieldErrors?.title}
        hint="The contest address is derived from the title, e.g. “Winter Sprint Round” -> /contests/winter-sprint-round."
      >
        {(aria) => (
          <Input
            id={aria.id}
            name="title"
            required
            placeholder="Winter Sprint Round"
            invalid={aria.invalid}
            aria-describedby={aria["aria-describedby"]}
            aria-invalid={aria["aria-invalid"]}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Start time (UTC)"
          name="contest-start"
          error={state.fieldErrors?.startsAt}
          hint="The countdown on /contests runs against this moment."
        >
          {(aria) => (
            <Input
              id={aria.id}
              name="startsAt"
              type="datetime-local"
              required
              invalid={aria.invalid}
              aria-describedby={aria["aria-describedby"]}
              aria-invalid={aria["aria-invalid"]}
            />
          )}
        </Field>
        <Field
          label="Duration (minutes)"
          name="contest-duration"
          error={state.fieldErrors?.durationMinutes}
          hint="10–600. Common rounds: 120 (2h) or 180 (3h)."
        >
          {(aria) => (
            <Input
              id={aria.id}
              name="durationMinutes"
              type="number"
              min={10}
              max={600}
              step={5}
              defaultValue={120}
              required
              invalid={aria.invalid}
              aria-describedby={aria["aria-describedby"]}
              aria-invalid={aria["aria-invalid"]}
            />
          )}
        </Field>
      </div>

      <Field
        label="Description"
        name="contest-description"
        error={state.fieldErrors?.descriptionMd}
        hint="Markdown. Shown on the contest page under the title."
      >
        {(aria) => (
          <Textarea
            id={aria.id}
            name="descriptionMd"
            rows={3}
            placeholder="Who the round is for and what it covers…"
            invalid={aria.invalid}
            aria-describedby={aria["aria-describedby"]}
            aria-invalid={aria["aria-invalid"]}
          />
        )}
      </Field>

      <Field
        label="Rules (Markdown)"
        name="contest-rules"
        error={state.fieldErrors?.rulesMd}
        hint="Left empty, the standard ICPC scoring rules are used."
      >
        {(aria) => (
          <Textarea
            id={aria.id}
            name="rulesMd"
            rows={8}
            defaultValue={ICPC_RULES_TEMPLATE}
            className="font-mono text-xs!"
            invalid={aria.invalid}
            aria-describedby={aria["aria-describedby"]}
            aria-invalid={aria["aria-invalid"]}
          />
        )}
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-fg">
          Problems <span className="font-normal text-muted">(pick 1–10)</span>
        </legend>
        <p
          className="text-xs text-danger"
          role="alert"
          hidden={!state.fieldErrors?.problemSlugs}
        >
          {state.fieldErrors?.problemSlugs}
        </p>
        <div className="grid max-h-80 gap-1 overflow-y-auto rounded-xl border border-border bg-surface p-2">
          {problems.length === 0 ? (
            <p className="p-4 text-xs text-muted">
              No published problems yet — create problems first.
            </p>
          ) : (
            problems.map((problem) => (
              <label
                key={problem.slug}
                className="flex cursor-pointer flex-wrap items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent"
              >
                <input
                  type="checkbox"
                  name="problemSlugs"
                  value={problem.slug}
                  className="size-4 accent-[#f59e0b]"
                />
                <span className="text-sm font-medium text-fg">
                  {problem.title}
                </span>
                <DifficultyBadge difficulty={problem.difficulty} />
                <span className="font-mono text-xs text-muted">
                  {problem.pathTitle}
                </span>
              </label>
            ))
          )}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending}>
          {pending ? "Creating…" : "Create contest"}
        </Button>
        <p className="text-xs text-muted">
          Published immediately with a live countdown.
        </p>
      </div>
    </form>
  );
}

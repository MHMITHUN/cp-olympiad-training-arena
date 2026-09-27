"use client";

import { useActionState } from "react";
import { registerAction, type AuthFormState } from "@/app/actions/auth";
import { Button, Field, Input } from "@/components/ui";

const initialState: AuthFormState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Field label="Full name" name="register-name" error={state.fieldErrors?.name}>
        {(aria) => (
          <Input
            id={aria.id}
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="e.g. Rakib Hasan"
            invalid={aria.invalid}
            aria-describedby={aria["aria-describedby"]}
            aria-invalid={aria["aria-invalid"]}
          />
        )}
      </Field>

      <Field
        label="Handle"
        name="register-handle"
        error={state.fieldErrors?.handle}
        hint="3-20 characters: lowercase letters, digits, underscores. This is your public contest identity."
      >
        {(aria) => (
          <Input
            id={aria.id}
            name="handle"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={20}
            placeholder="e.g. code_ninja"
            className="font-mono"
            invalid={aria.invalid}
            aria-describedby={aria["aria-describedby"]}
            aria-invalid={aria["aria-invalid"]}
          />
        )}
      </Field>

      <Field label="Email" name="register-email" error={state.fieldErrors?.email}>
        {(aria) => (
          <Input
            id={aria.id}
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            invalid={aria.invalid}
            aria-describedby={aria["aria-describedby"]}
            aria-invalid={aria["aria-invalid"]}
          />
        )}
      </Field>

      <Field
        label="Password"
        name="register-password"
        error={state.fieldErrors?.password}
        hint="At least 8 characters."
      >
        {(aria) => (
          <Input
            id={aria.id}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Choose a password"
            invalid={aria.invalid}
            aria-describedby={aria["aria-describedby"]}
            aria-invalid={aria["aria-invalid"]}
          />
        )}
      </Field>

      <Button type="submit" loading={pending} className="mt-2 w-full">
        {pending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}

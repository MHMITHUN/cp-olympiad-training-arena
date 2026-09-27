"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import { Play, Send } from "lucide-react";
import { Alert } from "@/components/ui";
import { submitSolutionAction } from "@/app/actions/submissions";
import type { SampleRunResult } from "@/lib/judge/run";
import type { JudgeMode, Verdict } from "@/lib/db/types";
import { formatRelative } from "@/lib/utils";
import { VerdictBadge } from "./VerdictBadge";

export interface WorkspaceSubmission {
  id: string;
  verdict: Verdict;
  judgeMode: JudgeMode;
  createdAt: string;
  runtimeMs?: number;
  memoryKb?: number;
}

export interface ProblemWorkspaceProps {
  problemSlug: string;
  starterCode: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  isLoggedIn: boolean;
  /** True when Judge0 env vars are set (real verdicts / real sample runs). */
  judgeConfigured: boolean;
  /** Latest 10 submissions by the signed-in user on this problem. */
  mySubmissions: WorkspaceSubmission[];
  /** Total submissions on this problem by everyone (recent activity). */
  problemSubmissionCount: number;
  /** Contest slug when this workspace lives inside a contest (tags the submission). */
  contestSlug?: string;
}

export function ProblemWorkspace({
  problemSlug,
  starterCode,
  timeLimitMs,
  memoryLimitMb,
  isLoggedIn,
  judgeConfigured,
  mySubmissions,
  problemSubmissionCount,
  contestSlug,
}: ProblemWorkspaceProps) {
  const router = useRouter();
  const [code, setCode] = useState(starterCode);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastVerdict, setLastVerdict] = useState<Verdict | null>(null);
  const [runResult, setRunResult] = useState<SampleRunResult | null>(null);
  const [, startRefresh] = useTransition();

  async function onSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitSolutionAction({
        problemSlug,
        code,
        ...(contestSlug !== undefined ? { contestSlug } : {}),
      });
      if (!result.ok) {
        setSubmitError(result.error ?? "Submission failed.");
      } else {
        setLastVerdict((result.verdict as Verdict) ?? null);
        startRefresh(() => router.refresh());
      }
    } catch {
      setSubmitError("Submission failed — network error.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onRunSample() {
    setRunning(true);
    setRunResult(null);
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, problemSlug }),
      });
      const data = (await response.json()) as SampleRunResult & {
        error?: string;
      };
      if (!response.ok) {
        setRunResult({
          mode: "demo",
          ok: false,
          note: data.error ?? "Run failed.",
          results: [],
        });
        return;
      }
      setRunResult(data);
    } catch {
      setRunResult({
        mode: "demo",
        ok: false,
        note: "Run failed — network error.",
        results: [],
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-fg">Workspace</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-accent">
            C++17
          </span>
          <span className="font-mono text-[11px] text-muted">
            TL {timeLimitMs} ms · ML {memoryLimitMb} MB
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <CodeMirror
          value={code}
          onChange={setCode}
          extensions={[cpp()]}
          theme={oneDark}
          height="340px"
          aria-label="C++ code editor"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            autocompletion: true,
            bracketMatching: true,
            closeBrackets: true,
            indentOnInput: true,
            tabSize: 4,
          }}
          style={{ fontSize: "13px" }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isLoggedIn ? (
          <>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-60"
            >
              <Send className="size-3.5" aria-hidden="true" />
              {submitting ? "Submitting…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={onRunSample}
              disabled={running}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-60"
            >
              <Play className="size-3.5" aria-hidden="true" />
              {running ? "Running…" : "Run on sample"}
            </button>
          </>
        ) : (
          <Alert tone="info">
            Browsing is open to everyone.{" "}
            <Link
              href={`/login?next=${encodeURIComponent(`/problems/${problemSlug}`)}`}
              className="font-semibold text-accent underline-offset-2 hover:underline"
            >
              Sign in
            </Link>{" "}
            to submit code and track progress.
          </Alert>
        )}
      </div>

      {!judgeConfigured && isLoggedIn && (
        <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
          Demo judge: submissions are recorded with verdict{" "}
          <span className="font-mono">recorded</span> for teacher review — no
          automatic verdicts. “Run on sample” replays recorded outputs for the
          exact reference solution only.
        </p>
      )}

      {submitError && (
        <Alert tone="danger" title="Submit failed">
          {submitError}
        </Alert>
      )}

      {lastVerdict && (
        <Alert
          tone={lastVerdict === "accepted" ? "success" : "info"}
          title={`Latest submission: ${lastVerdict.replace("_", " ")}`}
        >
          {lastVerdict === "recorded"
            ? "Demo mode - submission recorded for teacher review, not auto-judged."
            : "See your submissions below."}
        </Alert>
      )}

      {runResult && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-semibold text-fg">
            Run on sample{" "}
            <span className="font-mono text-xs text-muted">
              ({runResult.mode === "judge0" ? "Judge0 live" : "demo"})
            </span>
          </p>
          <p className="text-xs leading-relaxed text-muted">{runResult.note}</p>
          {runResult.results.length > 0 && (
            <div className="flex flex-col gap-3">
              {runResult.results.map((result, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded-lg border border-border bg-surface-2 p-3 md:grid-cols-2"
                >
                  <div>
                    <p className="mb-1 font-mono text-[11px] uppercase text-muted">
                      input
                    </p>
                    <pre className="overflow-x-auto font-mono text-xs text-fg">
                      <code>{result.input}</code>
                    </pre>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[11px] uppercase text-muted">
                      output
                    </p>
                    <pre className="overflow-x-auto font-mono text-xs text-fg">
                      <code>{result.actual ?? "—"}</code>
                    </pre>
                    {result.actual !== undefined &&
                      result.actual.trim() !== result.expected.trim() && (
                        <p className="mt-1 font-mono text-[11px] text-danger">
                          expected: {result.expected}
                        </p>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-fg">
            Your submissions{" "}
            <span className="font-normal text-muted">(latest 10)</span>
          </h3>
          <span className="font-mono text-[11px] text-muted">
            {problemSubmissionCount} submission
            {problemSubmissionCount === 1 ? "" : "s"} on this problem
          </span>
        </div>

        {mySubmissions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface p-4 text-xs text-muted">
            {isLoggedIn
              ? "No submissions yet on this problem — yours will appear here."
              : "Sign in to see your submission history."}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
            {mySubmissions.map((submission) => (
              <li
                key={submission.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5"
              >
                <VerdictBadge verdict={submission.verdict} />
                <span className="font-mono text-xs text-muted">
                  {formatRelative(submission.createdAt)}
                </span>
                {submission.runtimeMs !== undefined && (
                  <span className="font-mono text-xs text-muted">
                    {submission.runtimeMs} ms
                  </span>
                )}
                {submission.memoryKb !== undefined && (
                  <span className="font-mono text-xs text-muted">
                    {Math.round(submission.memoryKb / 1024)} MB
                  </span>
                )}
                {submission.judgeMode === "seed" ? (
                  <span
                    title="Row from the seeded sample club history"
                    className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted"
                  >
                    sample
                  </span>
                ) : submission.judgeMode === "demo" ? (
                  <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent">
                    demo · teacher review
                  </span>
                ) : (
                  <span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                    judge0
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

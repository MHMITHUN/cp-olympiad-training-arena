"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { ProblemExample } from "@/lib/db/types";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (permissions / http): show no false success.
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {copied ? (
        <Check className="size-3 text-success" aria-hidden="true" />
      ) : (
        <Copy className="size-3" aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Block({
  title,
  text,
  onCopy,
}: {
  title: string;
  text: string;
  onCopy: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </span>
        <CopyButton text={onCopy} label={title} />
      </div>
      <pre className="overflow-x-auto rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed text-fg">
        <code>{text}</code>
      </pre>
    </div>
  );
}

/** Examples with copy buttons — input, output and the optional explanation. */
export function Examples({ examples }: { examples: ProblemExample[] }) {
  return (
    <div className="flex flex-col gap-5">
      {examples.map((example, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
        >
          <p className="font-mono text-xs font-semibold text-accent">
            Example {index + 1}
          </p>
          <Block title="Input" text={example.input} onCopy={example.input} />
          <Block title="Output" text={example.output} onCopy={example.output} />
          {example.explanation && (
            <p className="text-xs leading-relaxed text-muted">
              {example.explanation}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

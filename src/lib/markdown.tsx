import type { ReactNode } from "react";

/**
 * Tiny dependency-free Markdown renderer for the seed-authored content
 * (statements, constraints, hints, editorials). It supports exactly the
 * subset the content uses — headings, paragraphs, bullet/numbered lists,
 * fenced code blocks, inline `code`, **bold** — and renders React nodes,
 * so no HTML string is ever injected. Unknown syntax falls back to plain
 * text, never raw markup.
 */

interface Block {
  kind: "heading" | "paragraph" | "code" | "list";
  level?: number;
  text?: string;
  lang?: string;
  items?: string[];
  ordered?: boolean;
}

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { items: string[]; ordered: boolean } | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ kind: "list", items: list.items, ordered: list.ordered });
      list = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      flushParagraph();
      flushList();
      const lang = line.slice(3).trim() || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ kind: "code", text: codeLines.join("\n"), lang });
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        text: heading[2],
      });
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^(\d+)[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      const item = bullet ? bullet[1] : numbered![2];
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { items: [item], ordered };
      } else {
        list.items.push(item);
      }
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  return blocks;
}

/** Inline `code` and **bold** spans; everything else is plain text. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let rest = text;
  let key = 0;

  while (rest.length > 0) {
    const codeMatch = /`([^`]+)`/.exec(rest);
    const boldMatch = /\*\*([^*]+)\*\*/.exec(rest);
    const match =
      codeMatch && boldMatch
        ? codeMatch.index <= boldMatch.index
          ? codeMatch
          : boldMatch
        : (codeMatch ?? boldMatch);

    if (!match) {
      parts.push(rest);
      break;
    }

    if (match.index > 0) parts.push(rest.slice(0, match.index));
    const isCode = match === codeMatch && match[0].startsWith("`");
    parts.push(
      isCode ? (
        <code
          key={`${keyPrefix}-c${key++}`}
          className="rounded border border-border bg-surface-2 px-1 py-0.5 font-mono text-[0.85em] text-fg"
        >
          {match[1]}
        </code>
      ) : (
        <strong key={`${keyPrefix}-b${key++}`} className="font-semibold text-fg">
          {match[1]}
        </strong>
      ),
    );
    rest = rest.slice(match.index + match[0].length);
  }
  return parts;
}

const headingClass: Record<number, string> = {
  1: "text-xl font-bold tracking-tight text-fg",
  2: "text-base font-semibold text-fg",
  3: "text-sm font-semibold text-fg",
  4: "text-sm font-semibold text-muted",
};

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => {
        const key = `b${index}`;
        switch (block.kind) {
          case "heading":
            return (
              <h3
                key={key}
                className={
                  block.level
                    ? `${headingClass[block.level] ?? headingClass[3]} mt-2 first:mt-0`
                    : headingClass[3]
                }
              >
                {renderInline(block.text ?? "", key)}
              </h3>
            );
          case "code":
            return (
              <pre
                key={key}
                className="overflow-x-auto rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed text-fg"
              >
                <code>{block.text}</code>
              </pre>
            );
          case "list":
            return block.ordered ? (
              <ol
                key={key}
                className="ml-5 list-decimal space-y-1.5 text-sm leading-relaxed text-fg/90"
              >
                {block.items?.map((item, i) => (
                  <li key={`${key}-i${i}`}>{renderInline(item, `${key}-i${i}`)}</li>
                ))}
              </ol>
            ) : (
              <ul
                key={key}
                className="ml-5 list-disc space-y-1.5 text-sm leading-relaxed text-fg/90"
              >
                {block.items?.map((item, i) => (
                  <li key={`${key}-i${i}`}>{renderInline(item, `${key}-i${i}`)}</li>
                ))}
              </ul>
            );
          default:
            return (
              <p key={key} className="text-sm leading-relaxed text-fg/90">
                {renderInline(block.text ?? "", key)}
              </p>
            );
        }
      })}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useId } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export interface MobileNavUser {
  name: string;
  handle: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
}

interface MobileNavProps {
  links: Array<{ href: string; label: string }>;
  user: MobileNavUser | null;
}

/**
 * Hamburger disclosure for small screens. Accessible: the button is
 * aria-expanded + aria-controls, the panel is a labelled region, and Esc
 * closes it. Hidden entirely on md+ screens.
 */
export function MobileNav({ links, user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-2 text-fg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {open ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <Menu className="size-5" aria-hidden="true" />
        )}
      </button>

      <div
        id={panelId}
        ref={panelRef}
        hidden={!open}
        className="absolute left-0 right-0 top-14 z-40 border-b border-border bg-surface shadow-sm"
      >
        <nav aria-label="Mobile" className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <p className="px-3 pb-1 pt-3 font-mono text-xs text-muted">
              Signed in as @{user.handle} ({user.role.toLowerCase()})
            </p>
          )}
        </nav>
      </div>
    </div>
  );
}

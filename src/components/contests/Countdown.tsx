"use client";

import { useEffect, useRef } from "react";

/**
 * Live countdown to a target instant (spec 19.7: upcoming contests show a
 * live countdown on /contests and their detail page).
 *
 * SSR renders a plain absolute timestamp (deterministic, no hydration
 * mismatch); after mount an interval rewrites the text node directly, so no
 * state is set inside an effect and the clock stays accurate to the second.
 */

const PAD = (value: number) => String(value).padStart(2, "0");

function formatRemaining(targetMs: number, nowMs: number): string {
  const diff = targetMs - nowMs;
  if (diff <= 0) return "Started";
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return days > 0
    ? `${days}d ${PAD(hours)}:${PAD(minutes)}:${PAD(seconds)}`
    : `${PAD(hours)}:${PAD(minutes)}:${PAD(seconds)}`;
}

export function Countdown({ targetIso }: { targetIso: string }) {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const targetMs = new Date(targetIso).getTime();
    if (Number.isNaN(targetMs)) return;

    const render = () => {
      el.textContent = formatRemaining(targetMs, Date.now());
    };
    render();
    const id = window.setInterval(render, 1000);
    return () => window.clearInterval(id);
  }, [targetIso]);

  return (
    <span className="font-mono tabular-nums" suppressHydrationWarning>
      <span ref={textRef}>{targetIso}</span>
    </span>
  );
}

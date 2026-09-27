/**
 * Captures the documentation screenshots (docs/screenshots/*.png).
 *
 * Shots (spec docs): 01 home, 02 problem page with the code editor,
 * 03 contest page with its live countdown, 04 the problems list at phone
 * width, 05 the coach dashboard behind a teacher login.
 *
 * Reuses a dev server already listening on :3004, otherwise boots one
 * (`npm run dev`) and stops it on exit. Every capture must be > 20 KB or
 * the script fails — a blank/missing shot is a broken doc, not a warning.
 *
 * Usage: node scripts/screenshots.mjs
 */

import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "docs", "screenshots");
const BASE_URL = "http://localhost:3004";
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };
const MIN_BYTES = 20 * 1024;

/** True when something already serves the arena on :3004. */
async function isServerUp() {
  try {
    const response = await fetch(BASE_URL, {
      redirect: "follow",
      signal: AbortSignal.timeout(2_000),
    });
    return response.ok || response.status >= 300; // any HTTP answer counts
  } catch {
    return false;
  }
}

/** Boot `npm run dev`; the caller polls :3004 and kills the tree on exit. */
function startDevServer() {
  // No detach/unref here: a detached+shell spawn dies silently on Windows
  // before npm reaches `next dev`. Keeping the handle lets us taskkill the
  // whole tree (npm -> node -> next) in stopTree() instead.
  // Single command string (not args): avoids the shell-concat warning.
  return spawn("npm run dev", {
    cwd: ROOT,
    shell: true,
    stdio: "ignore",
  });
}

async function waitForServer(timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isServerUp()) return true;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  return false;
}

/** Kill a whole process tree (npm spawns node spawns next). */
function stopTree(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
      shell: true,
      stdio: "ignore",
    });
  } else {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
}

let spawnedPid = null;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  if (await isServerUp()) {
    console.log("Reusing dev server on " + BASE_URL);
  } else {
    console.log("Starting dev server on " + BASE_URL + " …");
    const child = startDevServer();
    spawnedPid = child.pid;
    if (!(await waitForServer())) {
      throw new Error("Dev server did not become ready on " + BASE_URL);
    }
  }

  const browser = await chromium.launch();
  const shots = [];
  try {
    const page = await browser.newPage({
      viewport: DESKTOP,
      deviceScaleFactor: 1,
    });

    // 01 — home: hero + curriculum grid -------------------------------
    await page.goto(BASE_URL + "/", { waitUntil: "load", timeout: 90_000 });
    await page
      .getByRole("heading", { name: "Ten paths, one curriculum" })
      .waitFor({ timeout: 60_000 });
    await page.waitForTimeout(400); // let animations settle
    shots.push(["01-home.png", await page.screenshot({ fullPage: true })]);

    // 02 — problem page with the C++ editor ---------------------------
    await page.goto(BASE_URL + "/problems/sum-two-numbers", {
      waitUntil: "load",
      timeout: 90_000,
    });
    await page.locator(".cm-editor").waitFor({ timeout: 60_000 });
    await page.waitForTimeout(600); // CodeMirror syntax highlight pass
    shots.push([
      "02-problem.png",
      await page.screenshot({ fullPage: true }),
    ]);

    // 03 — upcoming contest with its live countdown -------------------
    await page.goto(BASE_URL + "/contests/autumn-training-contest", {
      waitUntil: "load",
      timeout: 90_000,
    });
    const countdown = page.getByLabel("Countdown to contest start");
    try {
      await countdown.waitFor({ timeout: 20_000 });
      await page.waitForTimeout(1_200); // one real countdown tick
    } catch {
      // Running contest: the scoreboard is the story instead.
      await page.getByRole("table").first().waitFor({ timeout: 20_000 });
    }
    shots.push(["03-contest.png", await page.screenshot({ fullPage: true })]);

    // 04 — problems list at phone width -------------------------------
    const mobile = await browser.newPage({
      viewport: MOBILE,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await mobile.goto(BASE_URL + "/problems", {
      waitUntil: "load",
      timeout: 90_000,
    });
    await mobile.getByRole("table").first().waitFor({ timeout: 60_000 });
    await mobile.waitForTimeout(400);
    shots.push(["04-mobile.png", await mobile.screenshot({ fullPage: true })]);
    await mobile.close();

    // 05 — coach dashboard behind a teacher sign-in -------------------
    await page.goto(BASE_URL + "/login", {
      waitUntil: "load",
      timeout: 90_000,
    });
    await page.getByLabel("Email").fill("teacher@demo.local");
    await page.getByLabel("Password").fill("Demo@12345");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/coach", { timeout: 60_000 });
    await page
      .getByRole("heading", { name: "Club dashboard" })
      .waitFor({ timeout: 60_000 });
    await page.waitForTimeout(600); // charts finish drawing
    shots.push(["05-coach.png", await page.screenshot({ fullPage: true })]);
  } finally {
    await browser.close();
  }

  // Persist + size gate.
  let failed = false;
  for (const [name, buffer] of shots) {
    const file = path.join(OUT_DIR, name);
    const { writeFile } = await import("node:fs/promises");
    await writeFile(file, buffer);
    const size = (await stat(file)).size;
    const ok = size > MIN_BYTES;
    console.log(
      (ok ? "OK   " : "SMALL") + " " + name + " " + (size / 1024).toFixed(1) + " KB",
    );
    if (!ok) failed = true;
  }

  if (failed) {
    throw new Error("A screenshot was missing or under " + MIN_BYTES + " bytes");
  }
  console.log("All screenshots captured.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => stopTree(spawnedPid));

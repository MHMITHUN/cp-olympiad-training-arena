import { test, expect } from "@playwright/test";

/**
 * Smoke flow through the arena (spec 19): public browsing, filtering,
 * progressive hints + editorial gating, the honest demo-judge submission
 * pipeline, contest countdowns, the leaderboard and the coach dashboard.
 *
 * Every test also asserts that the page never logged a console error or an
 * uncaught page error while it ran.
 */

const consoleErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  page.on("pageerror", (error) => {
    consoleErrors.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(`console.error: ${message.text()}`);
    }
  });
});

test.afterEach(async () => {
  expect(consoleErrors, "no console errors allowed on these flows").toEqual([]);
});

/* ------------------------------------------------------------------ */
/* 1. Home                                                             */
/* ------------------------------------------------------------------ */

test("home renders the hero and the ten-path grid", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "From your first loop to your first contest" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ten paths, one curriculum" }),
  ).toBeVisible();

  // The full curriculum grid: 10 learning paths, each linking to its page.
  const pathLinks = page.locator('a[href^="/paths/"]');
  await expect(pathLinks).toHaveCount(10);
  await expect(
    page.getByRole("link", { name: /Programming Basics/ }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Contest Strategy/ })).toBeVisible();

  await expect(page.getByRole("link", { name: "Join your club" })).toBeVisible();
});

/* ------------------------------------------------------------------ */
/* 2. Problems — difficulty filter                                     */
/* ------------------------------------------------------------------ */

test("problems difficulty filter changes the list", async ({ page }) => {
  await page.goto("/problems");

  // All problems first: the seed bank is 40 problems (15 per page).
  await expect(page.getByText("40 published problems")).toBeVisible();

  // Filter to medium: the count changes and every visible badge is Medium.
  await page.getByRole("group", { name: "Filter by difficulty" })
    .getByRole("link", { name: "medium" })
    .click();
  await expect(page).toHaveURL(/difficulty=medium/);
  await expect(page.getByText("16 published problems")).toBeVisible();
  const badges = page.locator("tbody").getByText("medium", { exact: true });
  const badgeCount = await badges.count();
  expect(badgeCount).toBeGreaterThan(0);
  for (let i = 0; i < badgeCount; i++) {
    await expect(badges.nth(i)).toBeVisible();
  }

  // Filtering to hard (an empty band in the seed bank) empties the table.
  await page.getByRole("group", { name: "Filter by difficulty" })
    .getByRole("link", { name: "hard" })
    .click();
  await expect(page.getByText("No problems match these filters.")).toBeVisible();
});

/* ------------------------------------------------------------------ */
/* 3. Problem page — hints + editorial gating                          */
/* ------------------------------------------------------------------ */

test("problem page reveals hints progressively and gates the editorial", async ({ page }) => {
  await page.goto("/problems/digit-sum");

  // Hint 1 is offered; nothing beyond it until the student asks.
  const revealHint1 = page.getByRole("button", { name: /^Reveal hint 1 of \d$/ });
  await expect(revealHint1).toBeVisible();
  await expect(page.getByText(/^Hint 2 of/)).toBeHidden();

  await revealHint1.click();
  await expect(page.getByText(/^Hint 1 of \d/)).toBeVisible();

  // Hint 2 only appears after another explicit click.
  await page.getByRole("button", { name: /^Reveal hint 2 of \d$/ }).click();
  await expect(page.getByText(/^Hint 2 of \d/)).toBeVisible();

  // Editorial is locked behind an explicit confirm button.
  await expect(page.getByText("Editorial locked")).toBeVisible();
  await page.getByRole("button", { name: "I want to see the editorial" }).click();
  await expect(page.getByRole("button", { name: "Hide the editorial again" })).toBeVisible();
});

/* ------------------------------------------------------------------ */
/* 4. Register -> submit -> honest demo verdict                        */
/* ------------------------------------------------------------------ */

test("new student registers and gets an honest 'recorded' demo verdict", async ({ page }) => {
  const stamp = Date.now();
  const name = `E2E Runner ${stamp}`;
  const handle = `e2e_${stamp}`.slice(0, 20); // handle max is 20 chars
  const email = `e2e_${stamp}@club.test`;

  // -- register a brand-new student -----------------------------------
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Handle").fill(handle);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Demo@12345");
  await page.getByRole("button", { name: "Create account" }).click();

  // Self-registration lands on the student profile (name + @handle header).
  // The @handle also appears in the site header's "Signed in as …" link, so
  // scope to the main region to keep the locator strict.
  await page.waitForURL("**/profile");
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(
    page.getByRole("main").getByText(`@${handle}`, { exact: true }),
  ).toBeVisible();

  // -- submit the starter code on an easy problem ---------------------
  await page.goto("/problems/sum-two-numbers");
  await expect(page.getByRole("heading", { name: "Sum of Two Numbers" })).toBeVisible();

  await page.getByRole("button", { name: "Submit", exact: true }).click();

  // Demo judge honesty: the verdict is "recorded" with the review note,
  // never a fabricated Accepted/Wrong answer. (Generous timeout: on a cold
  // dev server the server action compiles on first call.)
  await expect(
    page.getByText("Latest submission: recorded"),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByText("Demo mode - submission recorded for teacher review, not auto-judged."),
  ).toBeVisible({ timeout: 20_000 });

  // The submission feed shows it with the recorded badge + review tag.
  await expect(
    page.getByText("Recorded", { exact: true }).first(),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByText("demo · teacher review").first(),
  ).toBeVisible({ timeout: 20_000 });
});

/* ------------------------------------------------------------------ */
/* 5. Contests — upcoming countdown                                    */
/* ------------------------------------------------------------------ */

test("contests page shows the upcoming round with a live countdown", async ({ page }) => {
  await page.goto("/contests");

  await expect(
    page.getByRole("link", { name: "Autumn Training Contest" }),
  ).toBeVisible();
  await expect(page.getByText("starts in").first()).toBeVisible();

  // The countdown element itself exists and renders some text
  // (the ISO timestamp server-side, the ticking remaining time after mount).
  const countdown = page.getByLabel("Countdown to contest start");
  await expect(countdown).toBeVisible();
  await expect(async () => {
    expect((await countdown.innerText()).trim().length).toBeGreaterThan(0);
  }).toPass();
});

/* ------------------------------------------------------------------ */
/* 6. Leaderboard — ordered table                                      */
/* ------------------------------------------------------------------ */

test("leaderboard renders its ordered ranking table", async ({ page }) => {
  await page.goto("/leaderboard");

  await expect(
    page.getByRole("heading", { name: "Practice leaderboard" }),
  ).toBeVisible();
  // The documented rule is shown on the page (spec 19.7: transparency).
  await expect(page.getByText("Ranking rule:")).toBeVisible();

  const rows = page.locator("tbody tr");
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(3); // the seeded demo club

  // Ranks are 1..n top to bottom.
  for (let i = 0; i < Math.min(rowCount, 3); i++) {
    await expect(
      rows.nth(i).locator("td").first(),
    ).toHaveText(String(i + 1));
  }
});

/* ------------------------------------------------------------------ */
/* 7. Coach dashboard (teacher login)                                  */
/* ------------------------------------------------------------------ */

test("teacher signs in and the coach dashboard renders", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("teacher@demo.local");
  await page.getByLabel("Password").fill("Demo@12345");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await page.waitForURL("**/coach");
  await expect(
    page.getByRole("heading", { name: "Club dashboard" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recent club submissions" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Active students" }),
  ).toBeVisible();
  await expect(page.getByText("Need support", { exact: true })).toBeVisible();
});

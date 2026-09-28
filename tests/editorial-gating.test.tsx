import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { getStore, resetStoreForTests } from "@/lib/db";
import { isProblemVisible } from "@/lib/problems/visibility";
import { EditorialReveal } from "@/components/problems/EditorialReveal";
import { HintsPanel } from "@/components/problems/HintsPanel";
import { revealHint, revealEditorial } from "@/app/actions/reveal";

/**
 * Editorial/hint gating + draft invisibility (spec 19.4):
 * - drafts never appear publicly (store list + visibility rule);
 * - hint/editorial text is never exposed before the student chooses to
 *   reveal it. The panels receive ONLY counts/flags as props and fetch the
 *   text from the reveal server actions on click, so the initial HTML /
 *   RSC payload carries no spoiler. The actions themselves are covered in
 *   tests/reveal-actions.test.tsx; here they are mocked so each panel's
 *   loading/content/error states can be driven deterministically.
 */

vi.mock("@/app/actions/reveal", () => ({
  revealHint: vi.fn(),
  revealEditorial: vi.fn(),
}));

beforeEach(() => {
  resetStoreForTests();
  vi.clearAllMocks();
});

describe("draft problems are invisible publicly", () => {
  it("excludes drafts from listPublished", async () => {
    const store = await getStore();
    const before = await store.listPublished();

    await store.createProblem({
      slug: "draft-dry-run",
      title: "Coach Draft (unpublished)",
      statementMd: "Draft statement.",
      difficulty: "easy",
      pathSlug: "problem-solving",
      topics: ["drafts"],
      constraintsMd: "- n <= 10",
      examples: [{ input: "1", output: "1" }],
      starterCodeCpp: "int main() { return 0; }",
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      hints: ["draft hint"],
      editorialMd: "Draft editorial.",
      status: "draft",
      authorId: "usr-teacher-01",
    });

    const after = await store.listPublished();
    expect(after.total).toBe(before.total);
    expect(after.items.some((p) => p.slug === "draft-dry-run")).toBe(false);
  });

  it("getBySlug still returns drafts (coach area) but visibility rules hide them", async () => {
    const store = await getStore();
    const draft = await store.getBySlug("draft-dry-run");
    expect(draft).toBeNull(); // not created in this test's fresh store

    const published = await store.getBySlug("sum-two-numbers");
    expect(published).not.toBeNull();

    expect(isProblemVisible(published!, null)).toBe(true);
    expect(isProblemVisible(published!, { role: "STUDENT" })).toBe(true);

    // A draft problem object is public to no one but staff.
    const draftObject = { ...published!, status: "draft" as const };
    expect(isProblemVisible(draftObject, null)).toBe(false);
    expect(isProblemVisible(draftObject, { role: "STUDENT" })).toBe(false);
    expect(isProblemVisible(draftObject, { role: "TEACHER" })).toBe(true);
    expect(isProblemVisible(draftObject, { role: "ADMIN" })).toBe(true);
  });
});

describe("editorial is revealed only by explicit choice", () => {
  it("ships no editorial text in the locked state, then loads it on confirm", async () => {
    const secret = "The secret approach is two pointers meeting in the middle.";
    vi.mocked(revealEditorial).mockResolvedValue(
      `## Approach\n\n${secret}`,
    );
    const { container } = render(
      <EditorialReveal problemSlug="digit-sum" hasEditorial />,
    );

    // Locked state: the solution text must not be in the document — it is
    // not in the props and nothing has been fetched yet.
    expect(screen.queryByText(/secret approach/i)).toBeNull();
    const button = screen.getByRole("button", {
      name: "I want to see the editorial",
    });
    expect(button).toBeDefined();

    fireEvent.click(button);

    // Opted-in state: the server action ran and the solution text is now
    // visible. The call carried only the slug, never the content.
    expect(vi.mocked(revealEditorial).mock.calls[0]).toEqual(["digit-sum"]);
    expect(await screen.findByText(/secret approach/i)).toBeDefined();
    expect(container).toBeDefined();
  });

  it("shows an honest error state when the editorial cannot be loaded", async () => {
    vi.mocked(revealEditorial).mockRejectedValue(new Error("network"));
    render(<EditorialReveal problemSlug="digit-sum" hasEditorial />);

    fireEvent.click(
      screen.getByRole("button", { name: "I want to see the editorial" }),
    );
    expect(await screen.findByText(/could not load the editorial/i)).toBeDefined();
    // A retry is offered.
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeDefined();
  });

  it("renders nothing when the problem has no editorial", () => {
    const { container } = render(
      <EditorialReveal problemSlug="digit-sum" hasEditorial={false} />,
    );
    expect(container.innerHTML).toBe("");
  });
});

describe("hints are revealed progressively, one fetch per click", () => {
  it("renders no hint text initially and loads one hint per click", async () => {
    const firstHint = "Read `n` as a `string` to dodge overflow.";
    vi.mocked(revealHint).mockResolvedValue(firstHint);
    render(<HintsPanel problemSlug="digit-sum" hintCount={3} />);

    // Nothing revealed: the count is known, the text is not in the document.
    expect(screen.queryByText(/dodge overflow/i)).toBeNull();
    expect(screen.queryByText(/^Hint 1 of/)).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Reveal hint 1 of 3" }),
    );

    expect(await screen.findByText(/^Hint 1 of 3$/)).toBeDefined();
    expect(screen.getByText(/dodge overflow/i)).toBeDefined();
    // Only the action call carried data — the slug and the index.
    expect(vi.mocked(revealHint).mock.calls[0]).toEqual(["digit-sum", 0]);

    // Hint 2 stays hidden until the next explicit click.
    expect(screen.queryByText(/^Hint 2 of/)).toBeNull();
    expect(
      screen.getByRole("button", { name: "Reveal hint 2 of 3" }),
    ).toBeDefined();
  });

  it("shows an honest error state when a hint cannot be loaded", async () => {
    vi.mocked(revealHint).mockRejectedValue(new Error("Hint index out of range."));
    render(<HintsPanel problemSlug="digit-sum" hintCount={2} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Reveal hint 1 of 2" }),
    );
    expect(await screen.findByText(/could not load this hint/i)).toBeDefined();
    // The reveal button remains available for a retry.
    expect(
      screen.getByRole("button", { name: "Reveal hint 1 of 2" }),
    ).toBeDefined();
  });

  it("renders nothing for a problem without hints", () => {
    const { container } = render(
      <HintsPanel problemSlug="digit-sum" hintCount={0} />,
    );
    expect(container.innerHTML).toBe("");
  });
});

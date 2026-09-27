/**
 * Judge0 environment resolution. Real mode requires BOTH JUDGE0_API_URL and
 * JUDGE0_API_KEY; anything else is demo mode (honest recording, no verdicts).
 */

export function getJudge0Config(): {
  url: string;
  key: string;
} | null {
  const url = process.env.JUDGE0_API_URL?.trim();
  const key = process.env.JUDGE0_API_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
}

export function isJudge0Configured(): boolean {
  return getJudge0Config() !== null;
}

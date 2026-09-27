/**
 * Wall-clock access for server components.
 *
 * react-hooks v6 (purity rule) flags `Date.now()` / `new Date()` calls
 * directly inside component bodies. Reading the clock when rendering a
 * `force-dynamic` server page is deliberate and correct (the page IS
 * request-time data), so the impurity is concentrated in this one helper
 * with a single, documented purpose.
 */

/** Current wall-clock time in milliseconds. */
export function nowMs(): number {
  return Date.now();
}

/** Current wall-clock time as a Date (pass into pure helpers in tests). */
export function nowDate(): Date {
  return new Date();
}

/** Shared page-size defaults for feed/profile list queries. */
export const DEFAULT_PAGE_SIZE = 30;
export const FEED_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

/** Clamp client-requested limits to a safe bounded range. */
export function clampLimit(limit?: number, fallback = DEFAULT_PAGE_SIZE): number {
  const n = limit ?? fallback;
  return Math.min(Math.max(1, Math.floor(n)), MAX_PAGE_SIZE);
}

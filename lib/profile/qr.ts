/**
 * Profile QR scaffolding (§21).
 * Deep links resolve to /u/[username] in-app and on the web once Expo web is hosted.
 */

export function profileShareUrl(username: string): string {
  const handle = username.trim().replace(/^@/, "");
  return `https://raftoffsocial.com/u/${encodeURIComponent(handle)}`;
}

/** Payload string for a future QR renderer (stickers, dock signs, merch). */
export function profileQrPayload(username: string): string {
  return profileShareUrl(username);
}

export function parseProfileDeepLink(url: string): string | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/^\/u\/([^/]+)\/?$/i) || u.pathname.match(/^\/profile\/([^/]+)\/?$/i);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

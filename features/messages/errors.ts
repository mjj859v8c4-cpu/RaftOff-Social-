/**
 * get_or_create_dm raises Postgres exceptions when message_privacy or a block
 * stops a thread from opening (20260808200000_dm_privacy_and_reports.sql).
 * Those strings are for logs — this turns them into copy a boater can act on.
 */
export function describeDmError(error: unknown): string {
  const raw = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();

  if (raw.includes("messaging blocked")) {
    return "You two can’t message — one of you has blocked the other.";
  }
  if (raw.includes("restricted to connections")) {
    return "They only accept messages from connections. Send a connect request first.";
  }
  if (raw.includes("messaging restricted")) {
    return "They only accept messages from people they follow or are connected to.";
  }
  if (raw.includes("profile not found")) {
    return "That profile isn’t available anymore.";
  }
  if (raw.includes("not authenticated")) {
    return "Sign in to send messages.";
  }
  return error instanceof Error && error.message
    ? error.message
    : "Couldn’t open the chat — try again.";
}

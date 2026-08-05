import { colors as theme } from "@/lib/theme";

/** Color tokens shaped like Corey's LakeMap snippets (maps onto RaftOff theme). */
export function useColors() {
  return {
    background: theme.bg,
    foreground: theme.text,
    card: theme.bgElevated,
    border: theme.line,
    primary: theme.action,
    secondary: theme.active,
    mutedForeground: theme.muted,
  };
}

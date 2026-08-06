import * as Sentry from "@sentry/react-native";
import { logger } from "@/lib/logging";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";

export const isSentryConfigured =
  Boolean(dsn) && dsn.startsWith("https://") && !dsn.includes("YOUR_SENTRY");

let initialized = false;

export function initCrashReporting() {
  if (initialized || !isSentryConfigured) return;
  try {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.15,
      environment: __DEV__ ? "development" : "production",
    });
    initialized = true;
    logger.info("crashReporting.initialized");
  } catch (e) {
    console.warn("Sentry init failed", e);
  }
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!isSentryConfigured || !initialized) return;
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, context?: Record<string, unknown>) {
  if (!isSentryConfigured || !initialized) return;
  Sentry.captureMessage(message, { extra: context });
}

export function setUserContext(user: { id: string; email?: string | null; username?: string } | null) {
  if (!isSentryConfigured || !initialized) return;
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({ id: user.id, email: user.email ?? undefined, username: user.username });
}

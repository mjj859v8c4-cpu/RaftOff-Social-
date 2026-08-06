type LogLevel = "debug" | "info" | "warn" | "error";

type LogPayload = Record<string, unknown> | Error | unknown;

function serialize(payload: LogPayload) {
  if (payload instanceof Error) {
    return { message: payload.message, stack: payload.stack, name: payload.name };
  }
  return payload;
}

function emit(level: LogLevel, message: string, payload?: LogPayload) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    payload: payload === undefined ? undefined : serialize(payload),
  };

  if (__DEV__) {
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(`[raftoff:${level}]`, message, entry.payload ?? "");
  }

  // Production: forward errors to Sentry when available
  if (level === "error") {
    try {
      // Lazy require avoids circular init with crash reporting
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { captureException, captureMessage } = require("@/lib/crashReporting");
      if (payload instanceof Error) captureException(payload, { message });
      else captureMessage(message, { extra: entry.payload });
    } catch {
      // no-op if crash reporting not ready
    }
  }
}

export const logger = {
  debug: (message: string, payload?: LogPayload) => emit("debug", message, payload),
  info: (message: string, payload?: LogPayload) => emit("info", message, payload),
  warn: (message: string, payload?: LogPayload) => emit("warn", message, payload),
  error: (message: string, payload?: LogPayload) => emit("error", message, payload),
};

type LogContext = Record<string, unknown>;

function normalizeContext(context?: LogContext) {
  return context && Object.keys(context).length > 0 ? context : undefined;
}

export function logServerInfo(scope: string, message: string, context?: LogContext) {
  console.info(`[${scope}] ${message}`, normalizeContext(context));
}

export function logServerWarn(scope: string, message: string, context?: LogContext) {
  console.warn(`[${scope}] ${message}`, normalizeContext(context));
}

export function logServerError(scope: string, message: string, error: unknown, context?: LogContext) {
  const payload = {
    ...(normalizeContext(context) ?? {}),
    error: error instanceof Error ? error.message : error
  };

  console.error(`[${scope}] ${message}`, payload);
}

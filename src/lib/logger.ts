/* ═══════════════════════════════════════════════
   Structured Logger
   JSON-formatted logging for debugging + monitoring
   ═══════════════════════════════════════════════ */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && Object.keys(context).length > 0 ? { context } : {}),
  };
}

/**
 * Structured JSON logger.
 * Outputs structured logs for Vercel/Cloud Logging ingestion.
 */
export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    console.log(JSON.stringify(formatLog("info", message, context)));
  },

  warn(message: string, context?: Record<string, unknown>) {
    console.warn(JSON.stringify(formatLog("warn", message, context)));
  },

  error(message: string, context?: Record<string, unknown>) {
    console.error(JSON.stringify(formatLog("error", message, context)));
  },

  debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      console.debug(JSON.stringify(formatLog("debug", message, context)));
    }
  },
};

/**
 * Timer utility for pipeline step profiling.
 * Usage:
 *   const timer = createTimer("processBatch");
 *   timer.step("parsing");
 *   // ... do work ...
 *   timer.step("matching");
 *   // ... do work ...
 *   timer.done(); // logs total elapsed
 */
export function createTimer(operation: string) {
  const start = Date.now();
  let lastStep = start;

  return {
    step(stepName: string) {
      const now = Date.now();
      const stepDuration = now - lastStep;
      logger.info(`[${operation}] ${stepName}`, {
        stepMs: stepDuration,
        totalMs: now - start,
      });
      lastStep = now;
    },

    done() {
      const total = Date.now() - start;
      logger.info(`[${operation}] Complete`, { totalMs: total });
      return total;
    },
  };
}

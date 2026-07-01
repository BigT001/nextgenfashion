/**
 * PROmonitor telemetry helper wrapper
 */
export const logger = {
  info: (message: string, metadata?: Record<string, any>) => {
    if (typeof window !== "undefined" && (window as any).PROmonitorLogger) {
      (window as any).PROmonitorLogger.info(message, metadata);
    } else {
      console.log("[PROmonitor Info Log]:", message, metadata);
    }
  },
  warn: (message: string, metadata?: Record<string, any>) => {
    if (typeof window !== "undefined" && (window as any).PROmonitorLogger) {
      (window as any).PROmonitorLogger.warn(message, metadata);
    } else {
      console.warn("[PROmonitor Warn Log]:", message, metadata);
    }
  },
  error: (message: string, error?: Error | any, metadata?: Record<string, any>) => {
    if (typeof window !== "undefined" && (window as any).PROmonitorLogger) {
      (window as any).PROmonitorLogger.error(message, error, metadata);
    } else {
      console.error("[PROmonitor Error Log]:", message, error, metadata);
    }
  }
};

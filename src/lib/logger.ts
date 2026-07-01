let cachedGeo: any = null;

if (typeof window !== "undefined") {
  // Fetch client geolocation on script load/initialization
  fetch("https://ipapi.co/json/")
    .then((res) => res.json())
    .then((data) => {
      cachedGeo = {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        isp: data.org
      };
    })
    .catch((err) => {
      console.warn("[PROmonitor GeoIP] Failed to fetch geolocation info:", err);
    });
}

/**
 * PROmonitor telemetry helper wrapper
 */
export const logger = {
  info: (message: string, metadata?: Record<string, any>) => {
    const fullMetadata = { ...metadata, geo: cachedGeo };
    if (typeof window !== "undefined" && (window as any).PROmonitorLogger) {
      (window as any).PROmonitorLogger.info(message, fullMetadata);
    } else {
      console.log("[PROmonitor Info Log]:", message, fullMetadata);
    }
  },
  warn: (message: string, metadata?: Record<string, any>) => {
    const fullMetadata = { ...metadata, geo: cachedGeo };
    if (typeof window !== "undefined" && (window as any).PROmonitorLogger) {
      (window as any).PROmonitorLogger.warn(message, fullMetadata);
    } else {
      console.warn("[PROmonitor Warn Log]:", message, fullMetadata);
    }
  },
  error: (message: string, error?: Error | any, metadata?: Record<string, any>) => {
    const fullMetadata = { ...metadata, geo: cachedGeo };
    if (typeof window !== "undefined" && (window as any).PROmonitorLogger) {
      (window as any).PROmonitorLogger.error(message, error, fullMetadata);
    } else {
      console.error("[PROmonitor Error Log]:", message, error, fullMetadata);
    }
  }
};

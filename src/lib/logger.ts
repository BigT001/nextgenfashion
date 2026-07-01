let cachedGeo: any = null;

if (typeof window !== "undefined") {
  // Fetch client geolocation on script load/initialization with fallback
  fetch("https://ipinfo.io/json")
    .then((res) => res.json())
    .then((data) => {
      cachedGeo = {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country,
        loc: data.loc,
        org: data.org
      };
    })
    .catch(() => {
      // Fallback to ipapi.co
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
    });
}

/**
 * PROmonitor telemetry helper wrapper
 */
export const logger = {
  info: (message: string, metadata?: Record<string, any>) => {
    const fullMetadata = { ...metadata, geo: cachedGeo };
    let geoSuffix = "";
    if (cachedGeo && cachedGeo.city && cachedGeo.country) {
      geoSuffix = ` [Geo: ${cachedGeo.city}, ${cachedGeo.country}]`;
    }
    const finalMessage = `${message}${geoSuffix}`;

    if (typeof window !== "undefined" && (window as any).PROmonitorLogger) {
      (window as any).PROmonitorLogger.info(finalMessage, fullMetadata);
    } else {
      console.log("[PROmonitor Info Log]:", finalMessage, fullMetadata);
    }
  },
  warn: (message: string, metadata?: Record<string, any>) => {
    const fullMetadata = { ...metadata, geo: cachedGeo };
    let geoSuffix = "";
    if (cachedGeo && cachedGeo.city && cachedGeo.country) {
      geoSuffix = ` [Geo: ${cachedGeo.city}, ${cachedGeo.country}]`;
    }
    const finalMessage = `${message}${geoSuffix}`;

    if (typeof window !== "undefined" && (window as any).PROmonitorLogger) {
      (window as any).PROmonitorLogger.warn(finalMessage, fullMetadata);
    } else {
      console.warn("[PROmonitor Warn Log]:", finalMessage, fullMetadata);
    }
  },
  error: (message: string, error?: Error | any, metadata?: Record<string, any>) => {
    const fullMetadata = { ...metadata, geo: cachedGeo };
    let geoSuffix = "";
    if (cachedGeo && cachedGeo.city && cachedGeo.country) {
      geoSuffix = ` [Geo: ${cachedGeo.city}, ${cachedGeo.country}]`;
    }
    const finalMessage = `${message}${geoSuffix}`;

    if (typeof window !== "undefined" && (window as any).PROmonitorLogger) {
      (window as any).PROmonitorLogger.error(finalMessage, error, fullMetadata);
    } else {
      console.error("[PROmonitor Error Log]:", finalMessage, error, fullMetadata);
    }
  }
};

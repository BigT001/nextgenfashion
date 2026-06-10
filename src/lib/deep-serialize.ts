export function deepSerialize<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Date objects
  if (data instanceof Date || (typeof data === "object" && "toISOString" in data && typeof (data as any).toISOString === "function")) {
    return (data as any).toISOString() as unknown as T;
  }

  // Handle Decimal objects
  if (
    typeof data === "object" && (
      (data as any).constructor?.name === "Decimal" || 
      ("toNumber" in (data as any) && typeof (data as any).toNumber === "function") ||
      ("s" in (data as any) && "e" in (data as any) && "d" in (data as any))
    )
  ) {
    return (typeof (data as any).toNumber === "function" 
      ? (data as any).toNumber() 
      : Number((data as any).toString())) as unknown as T;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => deepSerialize(item)) as unknown as T;
  }

  // Handle objects
  if (typeof data === "object") {
    // If it has a toJSON method, use it (excluding Decimals/Dates handled above)
    if (typeof (data as any).toJSON === "function") {
      try {
        const json = (data as any).toJSON();
        if (json !== data) {
          return deepSerialize(json) as unknown as T;
        }
      } catch (e) {
        // ignore and fall through
      }
    }

    const result: Record<string, unknown> = {};
    for (const key of Object.keys(data as Record<string, unknown>)) {
      const val = (data as Record<string, unknown>)[key];
      if (typeof val === "function") {
        continue;
      }
      result[key] = deepSerialize(val);
    }
    return result as T;
  }

  return data;
}

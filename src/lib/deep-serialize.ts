const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const isPrismaDecimalLike = (value: unknown): value is { toJSON: () => unknown; toString: () => string } => {
  if (typeof value !== 'object' || value === null) return false;

  const decimalValue = value as Record<string, unknown>;
  const hasDecimalShape = ['s', 'e', 'd'].every((key) => key in decimalValue);

  return hasDecimalShape && typeof decimalValue.toJSON === 'function' && typeof decimalValue.toString === 'function';
};

/**
 * Recursively converts Prisma Decimal, Date, and other non-plain objects into JSON-safe primitives.
 * Handles deeply nested objects and arrays.
 */
export function deepSerialize<T>(data: T): T {
  if (data instanceof Date) {
    return data.toISOString() as unknown as T;
  }
  if (isPrismaDecimalLike(data)) {
    return Number(data.toString()) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => deepSerialize(item)) as unknown as T;
  }
  if (data && typeof data === 'object') {
    if (!isPlainObject(data)) {
      const jsonValue = (data as { toJSON?: () => unknown }).toJSON?.();
      if (typeof jsonValue !== 'undefined') {
        return deepSerialize(jsonValue as never) as unknown as T;
      }
    }

    const result: Record<string, unknown> = {};
    for (const key in data as Record<string, unknown>) {
      result[key] = deepSerialize((data as Record<string, unknown>)[key]);
    }
    return result as T;
  }
  return data;
}

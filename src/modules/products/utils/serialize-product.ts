import { Decimal } from "@prisma/client/runtime/library";

/**
 * Convert Prisma Decimal objects to plain JavaScript numbers
 * Recursively processes nested objects and arrays
 * Filters out functions and internal properties
 */
export function serializeProduct(product: any): any {
  if (product === null || product === undefined) return product;

  // Handle Decimal objects
  if (product instanceof Decimal) {
    return product.toNumber();
  }

  // Handle Date objects
  if (product instanceof Date) {
    return product.toISOString();
  }

  // Handle arrays
  if (Array.isArray(product)) {
    return product.map(item => serializeProduct(item));
  }

  // Handle plain objects
  if (typeof product === 'object' && product.constructor === Object) {
    const serialized: any = {};
    for (const [key, value] of Object.entries(product)) {
      // Skip functions and constructors
      if (typeof value === 'function') {
        continue;
      }
      serialized[key] = serializeProduct(value);
    }
    return serialized;
  }

  // Skip functions
  if (typeof product === 'function') {
    return undefined;
  }

  return product;
}

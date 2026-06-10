/**
 * Convert Prisma Decimal/Date objects and other complex values to plain JS objects.
 * Recursively processes nested objects and arrays.
 */
export function serializeProduct(product: any): any {
  if (product === null || product === undefined) {
    return product;
  }

  // Handle Date objects
  if (product instanceof Date || (typeof product === "object" && "toISOString" in product && typeof product.toISOString === "function")) {
    return product.toISOString();
  }

  // Handle Decimal objects
  if (
    typeof product === "object" && (
      product.constructor?.name === "Decimal" || 
      ("toNumber" in product && typeof product.toNumber === "function") ||
      ("s" in product && "e" in product && "d" in product)
    )
  ) {
    return typeof product.toNumber === "function" ? product.toNumber() : Number(product.toString());
  }

  // Handle arrays
  if (Array.isArray(product)) {
    return product.map((item) => serializeProduct(item));
  }

  // Handle objects
  if (typeof product === "object") {
    // If it has a toJSON method, use it (excluding Decimals/Dates handled above)
    if (typeof product.toJSON === "function") {
      try {
        const json = product.toJSON();
        if (json !== product) {
          return serializeProduct(json);
        }
      } catch (e) {
        // ignore and fall through
      }
    }

    const serialized: any = {};
    for (const key of Object.keys(product)) {
      const val = product[key];
      if (typeof val === "function") {
        continue;
      }
      serialized[key] = serializeProduct(val);
    }
    return serialized;
  }

  return product;
}

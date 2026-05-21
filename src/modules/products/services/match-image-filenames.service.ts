import { ProductQueries } from "../queries/product.queries";

/**
 * MATCH IMAGE FILENAMES SERVICE
 * Layer 3: Business Logic
 */
export class MatchImageFilenamesService {
  static async execute(filenames: string[]) {
    if (!filenames || filenames.length === 0) {
      return { matched: [], unmatched: [] };
    }

    // 1. Extract base names (filename without extension, trimmed)
    const fileMapping = filenames.map(filename => {
      const lastDot = filename.lastIndexOf(".");
      const baseName = lastDot !== -1 ? filename.substring(0, lastDot) : filename;
      return {
        filename,
        baseName: baseName.trim()
      };
    });

    const baseNames = fileMapping.map(m => m.baseName);

    // 2. Query database for matching variants
    const variants = await ProductQueries.findVariantsByIdentifiers(baseNames);

    // Create lookup maps for SKU and Barcode (case-insensitive keys)
    const skuMap = new Map<string, any>();
    const barcodeMap = new Map<string, any>();

    variants.forEach(v => {
      if (v.sku) skuMap.set(v.sku.toLowerCase().trim(), v);
      if (v.barcode) barcodeMap.set(v.barcode.toLowerCase().trim(), v);
    });

    // 3. Match each filename
    const matched: {
      filename: string;
      productId: string;
      productName: string;
      sku: string;
      barcode: string | null;
    }[] = [];
    
    const unmatched: { filename: string }[] = [];

    fileMapping.forEach(({ filename, baseName }) => {
      const searchKey = baseName.toLowerCase();
      let matchedVariant = skuMap.get(searchKey);
      if (!matchedVariant) {
        matchedVariant = barcodeMap.get(searchKey);
      }

      if (matchedVariant) {
        matched.push({
          filename,
          productId: matchedVariant.productId,
          productName: matchedVariant.product.name,
          sku: matchedVariant.sku,
          barcode: matchedVariant.barcode
        });
      } else {
        unmatched.push({ filename });
      }
    });

    return { matched, unmatched };
  }
}

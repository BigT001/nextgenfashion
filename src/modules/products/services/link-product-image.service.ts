import { ProductQueries } from "../queries/product.queries";

/**
 * LINK PRODUCT IMAGE SERVICE
 * Layer 3: Business Logic
 * Cloudinary remains the source of truth for product assets.
 */
export class LinkProductImageService {
  static async execute(productId: string, imageUrl: string) {
    if (!productId || !imageUrl) {
      throw new Error("Missing product ID or image URL");
    }

    console.warn(`[LinkProductImageService] Skipping DB image persistence for product ${productId}. Cloudinary handles asset storage.`);
    return await ProductQueries.findById(productId);
  }
}

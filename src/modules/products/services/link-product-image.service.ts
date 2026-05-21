import { ProductQueries } from "../queries/product.queries";

/**
 * LINK PRODUCT IMAGE SERVICE
 * Layer 3: Business Logic
 */
export class LinkProductImageService {
  static async execute(productId: string, imageUrl: string) {
    if (!productId || !imageUrl) {
      throw new Error("Missing product ID or image URL");
    }

    return await ProductQueries.update(productId, {
      images: {
        set: [imageUrl]
      }
    });
  }
}

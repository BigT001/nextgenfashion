import { ProductQueries } from "../queries/product.queries";
import { prisma } from "@/services/prisma.service";

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

    // Fetch existing images to enforce uniqueness and limit
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { images: true },
    });
    const existingImages: string[] = (existingProduct?.images as unknown as string[]) ?? [];

    // Skip if image already linked
    if (existingImages.includes(imageUrl)) {
      console.log(`[LinkProductImageService] Image already linked to product ${productId}`);
      return await ProductQueries.findById(productId);
    }

    // Enforce maximum of 5 images per product
    if (existingImages.length >= 5) {
      console.warn(`[LinkProductImageService] Product ${productId} already has 5 images. Skipping addition.`);
      return await ProductQueries.findById(productId);
    }

    try {
      // Debug: log the linking operation to trace accidental cross-linking
      try {
        // eslint-disable-next-line no-console
        console.log(`[LinkProductImageService] Linking image to product ${productId}: ${imageUrl}`);
      } catch (e) {}

      await prisma.product.update({
        where: { id: productId },
        data: {
          images: { push: imageUrl },
        },
      });
    } catch (e) {
      console.error(`[LinkProductImageService] Failed to persist image for product ${productId}:`, e);
      throw e;
    }

    // Return the refreshed product record
    return await ProductQueries.findById(productId);
  }
}

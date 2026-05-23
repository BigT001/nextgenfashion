import { ProductQueries } from "../queries/product.queries";
import { prisma } from "@/services/prisma.service";
import { PushPosProductImagesService } from "./push-pos-product-images.service";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error ?? "Unknown error");

/**
 * LINK PRODUCT IMAGE SERVICE
 * Layer 3: Business Logic
 * Appends a new image URL to the product's existing images (never overwrites).
 */
export class LinkProductImageService {
  static async execute(productId: string, imageUrl: string) {
    if (!productId || !imageUrl) {
      throw new Error("Missing product ID or image URL");
    }

    // Fetch current images so we append rather than replace
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      select: { images: true }
    });

    const currentImages = existing?.images ?? [];

    // Prevent duplicate URLs
    if (currentImages.includes(imageUrl)) {
      const duplicateResult = await ProductQueries.findById(productId);
      try {
        await PushPosProductImagesService.execute(productId, [imageUrl]);
      } catch (err: unknown) {
        console.warn(`[LinkProductImage] POS image sync warning for duplicate image: ${getErrorMessage(err)}`);
      }
      return duplicateResult;
    }

    const updatedProduct = await ProductQueries.update(productId, {
      images: [...currentImages, imageUrl]
    });

    try {
      await PushPosProductImagesService.execute(productId, [imageUrl]);
    } catch (err: unknown) {
      console.warn(`[LinkProductImage] POS image sync failed: ${getErrorMessage(err)}`);
    }

    return updatedProduct;
  }
}

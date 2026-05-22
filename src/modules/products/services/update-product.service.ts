import { prisma } from "@/services/prisma.service";

/**
 * UPDATE PRODUCT SERVICE
 * Layer 3: Business Logic
 */
export class UpdateProductService {
  private static normalizeImageUrls(images: any): string[] {
    if (!Array.isArray(images)) return [];

    return images
      .map((img: any) => {
        if (typeof img === "string") return img;
        if (img && typeof img === "object" && typeof img.url === "string") return img.url;
        return null;
      })
      .filter((url: string | null): url is string => {
        if (!url || typeof url !== "string") return false;
        if (url.startsWith("blob:") || url.startsWith("data:")) return false;
        return /^(https?:\/\/|\/)/.test(url);
      });
  }

  static async execute(id: string, payload: any) {
    const { name, description, categoryId, targetGender, sellingPrice, costPrice, tax, images, variants } = payload;

    const resolvedImages = this.normalizeImageUrls(images);

    console.log(`[UpdateProduct] id=${id}, images received: ${images?.length ?? 0}, resolved URLs: ${resolvedImages.length}`);

    // 1. Update the parent Product record
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        basePrice: sellingPrice,
        costPrice,
        tax,
        targetGender,
        categoryId,
        images: resolvedImages,
      },
      include: {
        variants: true
      }
    });

    console.log(`[UpdateProduct] Persisted images: ${updatedProduct.images.length} URL(s) saved for product ${updatedProduct.name}`);

    // 2. Update the variant and inventory if provided
    if (variants && variants.length > 0) {
      const v = variants[0];
      const variantSku = v.sku.toUpperCase();

      // Find first variant belonging to this product
      let variant = await prisma.productVariant.findFirst({
        where: { productId: id }
      });

      if (variant) {
        // Update existing variant
        variant = await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            sku: variantSku,
            size: v.size || "OS",
            color: v.color || "Default",
            price: v.price || sellingPrice
          }
        });

        // Update inventory
        await prisma.inventory.upsert({
          where: { variantId: variant.id },
          create: {
            variantId: variant.id,
            quantity: v.stock || 0,
            warehouseId: payload.warehouseId || null
          },
          update: {
            quantity: v.stock || 0,
            warehouseId: payload.warehouseId || null
          }
        });
      }
    }

    return updatedProduct;
  }
}

import { prisma } from "@/services/prisma.service";

/**
 * UPDATE PRODUCT SERVICE
 * Layer 3: Business Logic
 */
export class UpdateProductService {
  static async execute(id: string, payload: any) {
    const { name, description, categoryId, targetGender, sellingPrice, costPrice, tax, images, variants } = payload;

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
        images: images?.map((img: any) => typeof img === "string" ? img : img.url) || [],
      },
      include: {
        variants: true
      }
    });

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

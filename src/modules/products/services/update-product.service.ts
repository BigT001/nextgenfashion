import { prisma } from "@/services/prisma.service";
import { Prisma } from "@prisma/client";

interface ProductUpdatePayload {
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  sellingPrice?: number;
  costPrice?: number;
  tax?: number;
  images?: string[];
  variants?: Array<{
    sku?: string;
    size?: string;
    color?: string;
    price?: number;
    stock?: number;
  }>;
  warehouseId?: string | null;
}

/**
 * UPDATE PRODUCT SERVICE
 * Layer 3: Business Logic
 */
export class UpdateProductService {
  static async execute(id: string, payload: ProductUpdatePayload) {
    const { name, description, categoryId, sellingPrice, costPrice, tax, images, variants } = payload;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });
    if (!existingProduct) {
      throw new Error(`Product with id ${id} not found`);
    }

    console.log(`[UpdateProduct] id=${id} updating product metadata without persisting image URLs`);

    // 1. Update the parent Product record
    const updateData: Prisma.ProductUpdateInput = {
      name,
      description,
      basePrice: sellingPrice,
      costPrice,
      tax,
    };
    // Persist uploaded image URLs — replace the stored list for this product
    if (images !== undefined) {
      // Deduplicate and enforce max 5
      updateData.images = [...new Set(images)].slice(0, 5);
    }
    if (categoryId !== undefined && categoryId !== null) {
      updateData.Category = { connect: { id: categoryId } };
    }
    // targetAudience removed from schema — no-op

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        ProductVariant: true,
        Category: true,
      }
    });

    console.log(`[UpdateProduct] Updated product ${updatedProduct.name} without persisting image URLs`);

    // 2. Update the variant and inventory if provided
    if (variants && variants.length > 0) {
      const v = variants[0];
      let variantSku = String(v.sku || "").toUpperCase();

      // Find first variant belonging to this product
      let variant = await prisma.productVariant.findFirst({ where: { productId: id } });

      if (variant) {
        // Ensure SKU uniqueness: if desired SKU exists on another variant, generate a safe fallback
        const existingBySku = await prisma.productVariant.findUnique({ where: { sku: variantSku } });
        if (existingBySku && existingBySku.id !== variant.id) {
          let candidate = `${variantSku}-${Date.now().toString().slice(-4)}`;
          while (await prisma.productVariant.findUnique({ where: { sku: candidate } })) {
            candidate = `${variantSku}-${Math.floor(1000 + Math.random() * 9000)}`;
          }
          variantSku = candidate;
        }

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

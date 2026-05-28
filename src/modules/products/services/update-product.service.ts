import { prisma } from "@/services/prisma.service";
import { Prisma } from "@prisma/client";

interface ProductUpdatePayload {
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  sellingPrice?: number;
  costPrice?: number;
  tax?: number;
  images?: unknown;
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
  private static normalizeImageUrls(images: unknown): string[] | null {
    if (images === undefined) return null;
    if (!Array.isArray(images)) return [];

    return images
      .map((img: unknown) => {
        if (typeof img === "string") return img;
        if (img && typeof img === "object") {
          const record = img as Record<string, unknown>;
          if (typeof record.url === "string") return record.url;
        }
        return null;
      })
      .filter((url: string | null): url is string => {
        if (!url || typeof url !== "string") return false;
        if (url.startsWith("blob:") || url.startsWith("data:")) return false;
        return /^(https?:\/\/|\/)/.test(url);
      });
  }

  static async execute(id: string, payload: ProductUpdatePayload) {
    const { name, description, categoryId, sellingPrice, costPrice, tax, images, variants } = payload;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { images: true },
    });
    if (!existingProduct) {
      throw new Error(`Product with id ${id} not found`);
    }

    const resolvedImages = this.normalizeImageUrls(images);
    const imageChanges = resolvedImages === null ? [] : resolvedImages.filter((url) => !existingProduct.images.includes(url));
    const imagesReceivedCount = Array.isArray(images) ? images.length : 0;

    console.log(`[UpdateProduct] id=${id}, images received: ${imagesReceivedCount}, resolved URLs: ${resolvedImages === null ? 0 : resolvedImages.length}`);

    // 1. Update the parent Product record
    const updateData: Prisma.ProductUpdateInput = {
      name,
      description,
      basePrice: sellingPrice,
      costPrice,
      tax,
    };
    if (categoryId !== undefined && categoryId !== null) {
      updateData.category = { connect: { id: categoryId } };
    }
    // targetAudience removed from schema — no-op
    if (resolvedImages !== null) {
      updateData.images = resolvedImages;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        variants: true
      }
    });

    console.log(`[UpdateProduct] Persisted images: ${updatedProduct.images.length} URL(s) saved for product ${updatedProduct.name}`);

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

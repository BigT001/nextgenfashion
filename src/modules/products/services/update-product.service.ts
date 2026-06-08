import { prisma } from "@/services/prisma.service";
import { Prisma } from "@prisma/client";

interface ProductUpdatePayload {
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  categoryIds?: string[] | null;
  sellingPrice?: number;
  costPrice?: number;
  tax?: number;
  images?: string[];
  variants?: Array<{
    id?: string;
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
      updateData.categories = { connect: { id: categoryId } };
    } else if (payload.categoryIds !== undefined && payload.categoryIds !== null && payload.categoryIds.length > 0) {
      updateData.categories = { connect: { id: payload.categoryIds[0] } };
    }
    // targetAudience removed from schema — no-op

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        ProductVariant: true,
        categories: true,
      }
    });

    console.log(`[UpdateProduct] Updated product ${updatedProduct.name} without persisting image URLs`);

    // 2. Update ALL variants and inventories if provided
    if (variants) {
      // Get existing variants for this product
      const existingVariants = await prisma.productVariant.findMany({
        where: { productId: id },
        include: {
          _count: {
            select: { SaleItem: true }
          }
        }
      });

      const incomingIds = variants
        .map(v => v.id)
        .filter((vid): vid is string => typeof vid === "string" && vid.trim().length > 0 && !vid.startsWith("var-"));

      // Identify variants to delete (those existing in DB but not in incoming payload)
      const variantsToDelete = existingVariants.filter(
        ev => !incomingIds.includes(ev.id)
      );

      // Check if any deleted variants have transactional records
      const variantsWithSales = variantsToDelete.filter(v => v._count.SaleItem > 0);
      if (variantsWithSales.length > 0) {
        const skus = variantsWithSales.map(v => v.sku).join(", ");
        throw new Error(`Cannot delete variant(s) with SKU(s) [${skus}] because they have associated sales history.`);
      }

      // Delete variants not present in the new payload (and their inventory via cascade delete)
      if (variantsToDelete.length > 0) {
        await prisma.productVariant.deleteMany({
          where: {
            id: { in: variantsToDelete.map(v => v.id) }
          }
        });
      }

      // Update or create variants in the payload
      for (const v of variants) {
        let variantSku = String(v.sku || "").toUpperCase();
        const isTempId = !v.id || v.id.startsWith("var-");

        // Try to find the existing variant by id (if not a temporary id)
        const matchedVariant = isTempId ? null : existingVariants.find(ev => ev.id === v.id);

        if (matchedVariant) {
          // Ensure SKU uniqueness: if desired SKU exists on another variant, generate a safe fallback
          const existingBySku = await prisma.productVariant.findUnique({ where: { sku: variantSku } });
          if (existingBySku && existingBySku.id !== matchedVariant.id) {
            let candidate = `${variantSku}-${Date.now().toString().slice(-4)}`;
            while (await prisma.productVariant.findUnique({ where: { sku: candidate } })) {
              candidate = `${variantSku}-${Math.floor(1000 + Math.random() * 9000)}`;
            }
            variantSku = candidate;
          }

          // Update existing variant
          const updatedVariant = await prisma.productVariant.update({
            where: { id: matchedVariant.id },
            data: {
              sku: variantSku,
              size: v.size || "OS",
              color: v.color || "Default",
              price: v.price || sellingPrice
            }
          });

          // Update inventory
          await prisma.inventory.upsert({
            where: { variantId: updatedVariant.id },
            create: {
              variantId: updatedVariant.id,
              quantity: v.stock || 0,
              warehouseId: payload.warehouseId || null
            },
            update: {
              quantity: v.stock || 0,
              warehouseId: payload.warehouseId || null
            }
          });
        } else {
          // Double-check if the SKU is already in use by any other variant in database
          const existingBySku = await prisma.productVariant.findUnique({ where: { sku: variantSku } });
          if (existingBySku) {
            let candidate = `${variantSku}-${Date.now().toString().slice(-4)}`;
            while (await prisma.productVariant.findUnique({ where: { sku: candidate } })) {
              candidate = `${variantSku}-${Math.floor(1000 + Math.random() * 9000)}`;
            }
            variantSku = candidate;
          }

          // Create new variant
          const createdVariant = await prisma.productVariant.create({
            data: {
              productId: id,
              sku: variantSku,
              size: v.size || "OS",
              color: v.color || "Default",
              price: v.price || sellingPrice,
              barcode: null
            }
          });

          // Create inventory for new variant
          await prisma.inventory.create({
            data: {
              variantId: createdVariant.id,
              quantity: v.stock || 0,
              warehouseId: payload.warehouseId || null
            }
          });
        }
      }
    }

    return updatedProduct;
  }
}

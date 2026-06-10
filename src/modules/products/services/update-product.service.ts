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
    const { name, description, categoryId, categoryIds, sellingPrice, costPrice, tax, images, variants, warehouseId } = payload;

    console.log(`[UpdateProduct] Received payload:`, { id, categoryId, categoryIds, hasVariants: !!variants });

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { categories: true, ProductVariant: { include: { _count: { select: { SaleItem: true } } } } }
    });
    
    if (!existingProduct) {
      throw new Error(`Product with id ${id} not found`);
    }

    console.log(`[UpdateProduct] Current categories on product:`, existingProduct.categories.map(c => c.id));

    // Determine which categories to set
    const newCategoryIds = categoryIds && categoryIds.length > 0 
      ? categoryIds 
      : (categoryId ? [categoryId] : []);

    console.log(`[UpdateProduct] New category IDs to set:`, newCategoryIds);

    // Execute update in a transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      let targetGender = "BOTH";
      if (newCategoryIds.length > 0) {
        const categories = await tx.category.findMany({
          where: { id: { in: newCategoryIds } },
          select: { name: true }
        });
        const names = categories.map(c => c.name.toLowerCase().trim());
        const hasBoys = names.includes("boys");
        const hasGirls = names.includes("girls");
        const hasUnisex = names.includes("uni-sex") || names.includes("unisex");

        if (hasBoys && hasGirls) targetGender = "BOTH";
        else if (hasBoys) targetGender = "BOYS";
        else if (hasGirls) targetGender = "GIRLS";
        else if (hasUnisex) targetGender = "BOTH";
      }

      // 1. Update the parent Product record
      const updateData: Prisma.ProductUpdateInput = {
        name,
        description,
        basePrice: sellingPrice,
        costPrice,
        tax,
        targetGender,
      };

      if (images !== undefined) {
        updateData.images = [...new Set(images)].slice(0, 5);
      }

      // Disconnect ALL old categories and connect ALL new ones in a single step
      if (newCategoryIds.length > 0) {
        updateData.categories = {
          set: newCategoryIds.map(catId => ({ id: catId }))
        };
      } else {
        // If no categories provided, clear them
        updateData.categories = { set: [] };
      }

      const updatedProduct = await tx.product.update({
        where: { id },
        data: updateData,
        include: {
          ProductVariant: true,
          categories: true,
        }
      });

      console.log(`[UpdateProduct] After category update, product has categories:`, updatedProduct.categories.map(c => c.id));

      // 2. Update ALL variants and inventories if provided
      if (variants) {
        const existingVariants = await tx.productVariant.findMany({
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

        const variantsToDelete = existingVariants.filter(
          ev => !incomingIds.includes(ev.id)
        );

        const variantsWithSales = variantsToDelete.filter(v => v._count.SaleItem > 0);
        if (variantsWithSales.length > 0) {
          const skus = variantsWithSales.map(v => v.sku).join(", ");
          throw new Error(`Cannot delete variant(s) with SKU(s) [${skus}] because they have associated sales history.`);
        }

        if (variantsToDelete.length > 0) {
          await tx.productVariant.deleteMany({
            where: {
              id: { in: variantsToDelete.map(v => v.id) }
            }
          });
        }

        for (const v of variants) {
          let variantSku = String(v.sku || "").toUpperCase();
          const isTempId = !v.id || v.id.startsWith("var-");
          const matchedVariant = isTempId ? null : existingVariants.find(ev => ev.id === v.id);

          if (matchedVariant) {
            const existingBySku = await tx.productVariant.findUnique({ where: { sku: variantSku } });
            if (existingBySku && existingBySku.id !== matchedVariant.id) {
              let candidate = `${variantSku}-${Date.now().toString().slice(-4)}`;
              while (await tx.productVariant.findUnique({ where: { sku: candidate } })) {
                candidate = `${variantSku}-${Math.floor(1000 + Math.random() * 9000)}`;
              }
              variantSku = candidate;
            }

            await tx.productVariant.update({
              where: { id: matchedVariant.id },
              data: {
                sku: variantSku,
                size: v.size || "OS",
                color: v.color || "Default",
                price: v.price || sellingPrice
              }
            });

            await tx.inventory.upsert({
              where: { variantId: matchedVariant.id },
              create: {
                variantId: matchedVariant.id,
                quantity: v.stock || 0,
                warehouseId: warehouseId || null
              },
              update: {
                quantity: v.stock || 0,
                warehouseId: warehouseId || null
              }
            });
          } else {
            const existingBySku = await tx.productVariant.findUnique({ where: { sku: variantSku } });
            if (existingBySku) {
              let candidate = `${variantSku}-${Date.now().toString().slice(-4)}`;
              while (await tx.productVariant.findUnique({ where: { sku: candidate } })) {
                candidate = `${variantSku}-${Math.floor(1000 + Math.random() * 9000)}`;
              }
              variantSku = candidate;
            }

            const createdVariant = await tx.productVariant.create({
              data: {
                productId: id,
                sku: variantSku,
                size: v.size || "OS",
                color: v.color || "Default",
                price: v.price || sellingPrice,
                barcode: null
              }
            });

            await tx.inventory.create({
              data: {
                variantId: createdVariant.id,
                quantity: v.stock || 0,
                warehouseId: warehouseId || null
              }
            });
          }
        }
      }

      return updatedProduct;
    });

    // Final fetch to ensure everything is committed
    const finalProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        ProductVariant: {
          include: { Inventory: true }
        },
        categories: true,
      }
    });

    console.log(`[UpdateProduct] Final product categories:`, finalProduct?.categories.map(c => ({ id: c.id, name: c.name })));

    return finalProduct;
  }
}

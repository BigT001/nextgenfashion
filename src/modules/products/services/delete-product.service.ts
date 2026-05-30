import { ProductQueries } from "../queries/product.queries";

/**
 * DELETE PRODUCT SERVICE
 * Layer 3: Business Logic
 */
export class DeleteProductService {
  static async execute(id: string) {
    const { prisma } = await import("@/services/prisma.service");

    // 1. Check if any variants of this product have transaction (sales) records
    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      include: {
        _count: {
          select: { SaleItem: true }
        }
      }
    });

    const hasSales = variants.some(v => v._count.SaleItem > 0);

    if (hasSales) {
      // Soft delete: suspend the product from storefront/checkout catalogs instead of breaking constraints
      await prisma.product.update({
        where: { id },
        data: { isSuspended: true }
      });
      
      return {
        success: true,
        suspended: true,
        message: "This product has transactional history (sales records) and cannot be hard-deleted to preserve financial records. It has been successfully suspended from your storefront and checkout catalogs instead."
      };
    }

    const deleted = await ProductQueries.delete(id);
    return { success: true, data: JSON.parse(JSON.stringify(deleted)) };
  }
}

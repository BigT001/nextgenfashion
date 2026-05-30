/**
 * COMPLETE DATABASE CLEANUP SERVICE
 * Wipes all business data: products, sales, customers, inventory
 */
export class CompleteCleanupService {
  static async execute(): Promise<{ success: true }> {
    const { prisma } = await import("@/services/prisma.service");
    const { CloudinaryService } = await import("@/integrations/cloudinary/cloudinary.service");

    try {
      // 1. Delete Cloudinary products folder
      try {
        await CloudinaryService.deleteFolder("products");
      } catch (cloudError) {
        console.warn("Cloudinary cleanup warning:", cloudError);
      }

      // 2. Delete all sales data (cascade to SaleItems)
      await prisma.sale.deleteMany({});

      // 3. Delete all customers
      await prisma.customer.deleteMany({});

      // 4. Delete all product data (inventory, variants, products)
      await prisma.inventory.deleteMany({});
      await prisma.productVariant.deleteMany({});
      await prisma.product.deleteMany({});

      // 5. Delete all audit logs
      await prisma.auditLog.deleteMany({});

      return { success: true };
    } catch (error: any) {
      console.error("Complete cleanup error:", error);
      throw error;
    }
  }
}

import { CloudinaryService } from "@/integrations/cloudinary/cloudinary.service";

export class DeleteProductCatalogService {
  static async execute(): Promise<{ success: true }> {
    const { prisma } = await import("@/services/prisma.service");

    try {
      await CloudinaryService.deleteFolder("products");
    } catch (cloudError) {
      console.warn("Cloudinary cleanup warning:", cloudError);
    }

    const variantRecords = await prisma.productVariant.findMany({ select: { id: true } });
    const variantIds = variantRecords.map((variant) => variant.id);

    if (variantIds.length > 0) {
      await prisma.saleItem.deleteMany({
        where: { variantId: { in: variantIds } }
      });
      await prisma.sale.deleteMany({
        where: { SaleItem: { none: {} } }
      });
    }

    await prisma.inventory.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.auditLog.deleteMany({
      where: { entity: { in: ["Product", "ProductVariant"] } }
    });

    return { success: true };
  }
}

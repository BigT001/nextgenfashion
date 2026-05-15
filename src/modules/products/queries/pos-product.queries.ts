import { prisma } from "@/services/prisma.service";

export const POSProductQueries = {
  /**
   * Search products for the POS interface
   * Includes variants and current inventory levels
   */
  async searchProducts(query: string = "") {
    return prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { variants: { some: { sku: { contains: query, mode: "insensitive" } } } },
        ],
      },
      include: {
        variants: {
          include: {
            inventory: true,
          },
        },
        category: true,
      },
      orderBy: {
        name: "asc",
      },
      take: 20, // Keep results manageable for POS UI
    });
  },

  /**
   * Get all categories for POS filtering
   */
  async getCategories() {
    return prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }
};

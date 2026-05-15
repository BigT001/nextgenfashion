import { prisma } from "@/services/prisma.service";

export const SearchQueries = {
  /**
   * Search across multiple entities for a given query
   */
  async universalSearch(query: string) {
    if (!query || query.length < 2) return { products: [], categories: [], orders: [] };

    const [products, categories, orders] = await Promise.all([
      // Search Products
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5,
        include: { category: true }
      }),
      // Search Categories
      prisma.category.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: 3
      }),
      // Search Orders (By Order Number)
      prisma.sale.findMany({
        where: { orderNumber: { contains: query, mode: 'insensitive' } },
        take: 5,
        include: { customer: true }
      })
    ]);

    return {
      products,
      categories,
      orders
    };
  }
};

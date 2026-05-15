import { prisma } from "@/services/prisma.service";
import { Prisma } from "@prisma/client";

/**
 * PRODUCT REPOSITORY
 * Layer 4: Direct Database Interaction
 * ONLY responsible for querying the database. No business logic.
 */
export class ProductQueries {
  static async findAll(params: {
    categoryId?: string;
    search?: string;
    includeVariants?: boolean;
  }) {
    return await prisma.product.findMany({
      where: {
        ...(params.categoryId && { categoryId: params.categoryId }),
        ...(params.search && {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { description: { contains: params.search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        category: true,
        variants: params.includeVariants ?? true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Fetch high-visibility featured products for the storefront
   */
  static async findFeatured(limit = 8) {
    return await prisma.product.findMany({
      where: {},
      take: limit,
      include: {
        category: true,
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          include: {
            inventory: true,
          },
        },
      },
    });
  }

  static async findCategories() {
    return await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  static async create(data: Prisma.ProductCreateInput) {
    return await (prisma.product as any).create({
      data,
      include: {
        variants: {
          include: {
            inventory: true,
          },
        },
      },
    });
  }

  static async update(id: string, data: Prisma.ProductUpdateInput) {
    return await prisma.product.update({
      where: { id },
      data,
      include: {
        variants: true,
      },
    });
  }

  static async delete(id: string) {
    return await prisma.product.delete({
      where: { id },
    });
  }
}

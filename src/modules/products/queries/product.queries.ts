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
    targetGender?: string;
    search?: string;
    maxPrice?: number;
    includeVariants?: boolean;
  }) {
    return await prisma.product.findMany({
      where: {
        isSuspended: false,
        ...(params.targetGender && {
          OR: [
            { targetGender: params.targetGender as any },
            { targetGender: "BOTH" }
          ]
        }),
        ...(params.categoryId && {
          OR: [
            { categoryId: params.categoryId },
            { category: { name: { equals: params.categoryId, mode: "insensitive" } } }
          ]
        }),
        ...(params.search && {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { description: { contains: params.search, mode: "insensitive" } },
          ],
        }),
        ...(params.maxPrice !== undefined && {
          basePrice: { lte: new Prisma.Decimal(params.maxPrice) }
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
   * Fetch high-visibility featured products for the storefront.
   */
  static async findFeatured(limit = 8) {
    try {
      return await prisma.product.findMany({
        where: {
          isSuspended: false,
        },
        take: limit,
        include: {
          category: true,
          variants: true,
        },
        orderBy: { id: "desc" },
      });
    } catch (error) {
      console.error("[ProductQueries.findFeatured] Failed to load featured products:", error);
      return [];
    }
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

  static async findCategories(targetGender?: string) {
    const genderFilter = targetGender ? {
      OR: [
        { targetGender: targetGender as any },
        { targetGender: "BOTH" as any }
      ]
    } : undefined;

    return await prisma.category.findMany({
      where: targetGender ? {
        products: {
          some: genderFilter
        }
      } : undefined,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
        products: {
          where: genderFilter,
          take: 1,
        },
      },
    });
  }

  static async create(data: any) {
    return await prisma.product.create({
      data: {
        ...data,
      },
      include: {
        variants: {
          include: {
            inventory: true,
          },
        },
      },
    });
  }

  static async update(id: string, data: any) {
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

  static async findVariantsByIdentifiers(identifiers: string[]) {
    const uppercaseIds = identifiers.map(id => id.toUpperCase().trim());
    const trimmedIds = identifiers.map(id => id.trim());
    return await prisma.productVariant.findMany({
      where: {
        OR: [
          { sku: { in: uppercaseIds } },
          { barcode: { in: trimmedIds } },
          { sku: { in: trimmedIds } }
        ]
      },
      include: {
        product: true
      }
    });
  }
}

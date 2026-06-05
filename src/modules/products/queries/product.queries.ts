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
          Category: {
            OR: [
              { id: params.categoryId },
              { name: { equals: params.categoryId, mode: "insensitive" } }
            ]
          }
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
        Category: true,
        ProductVariant: params.includeVariants ?? true
          ? { include: { Inventory: true } }
          : false,
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
          Category: true,
          ProductVariant: {
            include: { Inventory: true }
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error("[ProductQueries.findFeatured] Failed to load featured products:", error);

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
        try {
          console.warn("[ProductQueries.findFeatured] Falling back to featured products query without ordering due to schema mismatch.");
          return await prisma.product.findMany({
            where: {
              isSuspended: false,
            },
            take: limit,
            include: {
              Category: true,
              ProductVariant: true,
            },
          });
        } catch (fallbackError) {
          console.error("[ProductQueries.findFeatured] Fallback query also failed:", fallbackError);
        }
      }

      return [];
    }
  }

  static async findById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        Category: true,
        ProductVariant: {
          include: {
            Inventory: true,
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
        Product: {
          some: genderFilter
        }
      } : undefined,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            Product: true,
          },
        },
        Product: {
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
        ProductVariant: {
          include: {
            Inventory: true,
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
        ProductVariant: true,
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
        Product: true
      }
    });
  }
}

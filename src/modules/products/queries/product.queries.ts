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
    // Over-fetch then sort: products with images surface first
    const products = await prisma.product.findMany({
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

    // Sort: products WITH images come first
    const withImages = products.filter(p => p.images && p.images.length > 0);
    const withoutImages = products.filter(p => !p.images || p.images.length === 0);
    return [...withImages, ...withoutImages];
  }

  /**
   * Fetch high-visibility featured products for the storefront.
   * Products WITH images are always shown first.
   */
  static async findFeatured(limit = 8) {
    // Fetch the most recent active products that already have at least one image.
    return await prisma.product.findMany({
      where: {
        isSuspended: false,
        images: { isEmpty: false },
      },
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
            products: targetGender ? { where: genderFilter } : true 
          },
        },
        products: {
          where: genderFilter,
          take: 1,
          select: { images: true },
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

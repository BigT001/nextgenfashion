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
    includeVariants?: boolean;
    take?: number;
    skip?: number;
    random?: boolean;
  }) {
    // Resolve gender category if a gender filter is provided
    let genderCategoryId: string | undefined = undefined;
    if (params.targetGender) {
      const genderName =
        params.targetGender.toUpperCase() === "BOYS" ? "Boys" : "Girls";
      try {
        const cat = await prisma.category.findUnique({
          where: { name: genderName },
          select: { id: true },
        });
        if (cat) {
          genderCategoryId = cat.id;
        }
      } catch (e) {
        console.error(
          "[ProductQueries.findAll] Failed to pre-lookup gender category:",
          e
        );
      }
    }

    const products = await prisma.product.findMany({
      where: {
        isSuspended: false,
        ...(params.targetGender && {
          OR: [
            { targetGender: params.targetGender as any },
            { targetGender: "BOTH" },
            ...(genderCategoryId
              ? [
                  {
                    categories: { some: { id: genderCategoryId } },
                  },
                ]
              : []),
          ],
        }),
        ...(params.categoryId && {
          categories: { some: { id: params.categoryId } },
        }),
        ...(params.search && {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { description: { contains: params.search, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        targetGender: true,
        categories: { select: { id: true, name: true } },
        images: true,
        createdAt: true,
        ProductVariant: params.includeVariants ?? true
          ? {
              take: 1,
              include: { Inventory: true },
            }
          : false,
      },
      orderBy: { createdAt: "desc" },
      ...(typeof params.take === "number" && { take: params.take }),
      ...(typeof params.skip === "number" && { skip: params.skip }),
    });

    if (params.random) {
      const shuffled = [...products];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    return products;
  }

  static async findCategorySummaries(targetGender?: string) {
    // Currently gender is not used for summaries but kept for future extension
    return await prisma.category.findMany({
      where: {
        NOT: [
          { name: { equals: "Boys", mode: "insensitive" } },
          { name: { equals: "Girls", mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { Product: true } },
      },
    });
  }

  /**
   * Fetch high‑visibility featured products for the storefront.
   * Optimized to only fetch essential product data for home page rendering.
   */
  static async findFeatured(limit = 8) {
    return await prisma.product.findMany({
      where: { isSuspended: false },
      take: limit,
      include: {
        categories: true,
        ProductVariant: { take: 1, include: { Inventory: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        categories: true,
        ProductVariant: { include: { Inventory: true } },
      },
    });
  }

  static async findCategories(targetGender?: string, productsPerCategory = 10) {
    // Gender filter not applied here; method returns all categories with limited products per category
    // On home page, we only need a few sample products for display, not all
    return await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { Product: true } },
        Product: {
          where: { isSuspended: false },
          include: {
            ProductVariant: { take: 1, include: { Inventory: true } },
          },
          take: productsPerCategory,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  static async create(data: any) {
    return await prisma.product.create({
      data: { ...data },
      include: {
        categories: true,
        ProductVariant: { include: { Inventory: true } },
      },
    });
  }

  static async update(id: string, data: any) {
    return await prisma.product.update({
      where: { id },
      data,
      include: { ProductVariant: true },
    });
  }

  static async delete(id: string) {
    return await prisma.product.delete({
      where: { id },
    });
  }

  static async findVariantsByIdentifiers(identifiers: string[]) {
    const uppercaseIds = identifiers.map((id) => id.toUpperCase().trim());
    const trimmedIds = identifiers.map((id) => id.trim());
    return await prisma.productVariant.findMany({
      where: {
        OR: [
          { sku: { in: uppercaseIds } },
          { barcode: { in: trimmedIds } },
          { sku: { in: trimmedIds } },
        ],
      },
      include: { Product: true },
    });
  }
}

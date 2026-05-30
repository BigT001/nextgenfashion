import { ProductQueries } from "../queries/product.queries";
import { Prisma } from "@prisma/client";
import { prisma } from "@/services/prisma.service";

/**
 * CREATE PRODUCT SERVICE
 * Layer 3: Business Logic
 */
export class CreateProductService {
  static async execute(
    productData: Omit<Prisma.ProductCreateInput, "category" | "images"> & {
      categoryId: string;
      images?: string[];
    },
    variants: (Prisma.ProductVariantCreateWithoutProductInput & {
      stock: number;
    })[]
  ) {
    const normalizedProductName = String(productData.name || "").trim();
    if (!normalizedProductName) {
      throw new Error("Product name is required");
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        name: {
          equals: normalizedProductName,
          mode: "insensitive",
        },
      },
    });

    if (existingProduct) {
      throw new Error(`Product "${normalizedProductName}" already exists`);
    }

    // Business Logic: Prepare the data structure for the query layer
    // Normalize and validate SKUs to avoid nested create unique constraint errors
    const normalizedSkus = variants.map((v, idx) => {
      const fallback = `NGN-${(productData as any).name.slice(0, 3).toUpperCase()}-${(v as any).size || "OS"}-${(v as any).color || "DF"}-${Math.floor(1000 + Math.random() * 9000)}`.toUpperCase();
      return String((v as any).sku || fallback).toUpperCase();
    });

    // Check for existing variant SKUs in the database and generate unique fallbacks when needed
    const existing = await prisma.productVariant.findMany({ where: { sku: { in: normalizedSkus } } });
    const existingSet = new Set(existing.map(e => e.sku));

    // Start with normalized SKUs, but ensure uniqueness against existing DB SKUs and among themselves
    const finalSkus: string[] = [];
    const used = new Set<string>(existingSet);

    for (const sku of normalizedSkus) {
      let candidate = sku;
      let suffix = 1;
      while (used.has(candidate)) {
        candidate = `${sku}-${suffix++}`;
      }
      used.add(candidate);
      finalSkus.push(candidate);
    }

    // Extra safety: re-check finalSkus against DB in case of race and regenerate collisions
    let conflicts = await prisma.productVariant.findMany({ where: { sku: { in: finalSkus } } });
    const conflictSkus = new Set(conflicts.map(c => c.sku));
    if (conflictSkus.size > 0) {
      for (let i = 0; i < finalSkus.length; i++) {
        if (conflictSkus.has(finalSkus[i])) {
          // regenerate with timestamp suffix until clear
          let candidate = `${finalSkus[i]}-${Date.now().toString().slice(-4)}`;
          while (await prisma.productVariant.findUnique({ where: { sku: candidate } })) {
            candidate = `${finalSkus[i]}-${Math.floor(1000 + Math.random() * 9000)}`;
          }
          finalSkus[i] = candidate;
        }
      }
    }

    const createInput: any = {
      name: productData.name,
      description: productData.description,
      ...(productData.basePrice !== undefined ? { basePrice: productData.basePrice } : {}),
      costPrice: (productData as any).costPrice,
      tax: (productData as any).tax,
      // Persist uploaded image URLs — unique to this product
      images: (productData as any).images ?? [],
      Category: { connect: { id: productData.categoryId } },
    };

    // targetAudience removed from schema — no-op

    createInput.ProductVariant = {
      create: variants.map(({ stock, ...v }, i) => ({
        ...v,
        sku: finalSkus[i],
        Inventory: {
          create: {
            quantity: stock,
            warehouseId: (productData as any).warehouseId || null,
          },
        },
      })),
    };

    return await ProductQueries.create(createInput);
  }
}

"use server";

import { prisma } from "@/services/prisma.service";

export type CartItemSyncPayload = {
  variantId: string;
};

export type CartItemSyncResult = {
  variantId: string;
  price: number;
  availableStock: number;
  name: string;
  image?: string;
  isAvailable: boolean;
};

export async function getCartItemsLatestDetailsAction(
  items: CartItemSyncPayload[]
): Promise<{ success: boolean; data?: CartItemSyncResult[]; error?: string }> {
  try {
    const results: CartItemSyncResult[] = [];

    for (const item of items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: {
          Product: true,
          Inventory: true,
        },
      });

      if (!variant || variant.Product.isSuspended) {
        results.push({
          variantId: item.variantId,
          price: 0,
          availableStock: 0,
          name: "",
          isAvailable: false,
        });
        continue;
      }

      const price = Number(variant.price ?? variant.Product.basePrice ?? 0);
      const stock = variant.Inventory?.quantity ?? 0;
      const image = variant.Product.images?.[0] ?? "";

      results.push({
        variantId: variant.id,
        price,
        availableStock: stock,
        name: variant.Product.name,
        image: image || undefined,
        isAvailable: stock > 0,
      });
    }

    return {
      success: true,
      data: results,
    };
  } catch (error: any) {
    console.error("Error syncing cart items:", error);
    return {
      success: false,
      error: error?.message || "Failed to sync cart items details.",
    };
  }
}

"use server";

import { prisma } from "@/services/prisma.service";

export type ValidateCartItemPayload = {
  productId?: string;
  variantId: string;
};

export async function validateCartItemsAction(items: ValidateCartItemPayload[]) {
  const invalidItems: ValidateCartItemPayload[] = [];

  for (const item of items) {
    const existingVariant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (existingVariant) continue;

    const skuVariant = await prisma.productVariant.findUnique({ where: { sku: item.variantId } });
    if (skuVariant) continue;

    const product = item.productId
      ? await prisma.product.findUnique({
          where: { id: item.productId },
          include: { ProductVariant: true },
        })
      : null;

    if (product && product.ProductVariant.length > 0) continue;

    invalidItems.push(item);
  }

  if (invalidItems.length > 0) {
    return {
      success: false,
      invalidItems,
      error: "Some items in your cart are no longer available. Please review your cart.",
    };
  }

  return { success: true };
}

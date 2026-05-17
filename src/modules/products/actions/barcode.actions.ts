"use server";

import { generateBarcodeServer } from "@/lib/barcodes";
import { prisma } from "@/services/prisma.service";

/**
 * Generate a barcode for a specific variant
 */
export async function getVariantBarcodeAction(variantId?: string, sku?: string) {
  try {
    if (!variantId && !sku) return { success: false, error: "Identifier not provided" };

    const variant = await prisma.productVariant.findUnique({
      where: variantId ? { id: variantId } : { sku: sku },
      select: { sku: true, barcode: true }
    });

    if (!variant) return { success: false, error: "Variant not found" };

    const identityText = variant.barcode || variant.sku;
    const barcodeDataUrl = await generateBarcodeServer(identityText);

    return {
      success: true,
      data: barcodeDataUrl
    };
  } catch (error) {
    console.error("Error generating barcode action:", error);
    return { success: false, error: "Failed to generate identity signature" };
  }
}

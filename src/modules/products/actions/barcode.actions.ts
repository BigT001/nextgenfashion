"use server";

import { generateBarcodeServer } from "@/lib/barcodes";
import { prisma } from "@/services/prisma.service";

/**
 * Generate a barcode for a specific variant
 */
export async function getVariantBarcodeAction(variantId: string) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
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

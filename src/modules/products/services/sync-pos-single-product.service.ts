import { prisma } from "@/services/prisma.service";

/**
 * SYNC POS SINGLE PRODUCT SERVICE
 * Handles real-time webhook events for a single item from the PHP POS
 */
export class SyncPosSingleProductService {
  static async execute(item: any): Promise<{ success: boolean; productId?: string; action: "CREATE" | "UPDATE" | "SKIP"; error?: string }> {
    if (!item || !item.item_id) {
      return { success: false, action: "SKIP", error: "Missing item_id in payload" };
    }

    try {
      // 1. Process Category
      const categoryName = (item.category || "Uncategorized").trim();
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        create: {
          name: categoryName,
          description: `Category imported for ${categoryName}`
        },
        update: {}
      });

      // 2. Parse price fields
      const unitPrice = parseFloat(item.unit_price || "0");
      const costPrice = parseFloat(item.cost_price || "0");

      // 3. Check existing SKU
      const sku = `POS-ITEM-${item.item_id}`;
      const existingVariant = await prisma.productVariant.findUnique({
        where: { sku },
        include: { product: true }
      });

      // 4. Calculate total stock quantity
      let totalQty = 0;
      if (item.locations) {
        for (const locId in item.locations) {
          totalQty += parseFloat(item.locations[locId].quantity || "0");
        }
      } else if (item.quantity !== undefined) {
        // Fallback if quantity is directly passed
        totalQty = parseFloat(item.quantity || "0");
      }

      if (existingVariant) {
        // UPDATE PRODUCT
        await prisma.product.update({
          where: { id: existingVariant.productId },
          data: {
            name: item.name,
            description: item.description || item.long_description || existingVariant.product.description || "Imported from PHP Point of Sale",
            basePrice: unitPrice,
            costPrice: costPrice,
            categoryId: category.id,
          }
        });

        // UPDATE VARIANT
        await prisma.productVariant.update({
          where: { sku },
          data: {
            barcode: item.item_number || item.barcode_name || null,
            size: item.size || "OS",
            color: "Default",
            price: unitPrice,
          }
        });

        // UPDATE INVENTORY
        await prisma.inventory.upsert({
          where: { variantId: existingVariant.id },
          create: {
            variantId: existingVariant.id,
            quantity: totalQty,
            lowStockThreshold: 5
          },
          update: {
            quantity: totalQty
          }
        });

        console.log(`⚡ [Realtime Webhook] Updated existing product ID: ${existingVariant.productId} (${item.name})`);
        return { success: true, productId: existingVariant.productId, action: "UPDATE" };
      } else {
        // CREATE PRODUCT
        const product = await prisma.product.create({
          data: {
            name: item.name,
            description: item.description || item.long_description || "Imported from PHP Point of Sale",
            basePrice: unitPrice,
            costPrice: costPrice,
            categoryId: category.id,
            targetGender: "BOTH",
            images: []
          }
        });

        // CREATE VARIANT
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku,
            barcode: item.item_number || item.barcode_name || null,
            size: item.size || "OS",
            color: "Default",
            price: unitPrice,
          }
        });

        // CREATE INVENTORY
        await prisma.inventory.create({
          data: {
            variantId: variant.id,
            quantity: totalQty,
            lowStockThreshold: 5
          }
        });

        console.log(`⚡ [Realtime Webhook] Created new product: ${product.id} (${item.name})`);
        return { success: true, productId: product.id, action: "CREATE" };
      }
    } catch (err: any) {
      console.error(`❌ Realtime Webhook sync failed for item ID ${item.item_id}:`, err);
      return { success: false, action: "SKIP", error: err.message };
    }
  }
}

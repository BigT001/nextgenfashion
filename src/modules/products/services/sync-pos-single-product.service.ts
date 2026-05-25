import { prisma } from "@/services/prisma.service";

const normalizeImageUrls = (images: unknown): string[] => {
  if (!images) return [];
  const urls = Array.isArray(images) ? images : [images];

  return urls
    .map((image) => {
      if (typeof image === "string") return image;
      if (image && typeof image === "object") {
        return (
          (image as any).url ||
          (image as any).image_url ||
          (image as any).image ||
          (image as any).thumbnail ||
          null
        );
      }
      return null;
    })
    .filter((url): url is string => {
      if (!url || typeof url !== "string") return false;
      const trimmed = url.trim();
      if (!trimmed) return false;
      if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return false;
      return /^(https?:\/\/|\/)/.test(trimmed);
    });
};

const extractItemImageUrls = (item: any): string[] => {
  if (!item || typeof item !== "object") return [];
  const candidates: any[] = [];

  if (item.images) candidates.push(item.images);
  if (item.image_url) candidates.push(item.image_url);
  if (item.image) candidates.push(item.image);
  if (item.thumbnail) candidates.push(item.thumbnail);
  if (item.photos) candidates.push(item.photos);
  if (item.media) candidates.push(item.media);

  return normalizeImageUrls(candidates.flat());
};

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
      const categoryName = (item.category || item.category_name || "Uncategorized").trim();
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        create: {
          name: categoryName,
          description: `Category imported for ${categoryName}`
        },
        update: {}
      });

      // 2. Parse price fields
      const unitPrice = parseFloat(item.unit_price || item.price || item.selling_price || "0");
      const costPrice = parseFloat(item.cost_price || item.cost_price || "0");

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
      } else if (item.stock !== undefined) {
        totalQty = parseFloat(item.stock || "0");
      } else if (item.quantity !== undefined) {
        totalQty = parseFloat(item.quantity || "0");
      }

      const imageUrls = extractItemImageUrls(item);
      const productDescription =
        item.long_description ||
        item.description ||
        item.details ||
        item.notes ||
        (existingVariant?.product.description || "Imported from PHP Point of Sale");

      if (existingVariant) {
        // UPDATE PRODUCT
        const updateData: any = {
          name: item.name || existingVariant.product.name,
          description: productDescription,
          basePrice: unitPrice,
          costPrice,
          categoryId: category.id,
        };

        if (imageUrls.length > 0) {
          updateData.images = Array.from(new Set([...(existingVariant.product.images ?? []), ...imageUrls]));
        }

        await prisma.product.update({
          where: { id: existingVariant.productId },
          data: updateData,
        });

        // UPDATE VARIANT
        await prisma.productVariant.update({
          where: { sku },
          data: {
            barcode: item.item_number || item.barcode_name || item.barcode || null,
            size: item.size || item.variant_size || "OS",
            color: item.color || "Default",
            price: unitPrice,
          }
        });

        // UPDATE INVENTORY
        await prisma.inventory.upsert({
          where: { variantId: existingVariant.id },
          create: {
            variantId: existingVariant.id,
            quantity: Number.isNaN(totalQty) ? 0 : totalQty,
            lowStockThreshold: 5
          },
          update: {
            quantity: Number.isNaN(totalQty) ? 0 : totalQty
          }
        });

        console.log(`⚡ [Realtime Webhook] Updated existing product ID: ${existingVariant.productId} (${item.name}) with ${imageUrls.length} image(s)`);
        return { success: true, productId: existingVariant.productId, action: "UPDATE" };
      } else {
        // CREATE PRODUCT
        const product = await prisma.product.create({
          data: {
            name: item.name,
            description: productDescription,
            basePrice: unitPrice,
            costPrice,
            categoryId: category.id,
            targetGender: "BOTH",
            images: imageUrls,
          }
        });

        // CREATE VARIANT
        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku,
            barcode: item.item_number || item.barcode_name || item.barcode || null,
            size: item.size || item.variant_size || "OS",
            color: item.color || "Default",
            price: unitPrice,
          }
        });

        // CREATE INVENTORY
        await prisma.inventory.create({
          data: {
            variantId: variant.id,
            quantity: Number.isNaN(totalQty) ? 0 : totalQty,
            lowStockThreshold: 5
          }
        });

        console.log(`⚡ [Realtime Webhook] Created new product: ${product.id} (${item.name}) with ${imageUrls.length} image(s)`);
        return { success: true, productId: product.id, action: "CREATE" };
      }
    } catch (err: any) {
      console.error(`❌ Realtime Webhook sync failed for item ID ${item.item_id}:`, err);
      return { success: false, action: "SKIP", error: err.message };
    }
  }
}

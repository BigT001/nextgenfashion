import { prisma } from "@/services/prisma.service";

export interface SyncResult {
  success: boolean;
  totalSynced: number;
  totalCreated: number;
  totalUpdated: number;
  errors: string[];
}

/**
 * SYNC POS PRODUCTS SERVICE
 * Layer 3: Business Logic
 * Optimized for lightning-fast batch parallel processing
 */
export class SyncPosProductsService {
  static async execute(): Promise<SyncResult> {
    const apiKey = process.env.POS_API_KEY;
    const apiUrl = process.env.POS_API_URL;

    if (!apiKey || !apiUrl) {
      throw new Error("POS_API_KEY or POS_API_URL not configured in environment variables.");
    }

    let offset = 0;
    const limit = 100;
    let keepFetching = true;

    let totalSynced = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    const errors: string[] = [];

    console.log("🔄 Fetching categories and variant caches to optimize sync speeds...");
    
    // 1. Pre-fetch all categories for local memory lookups
    const categories = await prisma.category.findMany();
    const categoryMap = new Map<string, string>(); // name (lowercase) -> id
    categories.forEach(c => categoryMap.set(c.name.trim().toLowerCase(), c.id));

    // 2. Pre-fetch all existing POS-ITEM variants for local memory lookups
    const existingVariants = await prisma.productVariant.findMany({
      where: { sku: { startsWith: "POS-ITEM-" } },
      include: { product: true }
    });
    
    const variantMap = new Map<string, { id: string; productId: string; product: any }>(); // sku -> variant
    existingVariants.forEach(v => variantMap.set(v.sku, v));

    console.log(`📦 Loaded cache: ${categoryMap.size} categories, ${variantMap.size} synced variants.`);
    console.log("🔄 Starting full POS products catalog synchronization parallel pipeline...");

    while (keepFetching) {
      const url = `${apiUrl}/items?limit=${limit}&offset=${offset}`;
      
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json"
          }
        });

        if (res.status !== 200) {
          throw new Error(`POS API responded with status ${res.status}`);
        }

        const items = await res.json();
        if (!Array.isArray(items) || items.length === 0) {
          keepFetching = false;
          break;
        }

        console.log(`📡 Fetched page of ${items.length} items from POS (offset: ${offset}). Syncing...`);

        // Process items in parallel chunks of 20 to balance speed & database pool size
        const chunkSize = 20;
        for (let idx = 0; idx < items.length; idx += chunkSize) {
          const chunk = items.slice(idx, idx + chunkSize);
          
          await Promise.all(
            chunk.map(async (item) => {
              try {
                // 1. Process Category (local cache or upsert)
                const categoryName = (item.category || "Uncategorized").trim();
                const normalizedCatName = categoryName.toLowerCase();
                let categoryId = categoryMap.get(normalizedCatName);

                if (!categoryId) {
                  const newCat = await prisma.category.upsert({
                    where: { name: categoryName },
                    create: {
                      name: categoryName,
                      description: `Category imported for ${categoryName}`
                    },
                    update: {}
                  });
                  categoryId = newCat.id;
                  categoryMap.set(normalizedCatName, categoryId);
                }

                // 2. Parse price fields
                const unitPrice = parseFloat(item.unit_price || "0");
                const costPrice = parseFloat(item.cost_price || "0");

                // 3. Lookup variant (O(1) in-memory)
                const sku = `POS-ITEM-${item.item_id}`;
                const existingVariant = variantMap.get(sku);

                // 4. Calculate total stock quantity from locations
                let totalQty = 0;
                if (item.locations) {
                  for (const locId in item.locations) {
                    totalQty += parseFloat(item.locations[locId].quantity || "0");
                  }
                }

                if (existingVariant) {
                  // Only run updates if there is a potential variation or base update
                  await prisma.product.update({
                    where: { id: existingVariant.productId },
                    data: {
                      name: item.name,
                      description: item.description || item.long_description || existingVariant.product.description || "Imported from PHP Point of Sale",
                      basePrice: unitPrice,
                      costPrice: costPrice,
                      categoryId: categoryId,
                    }
                  });

                  await prisma.productVariant.update({
                    where: { sku },
                    data: {
                      barcode: item.item_number || item.barcode_name || null,
                      size: item.size || "OS",
                      color: "Default",
                      price: unitPrice,
                    }
                  });

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

                  totalUpdated++;
                } else {
                  // CREATE NEW PRODUCT
                  const product = await prisma.product.create({
                    data: {
                      name: item.name,
                      description: item.description || item.long_description || "Imported from PHP Point of Sale",
                      basePrice: unitPrice,
                      costPrice: costPrice,
                      categoryId: categoryId,
                      targetGender: "BOTH",
                      images: []
                    }
                  });

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

                  await prisma.inventory.create({
                    data: {
                      variantId: variant.id,
                      quantity: totalQty,
                      lowStockThreshold: 5
                    }
                  });

                  // Add to local map for later pagination checks
                  variantMap.set(sku, { id: variant.id, productId: product.id, product });
                  totalCreated++;
                }
                
                totalSynced++;
              } catch (itemErr: any) {
                console.error(`Error syncing item ID ${item.item_id}:`, itemErr);
                errors.push(`Item ID ${item.item_id} (${item.name}): ${itemErr.message}`);
              }
            })
          );
        }

        offset += limit;
        if (offset > 15000) {
          keepFetching = false;
        }
      } catch (err: any) {
        console.error("Batch fetch error:", err);
        errors.push(`Batch fetch offset ${offset} failed: ${err.message}`);
        keepFetching = false;
      }
    }

    console.log(`🎉 Sync Completed. Total Synced: ${totalSynced}. Created: ${totalCreated}. Updated: ${totalUpdated}.`);

    return {
      success: errors.length === 0,
      totalSynced,
      totalCreated,
      totalUpdated,
      errors
    };
  }
}

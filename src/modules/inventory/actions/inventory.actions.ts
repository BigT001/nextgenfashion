"use server";

import { prisma } from "@/services/prisma.service";

/**
 * Fetch all inventory data for the executive dashboard
 */
export async function getInventoryDashboardAction() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: {
          include: {
            inventory: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    // Process data for dashboard view
    const processedProducts = await Promise.all(products.map(async p => {
      const totalStock = p.variants.reduce((acc, v) => acc + (v.inventory?.quantity || 0), 0);
      const isLowStock = p.variants.some(v => (v.inventory?.quantity || 0) <= (v.inventory?.lowStockThreshold || 5));
      const status = totalStock === 0 ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock";

      // Fetch latest movement log for the main variant
      const mainVariantId = p.variants[0]?.id;
      let lastMovement = "No movements logged";
      if (mainVariantId) {
        const latestLog = await prisma.auditLog.findFirst({
          where: {
            entity: "ProductVariant",
            entityId: mainVariantId
          },
          orderBy: {
            createdAt: "desc"
          }
        });
        if (latestLog) {
          const details = latestLog.details as any;
          const reason = (details?.reason || "").toLowerCase();
          
          if (latestLog.action === "STOCK_DECREMENT" && (reason.includes("customer purchase") || reason.includes("sale") || reason.includes("pos"))) {
            lastMovement = "SALES OUTFLOW";
          } else if (latestLog.action === "STOCK_DECREMENT") {
            lastMovement = "STOCK DECREMENT";
          } else if (latestLog.action === "STOCK_INCREMENT") {
            lastMovement = "STOCK INCREMENT";
          } else {
            lastMovement = latestLog.action.replace("_", " ");
          }
        }
      }

      return {
        id: p.id,
        name: p.name,
        category: p.category.name,
        categoryId: p.categoryId,
        sku: p.variants[0]?.sku || "N/A",
        variantId: p.variants[0]?.id || null,
        stock: totalStock,
        price: Number(p.basePrice),
        costPrice: Number(p.costPrice || 0),
        images: p.images,
        image: p.images?.[0] || null,
        isSuspended: p.isSuspended,
        status,
        lastMovement
      };
    }));

    // Calculate Executive KPIs
    const totalInventoryValue = processedProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const stockAlerts = processedProducts.filter(p => p.status !== "In Stock").length;

    return {
      success: true,
      data: {
        products: processedProducts,
        kpis: {
          totalProducts: products.length,
          stockAlerts,
          totalValue: totalInventoryValue
        }
      }
    };
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    return { success: false, error: "Failed to load inventory intelligence" };
  }
}

export async function getAuditLogsAction(variantId?: string) {
  try {
    const { InventoryQueries } = await import("../queries/inventory.queries");
    const logs = await InventoryQueries.findAuditLogs({ variantId });
    return { success: true, data: JSON.parse(JSON.stringify(logs)) };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return { success: false, error: "Failed to retrieve audit intelligence" };
  }
}

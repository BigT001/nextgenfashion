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

    // Fetch latest movement log for all main variants in a single bulk query
    const mainVariantIds = products
      .map((p) => p.variants[0]?.id)
      .filter((id): id is string => typeof id === "string");

    const latestLogs = await prisma.auditLog.findMany({
      where: {
        entity: "ProductVariant",
        entityId: { in: mainVariantIds }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Build a Map of latest log per variant ID (since ordered desc, first encountered is latest)
    const logsMap = new Map<string, any>();
    for (const log of latestLogs) {
      if (log.entityId && !logsMap.has(log.entityId)) {
        logsMap.set(log.entityId, log);
      }
    }

    // Process data for dashboard view
    const processedProducts = products.map(p => {
      const totalStock = p.variants.reduce((acc, v) => acc + (v.inventory?.quantity || 0), 0);
      const isLowStock = p.variants.some(v => (v.inventory?.quantity || 0) <= (v.inventory?.lowStockThreshold || 5));
      const status = totalStock === 0 ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock";

      const mainVariantId = p.variants[0]?.id;
      let lastMovement = "No movements logged";

      if (mainVariantId) {
        const latestLog = logsMap.get(mainVariantId);
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
        wholesalePrice: Number(p.costPrice || 0),
        retailPrice: Number(p.basePrice || 0),
        images: p.images,
        image: p.images?.[0] || null,
        isSuspended: p.isSuspended,
        status,
        lastMovement
      };
    });

    // Calculate Executive KPIs
    const totalInventoryValue = processedProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const stockAlerts = processedProducts.filter(p => p.status !== "In Stock").length;
    const productsWithImages = processedProducts.filter(p => p.images && p.images.length > 0).length;

    return {
      success: true,
      data: {
        products: processedProducts,
        kpis: {
          totalProducts: products.length,
          stockAlerts,
          totalValue: totalInventoryValue,
          productsWithImages,
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

    // Hydrate logs with actual User names instead of userIds
    const userIds = Array.from(new Set(logs.map(l => l.userId).filter(Boolean)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true }
    });

    const userMap = new Map<string, string>();
    users.forEach(u => {
      if (u.name) userMap.set(u.id, u.name);
    });

    const hydratedLogs = logs.map(log => {
      const rawUser = log.userId || "system";
      const userName = userMap.get(rawUser) || (rawUser.toLowerCase() === "system" ? "System Admin" : rawUser);
      return {
        ...log,
        userName
      };
    });

    return { success: true, data: JSON.parse(JSON.stringify(hydratedLogs)) };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return { success: false, error: "Failed to retrieve audit intelligence" };
  }
}

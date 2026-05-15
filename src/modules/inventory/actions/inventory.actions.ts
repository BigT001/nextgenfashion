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
    const processedProducts = products.map(p => {
      const totalStock = p.variants.reduce((acc, v) => acc + (v.inventory?.quantity || 0), 0);
      const isLowStock = p.variants.some(v => (v.inventory?.quantity || 0) <= (v.inventory?.lowStockThreshold || 5));
      const status = totalStock === 0 ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock";

      return {
        id: p.id,
        name: p.name,
        category: p.category.name,
        categoryId: p.categoryId,
        sku: p.variants[0]?.sku || "N/A",
        stock: totalStock,
        price: Number(p.basePrice),
        costPrice: Number(p.costPrice || 0),
        status
      };
    });

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

export async function getAuditLogsAction() {
  try {
    const { InventoryQueries } = await import("../queries/inventory.queries");
    const logs = await InventoryQueries.findAuditLogs();
    return { success: true, data: JSON.parse(JSON.stringify(logs)) };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return { success: false, error: "Failed to retrieve audit intelligence" };
  }
}

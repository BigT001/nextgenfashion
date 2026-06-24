import { randomUUID } from "crypto";
import { events, SYSTEM_EVENTS } from "./events";
import { NotificationService } from "@/services/notification.service";
import { prisma } from "@/services/prisma.service";

/**
 * GLOBAL SYSTEM LISTENERS
 * Register all reactive side-effects here.
 */

// 1. Sale Handlers
events.on(SYSTEM_EVENTS.SALE.CREATED, async (data) => {
  try {
    // Reaction A: Send Order Confirmation (if customer email exists)
    if (data.customerEmail) {
      await NotificationService.sendOrderConfirmation({
        customerEmail: data.customerEmail,
        orderNumber: data.orderNumber,
        totalAmount: Number(data.totalAmount),
      });
    }
    
    // Reaction B: PERSISTENCE - Audit Log
    // Creating a senior-level, immutable record of the transaction
    const itemsWithDetails = [];
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: { Product: true },
        });
        if (variant) {
          itemsWithDetails.push({
            productName: variant.Product.name,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            quantity: item.quantity,
            price: item.price,
          });
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        id: randomUUID(),
        userId: data.userId,
        action: "SALE_COMPLETED",
        entity: "Sale",
        entityId: data.saleId,
        details: {
          orderNumber: data.orderNumber,
          totalAmount: data.totalAmount,
          itemCount: data.items.length,
          items: itemsWithDetails,
        },
      },
    });

    console.log(`[Event Success] Audit log and notification processed for order ${data.orderNumber}`);

    // Reaction C: Speedaf Auto-fulfillment dispatch
    try {
      const { dispatchOrderToSpeedafAction } = await import("@/modules/delivery/actions/actions");
      const dispatchRes = await dispatchOrderToSpeedafAction(data.saleId);
      if (dispatchRes.success) {
        console.log(`[Event Success] Speedaf auto-fulfillment waybill created for order ${data.orderNumber}: ${dispatchRes.waybillNumber}`);
      } else {
        console.warn(`[Event Warning] Speedaf auto-fulfillment skipped/failed for order ${data.orderNumber}: ${dispatchRes.error}`);
      }
    } catch (speedafErr) {
      console.error(`[Event Error] Speedaf auto-fulfillment dispatch threw error:`, speedafErr);
    }
  } catch (error) {
    console.error(`[Event Error] Failed to process sale:created side-effects:`, error);
  }
});

// 2. Inventory Handlers
events.on(SYSTEM_EVENTS.INVENTORY.LOW_STOCK, async (data) => {
  try {
    // Reaction: Alert staff
    await NotificationService.sendLowStockAlert({
      variantId: data.variantId,
      currentStock: data.currentStock,
    });
    
    // Reaction: Log the alert
    await prisma.auditLog.create({
      data: {
        id: randomUUID(),
        userId: "system",
        action: "LOW_STOCK_ALERT",
        entity: "Inventory",
        entityId: data.variantId,
        details: {
          currentStock: data.currentStock,
        },
      },
    });
  } catch (error) {
    console.error(`[Event Error] Failed to process low_stock side-effects:`, error);
  }
});

console.log("✅ System event listeners registered.");

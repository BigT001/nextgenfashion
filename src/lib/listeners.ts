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
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: "SALE_COMPLETED",
        entity: "Sale",
        entityId: data.saleId,
        details: {
          orderNumber: data.orderNumber,
          totalAmount: data.totalAmount,
          itemCount: data.items.length,
        },
      },
    });

    console.log(`[Event Success] Audit log and notification processed for order ${data.orderNumber}`);
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

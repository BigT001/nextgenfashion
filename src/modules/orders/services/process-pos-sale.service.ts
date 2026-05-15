import { OrderQueries } from "../queries/order.queries";
import { DecrementStockService } from "@/modules/inventory/services/decrement-stock.service";
import { prisma } from "@/services/prisma.service";
import { PaymentMethod } from "@prisma/client";
import { events, SYSTEM_EVENTS } from "@/lib/events";

/**
 * PROCESS POS SALE SERVICE
 * Layer 3: Business Logic & Orchestration
 */
export class ProcessPOSSaleService {
  /**
   * EXECUTE TRANSACTION
   * Orchestrates the complex flow of recording a sale and triggering side-effects.
   */
  static async execute(data: {
    items: { variantId: string; quantity: number; price: number }[];
    totalAmount: number;
    paymentMethod: PaymentMethod;
    customerId?: string;
    userId: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. INVENTORY: Primary Stock Deduction
      // This happens inside the transaction for immediate data integrity
      for (const item of data.items) {
        await DecrementStockService.forSale(item.variantId, item.quantity, tx, data.userId);
      }

      // 2. ORDER: Persist Sale Record
      const orderNumber = `ORD-POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const sale = await OrderQueries.createSale({
        orderNumber,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        customer: data.customerId ? { connect: { id: data.customerId } } : undefined,
        user: { connect: { id: data.userId } },
        items: {
          create: data.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      }, tx);

      // 3. EVENT: Emit Project-Wide Notification
      // We emit the event AFTER the database records are locked but before the transaction completes
      // to ensure listeners can participate in the transaction context if needed (though usually async).
      events.emit(SYSTEM_EVENTS.SALE.CREATED, {
        saleId: sale.id,
        orderNumber: sale.orderNumber,
        totalAmount: sale.totalAmount,
        items: data.items,
        userId: data.userId,
      });

      return sale;
    });
  }
}

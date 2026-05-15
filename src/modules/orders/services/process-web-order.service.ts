import { OrderQueries } from "../queries/order.queries";
import { CustomerQueries } from "@/modules/customers/queries/customer.queries";
import { DecrementStockService } from "@/modules/inventory/services/decrement-stock.service";
import { PaymentService } from "@/services/payment.service";
import { prisma } from "@/services/prisma.service";
import { events, SYSTEM_EVENTS } from "@/lib/events";
import { PaymentMethod } from "@prisma/client";

/**
 * PROCESS WEB ORDER SERVICE
 * Layer 3: Business Logic & Orchestration
 */
export class ProcessWebOrderService {
  static async execute(data: {
    items: { variantId: string; quantity: number; price: number }[];
    totalAmount: number;
    shippingInfo: {
      fullName: string;
      email: string;
      phone: string;
      address: string;
    };
    paymentMethod: "CARD" | "TRANSFER" | "CASH_ON_DELIVERY";
  }) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. CUSTOMER: Identification
      let customer = await CustomerQueries.findByEmail(data.shippingInfo.email);
      if (!customer) {
        customer = await CustomerQueries.create({
          name: data.shippingInfo.fullName,
          email: data.shippingInfo.email,
          phone: data.shippingInfo.phone,
          address: data.shippingInfo.address,
        }, tx);
      }

      // 2. PAYMENT: Process
      const paymentMethodMapping: Record<string, PaymentMethod> = {
        "CARD": "CARD",
        "TRANSFER": "TRANSFER",
        "CASH_ON_DELIVERY": "CASH",
      };
      const paymentMethod = paymentMethodMapping[data.paymentMethod];
      
      await PaymentService.processPayment({
        amount: data.totalAmount,
        method: paymentMethod,
      }, tx);

      // 3. INVENTORY: Atomic Deduction (Downward Dependency Flow)
      for (const item of data.items) {
        await DecrementStockService.forSale(item.variantId, item.quantity, tx);
      }

      // 4. ORDER: Create Record
      const orderNumber = `WEB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      return await OrderQueries.createSale({
        orderNumber,
        totalAmount: data.totalAmount,
        paymentMethod: paymentMethod,
        customer: customer?.id ? { connect: { id: customer.id } } : undefined,
        items: {
          create: data.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      }, tx);
    });

    // 5. EVENT: Emit SALE_CREATED (Reactive Orchestration)
    if (result) {
      events.emit(SYSTEM_EVENTS.SALE.CREATED, {
        saleId: result.id,
        orderNumber: result.orderNumber,
        totalAmount: result.totalAmount,
        customerEmail: data.shippingInfo.email,
        items: data.items,
      });
    }

    return result;
  }
}

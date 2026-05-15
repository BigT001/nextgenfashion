"use server";

import { OrderQueries } from "../queries/order.queries";
import { CustomerQueries } from "../../customers/queries/customer.queries";
import { prisma } from "@/services/prisma.service";
import { SaleStatus } from "@prisma/client";

/**
 * Fetch all orders for the management dashboard
 */
export async function getOrdersDashboardAction() {
  try {
    const orders = await OrderQueries.findAll();
    return {
      success: true,
      data: JSON.parse(JSON.stringify(orders)),
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { success: false, error: "Failed to load order management data" };
  }
}

/**
 * Fetch deep-dive details for a specific order
 */
export async function getOrderDetailAction(orderId: string) {
  try {
    const order = await OrderQueries.findById(orderId);
    if (!order) return { success: false, error: "Order intelligence not found" };

    return {
      success: true,
      data: JSON.parse(JSON.stringify(order)),
    };
  } catch (error) {
    console.error("Error fetching order details:", error);
    return { success: false, error: "Failed to perform fulfillment audit" };
  }
}

/**
 * Update the status of an order
 */
export async function updateOrderStatusAction(orderId: string, status: SaleStatus) {
  try {
    const updatedOrder = await OrderQueries.updateStatus(orderId, status);
    return {
      success: true,
      data: JSON.parse(JSON.stringify(updatedOrder))
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error: "Failed to update fulfillment state" };
  }
}

/**
 * Create a new order (from Storefront Checkout)
 * Note: Customer model has: name, email, phone, address (no totalSpent/lastOrderAt)
 * Note: Sale model has no shippingAddress field — stored on Customer.address
 */
export async function createOrderAction(data: {
  items: { variantId: string; quantity: number; price: number }[];
  totalAmount: number;
  shippingInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  paymentMethod: "CASH" | "CARD" | "TRANSFER" | "POS";
}) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or Connect Customer
      const email = data.shippingInfo.email;
      const address = `${data.shippingInfo.address}, ${data.shippingInfo.city}`;
      
      let customer = await CustomerQueries.findByEmail(email, tx);
      if (customer) {
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: { address }
        });
      } else {
        customer = await CustomerQueries.create({
          email,
          name: data.shippingInfo.fullName,
          phone: data.shippingInfo.phone,
          address,
        }, tx);
      }

      // 2. Create Sale
      const sale = await OrderQueries.createSale({
        orderNumber: `NG-${Date.now().toString(36).toUpperCase()}`,
        totalAmount: data.totalAmount,
        status: "PENDING",
        paymentMethod: data.paymentMethod,
        customer: { connect: { id: customer.id } },
        items: {
          create: data.items.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      }, tx);

      // 3. Update inventory stock levels
      for (const item of data.items) {
        await tx.inventory.updateMany({
          where: { variantId: item.variantId },
          data: {
            quantity: { decrement: item.quantity },
          },
        });
      }

      return sale;
    });

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(result)) 
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, error: "Failed to process luxury acquisition" };
  }
}

/**
 * Fetch orders for the logged-in patron
 */
export async function getPatronOrdersAction(customerId: string) {
  try {
    const orders = await OrderQueries.findByCustomerId(customerId);
    return {
      success: true,
      data: JSON.parse(JSON.stringify(orders))
    };
  } catch (error) {
    console.error("Error fetching patron orders:", error);
    return { success: false, error: "Failed to load your order history" };
  }
}

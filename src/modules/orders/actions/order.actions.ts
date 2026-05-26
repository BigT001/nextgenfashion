"use server";

import { OrderQueries } from "../queries/order.queries";
import { CustomerQueries } from "../../customers/queries/customer.queries";
import { prisma } from "@/services/prisma.service";
import { SaleStatus } from "@prisma/client";

export async function validateCartItemsAction(items: { productId?: string; variantId: string }[]) {
  const invalidItems: Array<{ productId?: string; variantId: string }> = [];

  for (const item of items) {
    const existingVariant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (existingVariant) continue;

    const skuVariant = await prisma.productVariant.findUnique({ where: { sku: item.variantId } });
    if (skuVariant) continue;

    const product = item.productId ? await prisma.product.findUnique({
      where: { id: item.productId },
      include: { variants: true },
    }) : null;

    if (product && product.variants.length > 0) continue;

    invalidItems.push(item);
  }

  if (invalidItems.length > 0) {
    return {
      success: false,
      invalidItems,
      error: "Some items in your cart are no longer available. Please review your cart.",
    };
  }

  return { success: true };
}

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
export type CreateOrderActionPayload = {
  items: { productId?: string; variantId: string; quantity: number; price: number }[];
  totalAmount: number;
  shippingInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  paymentMethod: "CASH" | "CARD" | "TRANSFER" | "POS";
  paymentRef?: string;
  status?: import("@prisma/client").SaleStatus;
  customerId?: string;
};

export async function createOrderAction(data: CreateOrderActionPayload) {
  try {
    console.log("[createOrderAction] received payload", {
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      customerId: data.customerId,
      items: data.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    const sanitizedItems = await Promise.all(data.items.map(async (item) => {
      console.log("[createOrderAction] validating cart item", {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
      });

      if (!item.variantId || typeof item.variantId !== "string" || item.variantId.trim().length === 0) {
        throw new Error("Cannot create order: invalid product variant selected.");
      }

      const existingVariant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
      console.log("[createOrderAction] existingVariant lookup", {
        variantId: item.variantId,
        found: Boolean(existingVariant),
        variantIdResolved: existingVariant?.id,
      });

      if (existingVariant) {
        return {
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        };
      }

      const skuVariant = await prisma.productVariant.findUnique({ where: { sku: item.variantId } });
      console.log("[createOrderAction] skuVariant lookup", {
        candidate: item.variantId,
        found: Boolean(skuVariant),
        variantIdResolved: skuVariant?.id,
        skuResolved: skuVariant?.sku,
      });

      if (skuVariant) {
        return {
          variantId: skuVariant.id,
          quantity: item.quantity,
          price: item.price,
        };
      }

      const productId = item.productId;
      console.log("[createOrderAction] fallback by productId", { productId });
      if (!productId) {
        throw new Error("Cannot create order: selected product variant is no longer available.");
      }

      let fallbackVariant = null as null | { id: string };
      let product = await prisma.product.findUnique({
        where: { id: productId },
        include: { variants: true },
      });
      console.log("[createOrderAction] product lookup for fallback", {
        productId,
        productFound: Boolean(product),
        variantCount: product?.variants?.length ?? 0,
        variants: product?.variants?.map((v) => ({ id: v.id, sku: v.sku, size: v.size, color: v.color })) ?? [],
      });

      if (!product) {
        const productVariantCandidate = await prisma.productVariant.findUnique({ where: { id: productId } });
        console.log("[createOrderAction] productId candidate as variant lookup", {
          candidateId: productId,
          found: Boolean(productVariantCandidate),
          variantId: productVariantCandidate?.id,
          resolvedProductId: productVariantCandidate?.productId,
        });

        if (productVariantCandidate) {
          fallbackVariant = productVariantCandidate;
          product = await prisma.product.findUnique({
            where: { id: productVariantCandidate.productId },
            include: { variants: true },
          });
          console.log("[createOrderAction] resolved product from variant candidate", {
            resolvedProductId: product?.id,
            variantCount: product?.variants?.length ?? 0,
          });
        }
      }

      if (!fallbackVariant) {
        fallbackVariant = product?.variants?.[0] ?? null;
      }

      console.log("[createOrderAction] chosen fallbackVariant", {
        productId,
        found: Boolean(fallbackVariant),
        variantIdResolved: fallbackVariant?.id,
      });

      if (!fallbackVariant) {
        throw new Error(`Cannot create order: no available variant found for product ${productId}.`);
      }

      return {
        variantId: fallbackVariant.id,
        quantity: item.quantity,
        price: item.price,
      };
    }));

    console.log("[createOrderAction] sanitizedItems before transaction", sanitizedItems);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or Connect Customer
      const email = data.shippingInfo.email;
      const address = `${data.shippingInfo.address}, ${data.shippingInfo.city}`;
      let customer;

      if (data.customerId) {
        console.log("[createOrderAction] updating existing customer by customerId", data.customerId);
        customer = await tx.customer.update({
          where: { id: data.customerId },
          data: {
            name: data.shippingInfo.fullName,
            email,
            phone: data.shippingInfo.phone,
            address,
          },
        });
      } else {
        console.log("[createOrderAction] looking up customer by email", email);
        customer = await CustomerQueries.findByEmail(email, tx);
        console.log("[createOrderAction] customer lookup result", { found: Boolean(customer), customerId: customer?.id });
        if (customer) {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: {
              name: data.shippingInfo.fullName,
              phone: data.shippingInfo.phone,
              address,
            },
          });
        } else {
          customer = await CustomerQueries.create({
            email,
            name: data.shippingInfo.fullName,
            phone: data.shippingInfo.phone,
            address,
          }, tx);
        }
      }

      // 2. Create Sale
      console.log("[createOrderAction] creating sale for customer", { customerId: customer.id, totalAmount: data.totalAmount, itemCount: sanitizedItems.length });
      const sale = await OrderQueries.createSale({
        orderNumber: `NG-${Date.now().toString(36).toUpperCase()}`,
        totalAmount: data.totalAmount,
        status: data.status || "PENDING",
        paymentMethod: data.paymentMethod,
        paymentRef: data.paymentRef,
        customer: { connect: { id: customer.id } },
        items: {
          create: sanitizedItems.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      }, tx);

      // 3. Update inventory stock levels
      for (const item of sanitizedItems) {
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
      data: JSON.parse(JSON.stringify(result)),
    };
  } catch (error: any) {
    console.error("[createOrderAction] error creating order", {
      error: error?.message ?? error,
      stack: error?.stack,
      payload: {
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        customerId: data.customerId,
        items: data.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    });
    return { success: false, error: error?.message || "Failed to process luxury acquisition" };
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

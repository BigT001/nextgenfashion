"use server";

import { OrderQueries } from "../queries/order.queries";
import { CustomerQueries } from "../../customers/queries/customer.queries";
import { prisma } from "@/services/prisma.service";
import { PaymentService } from "@/services/payment.service";
import { events, SYSTEM_EVENTS } from "@/lib/events";
import { SaleStatus, PaymentMethod } from "@prisma/client";

export async function validateCartItemsAction(items: { productId?: string; variantId: string }[]) {
  const invalidItems: Array<{ productId?: string; variantId: string }> = [];

  for (const item of items) {
    const existingVariant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (existingVariant) continue;

    const skuVariant = await prisma.productVariant.findUnique({ where: { sku: item.variantId } });
    if (skuVariant) continue;

    const product = item.productId ? await prisma.product.findUnique({
      where: { id: item.productId },
      include: { ProductVariant: true },
    }) : null;

    if (product && product.ProductVariant.length > 0) continue;

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
    provinceCode?: string;
    provinceName?: string;
    cityCode?: string;
    cityName?: string;
    districtCode?: string;
    districtName?: string;
    deliveryFee?: number;
  };
  paymentMethod: "CASH" | "CARD" | "TRANSFER" | "POS";
  paymentRef?: string;
  paymentProviderData?: any;
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
        include: { ProductVariant: true },
      });
      console.log("[createOrderAction] product lookup for fallback", {
        productId,
        productFound: Boolean(product),
        variantCount: product?.ProductVariant?.length ?? 0,
        variants: product?.ProductVariant?.map((v) => ({ id: v.id, sku: v.sku, size: v.size, color: v.color })) ?? [],
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
            include: { ProductVariant: true },
          });
          console.log("[createOrderAction] resolved product from variant candidate", {
            resolvedProductId: product?.id,
            variantCount: product?.ProductVariant?.length ?? 0,
          });
        }
      }

      if (!fallbackVariant) {
        fallbackVariant = product?.ProductVariant?.[0] ?? null;
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

    // Ensure status value is acceptable by Prisma enum - sanitize unknown values (e.g. 'PAID')
    const KNOWN_STATUSES = [
      "PENDING",
      "PAID",
      "COMPLETED",
      "CANCELLED",
      "REFUNDED",
      "PROCESSING",
      "SHIPPED",
    ];

    const requestedStatus = String(data.status || "PENDING").toUpperCase();
    const statusValue = KNOWN_STATUSES.includes(requestedStatus) ? requestedStatus : "PENDING";

    let customer: { id: string; email?: string | null } | null = null;
    // Try the transaction; if the database enum isn't migrated yet and rejects
    // the 'PAID' value, retry once with 'PENDING' as a safe fallback.
    let result: any;
    try {
      result = await prisma.$transaction(async (tx) => {
        // 1. Create or Connect Customer
        const email = data.shippingInfo.email;
        const address = `${data.shippingInfo.address}, ${data.shippingInfo.city}`;

        let customer: any = null;
        if (data.customerId) {
          console.log("[createOrderAction] looking up existing customer by customerId", data.customerId);
          customer = await tx.customer.findUnique({ where: { id: data.customerId } });
          if (customer) {
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
            console.warn("[createOrderAction] customerId provided but not found in DB", data.customerId);
          }
        }

        if (!customer) {
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

        // Ensure the User record is linked to this Customer ID so the session doesn't get stale
        if (customer && customer.id) {
          await tx.user.updateMany({
            where: { email: email },
            data: { customerId: customer.id }
          });
        }

        // 2. Create Sale
        let verifiedPaymentMethod: PaymentMethod = data.paymentMethod;
        let providerPayload = data.paymentProviderData ?? null;

        if (data.paymentRef) {
          try {
            const verified = await PaymentService.verifyTransaction(data.paymentRef);
            if (verified) {
              verifiedPaymentMethod = PaymentService.resolvePaymentMethod(verified);
              providerPayload = verified;
              console.log("[createOrderAction] verified payment method from provider", { verifiedPaymentMethod, reference: data.paymentRef });
            }
          } catch (verifyError) {
            console.warn("[createOrderAction] unable to verify payment method with provider, falling back to provider payload or provided value", {
              error: verifyError,
              providedMethod: data.paymentMethod,
              paymentRef: data.paymentRef,
            });
          }
        }

        if (providerPayload) {
          const fallbackMethod = PaymentService.resolvePaymentMethod(providerPayload);
          if (fallbackMethod !== "CARD" || data.paymentMethod === "TRANSFER") {
            verifiedPaymentMethod = fallbackMethod;
          }
        }

        console.log("[createOrderAction] creating sale for customer", { customerId: customer.id, totalAmount: data.totalAmount, itemCount: sanitizedItems.length, paymentMethod: verifiedPaymentMethod });
        const sale = await OrderQueries.createSale({
          orderNumber: `NG-${Date.now().toString(36).toUpperCase()}`,
          totalAmount: data.totalAmount,
          status: statusValue as any,
          paymentMethod: verifiedPaymentMethod,
          paymentRef: data.paymentRef,
          Customer: { connect: { id: customer.id } },
          
          deliveryProvinceCode: data.shippingInfo.provinceCode || null,
          deliveryProvinceName: data.shippingInfo.provinceName || null,
          deliveryCityCode: data.shippingInfo.cityCode || null,
          deliveryCityName: data.shippingInfo.cityName || null,
          deliveryDistrictCode: data.shippingInfo.districtCode || null,
          deliveryDistrictName: data.shippingInfo.districtName || null,
          deliveryFee: data.shippingInfo.deliveryFee || null,
          carrier: data.shippingInfo.provinceCode ? "SPEEDAF" : null,

          SaleItem: {
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
    } catch (err: any) {
      const msg = String(err?.message || err);
      const lowerMsg = msg.toLowerCase();
      const isStatusEnumError = [
        "invalid value for argument `status`",
        "invalid value",
        "invalid input value for enum",
      ].some((pattern) => lowerMsg.includes(pattern));

      if (isStatusEnumError) {
        console.warn("[createOrderAction] database rejected status value, retrying with PENDING", { statusValue, error: msg });
        // retry with PENDING
        result = await prisma.$transaction(async (tx) => {
          // create/connect customer (same logic as above)
          const email = data.shippingInfo.email;
          const address = `${data.shippingInfo.address}, ${data.shippingInfo.city}`;

          let customer: any = null;
          if (data.customerId) {
            customer = await tx.customer.findUnique({ where: { id: data.customerId } });
            if (customer) {
              customer = await tx.customer.update({
                where: { id: data.customerId },
                data: {
                  name: data.shippingInfo.fullName,
                  email,
                  phone: data.shippingInfo.phone,
                  address,
                },
              });
            }
          }

          if (!customer) {
            customer = await CustomerQueries.findByEmail(email, tx);
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

          if (customer && customer.id) {
            await tx.user.updateMany({
              where: { email: email },
              data: { customerId: customer.id }
            });
          }

          let retryPaymentMethod: PaymentMethod = data.paymentMethod;
          if (data.paymentRef) {
            try {
              const verified = await PaymentService.verifyTransaction(data.paymentRef);
              retryPaymentMethod = PaymentService.resolvePaymentMethod(verified);
              console.log("[createOrderAction] verified payment method on retry", { retryPaymentMethod, reference: data.paymentRef });
            } catch {
              console.warn("[createOrderAction] cannot verify payment method on retry, using provided value", {
                providedMethod: data.paymentMethod,
                paymentRef: data.paymentRef,
              });
            }
          }

          const sale = await OrderQueries.createSale({
            orderNumber: `NG-${Date.now().toString(36).toUpperCase()}`,
            totalAmount: data.totalAmount,
            status: "PENDING",
            paymentMethod: retryPaymentMethod,
            paymentRef: data.paymentRef,
            Customer: { connect: { id: customer.id } },

            deliveryProvinceCode: data.shippingInfo.provinceCode || null,
            deliveryProvinceName: data.shippingInfo.provinceName || null,
            deliveryCityCode: data.shippingInfo.cityCode || null,
            deliveryCityName: data.shippingInfo.cityName || null,
            deliveryDistrictCode: data.shippingInfo.districtCode || null,
            deliveryDistrictName: data.shippingInfo.districtName || null,
            deliveryFee: data.shippingInfo.deliveryFee || null,
            carrier: data.shippingInfo.provinceCode ? "SPEEDAF" : null,

            SaleItem: {
              create: sanitizedItems.map(item => ({
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          }, tx);

          for (const item of sanitizedItems) {
            await tx.inventory.updateMany({
              where: { variantId: item.variantId },
              data: { quantity: { decrement: item.quantity } },
            });
          }

          return sale;
        });
      } else {
        throw err;
      }
    }

    const successResult = {
      success: true,
      data: JSON.parse(JSON.stringify(result)),
    };

    events.emit(SYSTEM_EVENTS.SALE.CREATED, {
      saleId: result.id,
      orderNumber: result.orderNumber,
      totalAmount: Number(result.totalAmount),
      customerEmail: data.shippingInfo.email || null,
      items: sanitizedItems,
      userId: data.customerId || "guest",
    });

    return successResult;
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

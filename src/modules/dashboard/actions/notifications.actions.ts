"use server";

import { prisma } from "@/services/prisma.service";

/**
 * Fetch recent notifications for the bell icon:
 * - New inbound emails (last 7 days, unread/queued)
 * - New orders (last 7 days)
 */
export async function getNotificationsAction() {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [emails, orders, lowStockCount] = await Promise.all([
      // Recent inbound emails
      prisma.emailMessage.findMany({
        where: {
          direction: "INBOUND",
          createdAt: { gte: since },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          subject: true,
          fromEmail: true,
          createdAt: true,
          status: true,
        },
      }),
      // Recent orders
      prisma.sale.findMany({
        where: {
          createdAt: { gte: since },
          status: { not: "CANCELLED" },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          createdAt: true,
          paymentMethod: true,
          Customer: { select: { name: true } },
        },
      }),
      // Critical stock count
      prisma.inventory.count({
        where: { quantity: { lt: 8 } },
      }),
    ]);

    const notifications = [
      ...emails.map((e) => ({
        id: `email-${e.id}`,
        type: "email" as const,
        title: e.subject || "New Email",
        subtitle: `From: ${e.fromEmail}`,
        createdAt: e.createdAt.toISOString(),
        href: "/dashboard/mailroom",
      })),
      ...orders.map((o) => ({
        id: `order-${o.id}`,
        type: "order" as const,
        title: `New Order #${o.orderNumber}`,
        subtitle: o.Customer?.name
          ? `From ${o.Customer.name} — ₦${Number(o.totalAmount).toLocaleString()}`
          : `₦${Number(o.totalAmount).toLocaleString()} — ${o.paymentMethod}`,
        createdAt: o.createdAt.toISOString(),
        href: "/dashboard/orders",
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      success: true,
      data: JSON.parse(
        JSON.stringify({ notifications, lowStockCount, total: notifications.length })
      ),
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Failed to load notifications" };
  }
}

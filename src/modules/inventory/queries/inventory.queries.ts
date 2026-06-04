import { randomUUID } from "crypto";
import { prisma } from "@/services/prisma.service";

/**
 * INVENTORY REPOSITORY
 * Layer 4: Direct Database Interaction
 */
export class InventoryQueries {
  static async updateQuantity(variantId: string, quantityChange: number, tx?: any) {
    const client = tx || prisma;
    return await client.inventory.update({
      where: { variantId },
      data: {
        quantity: { increment: quantityChange },
      },
    });
  }

  static async findByVariantId(variantId: string) {
    return await prisma.inventory.findUnique({
      where: { variantId },
    });
  }

  static async createAuditLog(data: {
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    details: any;
  }, tx?: any) {
    const client = tx || prisma;
    return await client.auditLog.create({
      data: {
        id: randomUUID(),
        ...data,
      },
    });
  }

  static async findLowStock() {
    return await prisma.inventory.findMany({
      where: {
        quantity: {
          lte: prisma.inventory.fields.lowStockThreshold,
        },
      },
      include: {
        ProductVariant: {
          include: {
            Product: true,
          },
        },
      },
    });
  }

  static async findAuditLogs(params: { variantIds?: string[]; limit?: number } = {}) {
    return await prisma.auditLog.findMany({
      where: {
        entity: "ProductVariant",
        ...(params.variantIds && params.variantIds.length > 0 && { entityId: { in: params.variantIds } }),
      },
      orderBy: { createdAt: "desc" },
      take: params.limit || 50,
    });
  }
}

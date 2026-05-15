import { prisma } from "@/services/prisma.service";
import { Prisma } from "@prisma/client";

/**
 * ORDER REPOSITORY
 * Layer 4: Direct Database Interaction
 * In our schema, an Order is represented by the Sale model.
 */
export class OrderQueries {
  static async createSale(data: Prisma.SaleCreateInput, tx?: any) {
    const client = tx || prisma;
    return await client.sale.create({
      data,
      include: {
        items: true,
      },
    });
  }

  static async findById(id: string) {
    return await prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        customer: true,
        user: true, // Staff member
      },
    });
  }

  /**
   * Fetch all orders with deep inclusions for the management dashboard
   */
  static async findAll() {
    return await prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { name: true }
                }
              }
            }
          }
        }
      },
    });
  }

  /**
   * Update the status of an order
   */
  static async updateStatus(id: string, status: import("@prisma/client").SaleStatus) {
    return await prisma.sale.update({
      where: { id },
      data: { status },
      include: { customer: true }
    });
  }

  /**
   * Fetch all orders for a specific customer
   */
  static async findByCustomerId(customerId: string) {
    return await prisma.sale.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { select: { name: true, images: true } } }
            }
          }
        }
      }
    });
  }
}

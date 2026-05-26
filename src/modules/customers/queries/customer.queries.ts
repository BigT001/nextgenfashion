import { prisma } from "@/services/prisma.service";
import { Prisma } from "@prisma/client";

export const CustomerQueries = {
  /**
   * Fetch all customers with their orders for the CRM dashboard
   */
  async getAllCustomers() {
    return await prisma.customer.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
      include: {
        sales: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          }
        }
      }
    });
  },

  /**
   * Find a customer by their unique digital identity (email)
   */
  async findByEmail(email: string, tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    return await db.customer.findUnique({
      where: { email },
    });
  },

  /**
   * Register a new patron into the CRM
   */
  async create(data: Prisma.CustomerCreateInput, tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    return await db.customer.create({
      data,
    });
  },

  /**
   * Fetch CRM KPIs
   */
  async getCRMKPIs() {
    const totalCustomers = await prisma.customer.count({ where: { isArchived: false } });
    const allSales = await prisma.sale.aggregate({
      _sum: { totalAmount: true },
    });
    const totalRevenue = Number(allSales._sum.totalAmount || 0);
    const avgLTV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    return {
      totalCustomers,
      avgLTV,
    };
  },

  /**
   * Fetch deep-dive details for a specific customer
   */
  async getCustomerDetails(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!customer) return null;

    // Calculate Extended Metrics from ALL sales data
    const totalSpent = customer.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const orderCount = customer.sales.length;
    const aov = orderCount > 0 ? totalSpent / orderCount : 0;

    // Analyze Behavior: Top Categories or Products
    const productFrequency: Record<string, number> = {};
    customer.sales.forEach(sale => {
      sale.items.forEach(item => {
        const name = item.variant.product.name;
        productFrequency[name] = (productFrequency[name] || 0) + item.quantity;
      });
    });

    const topProducts = Object.entries(productFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, qty]) => ({ name, qty }));

    // Calculate Spending Trend (last 6 months)
    const trend = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthStr = d.toLocaleString('default', { month: 'short' });
      const monthSales = customer.sales.filter(s => {
        const sd = new Date(s.createdAt);
        return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
      });
      return {
        month: monthStr,
        spent: monthSales.reduce((sum, s) => sum + Number(s.totalAmount), 0)
      };
    });

    return {
      ...customer,
      email: customer.email || "",
      phone: customer.phone || "",
      sales: customer.sales.slice(0, 10), // Only return last 10 for UI performance
      metrics: {
        ltv: totalSpent,
        orderCount,
        aov,
        lastActive: customer.sales[0]?.createdAt || customer.createdAt,
        topProducts
      },
      trend
    };
  },

  /**
   * Search for customers by name, email, or phone
   */
  async searchCustomers(query?: string) {
    return await prisma.customer.findMany({
      where: {
        isArchived: false,
        ...(query ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
          ]
        } : {})
      },
      take: 10,
      orderBy: { name: 'asc' }
    });
  },

  /**
   * Fetch all archived customers
   */
  async getArchivedCustomers() {
    return await prisma.customer.findMany({
      where: { isArchived: true },
      orderBy: { updatedAt: "desc" },
      include: {
        sales: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          }
        }
      }
    });
  },

  /**
   * Archive a customer
   */
  async archiveCustomer(id: string) {
    return await prisma.$transaction(async (tx) => {
      await tx.user.deleteMany({
        where: { customerId: id },
      });

      return await tx.customer.update({
        where: { id },
        data: { isArchived: true },
      });
    });
  },

  /**
   * Unarchive a customer
   */
  async unarchiveCustomer(id: string) {
    return await prisma.customer.update({
      where: { id },
      data: { isArchived: false },
    });
  }
};

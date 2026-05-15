import { prisma } from "@/services/prisma.service";
import { Prisma } from "@prisma/client";

export const CustomerQueries = {
  /**
   * Fetch all customers with their orders for the CRM dashboard
   */
  async getAllCustomers() {
    return await prisma.customer.findMany({
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
    const totalCustomers = await prisma.customer.count();
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
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            paymentMethod: true
          }
        }
      }
    });

    if (!customer) return null;

    // Calculate Extended Metrics from actual sales data
    const totalSpent = customer.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const orderCount = customer.sales.length;
    const aov = orderCount > 0 ? totalSpent / orderCount : 0;

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
      sales: customer.sales,
      metrics: {
        ltv: totalSpent,
        orderCount,
        aov,
        lastActive: customer.sales[0]?.createdAt || customer.createdAt
      },
      trend
    };
  }
};

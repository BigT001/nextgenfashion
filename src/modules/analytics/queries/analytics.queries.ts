import { prisma } from "@/services/prisma.service";

// Native JS date helpers (no date-fns dependency required)
function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function subDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export const AnalyticsQueries = {
  /**
   * Get main executive KPIs
   */
  async getExecutiveKPIs() {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // 1. Total Revenue (Lifetime)
    const totalRevenue = await prisma.sale.aggregate({
      where: {
        status: { not: "CANCELLED" }
      },
      _sum: { totalAmount: true }
    });

    // 2. Today's Revenue
    const todayRevenue = await prisma.sale.aggregate({
      where: {
        status: { not: "CANCELLED" },
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        }
      },
      _sum: { totalAmount: true }
    });

    // 3. Total Sales Count
    const totalSales = await prisma.sale.count({
      where: {
        status: { not: "CANCELLED" }
      }
    });

    // 4. Low Stock Count — compare quantity against default threshold (5)
    const lowStockCount = await prisma.inventory.count({
      where: {
        quantity: {
          lte: 5
        }
      }
    });

    // 5. Total physical inventory quantity
    const totalInventory = await prisma.inventory.aggregate({
      _sum: { quantity: true }
    });

    // 6. Active Customers Count
    const activeCustomers = await prisma.customer.count();

    // 7. Total Inventory Valuation
    // Calculates the worth of goods left in stock based on product selling price
    const inventories = await prisma.inventory.findMany({
      include: {
        ProductVariant: {
          include: {
            Product: { select: { basePrice: true } }
          }
        }
      }
    });

    const totalInventoryValue = inventories.reduce((sum, inv) => {
      // Prioritize variant price, fallback to base product price
      const price = inv.ProductVariant.price ? Number(inv.ProductVariant.price) : Number(inv.ProductVariant.Product.basePrice);
      return sum + (price * inv.quantity);
    }, 0);

    return {
      lifetimeRevenue: Number(totalRevenue._sum.totalAmount || 0),
      todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
      totalSales,
      lowStockCount,
      totalInventory: Number(totalInventory._sum.quantity || 0),
      totalInventoryValue,
      activeCustomers
    };
  },

  /**
   * Get revenue trend for the last 7 days
   */
  async getRevenueTrend() {
    const today = new Date();
    const trend = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const start = startOfDay(date);
      const end = endOfDay(date);

      const dailyRevenue = await prisma.sale.aggregate({
        where: {
          status: { not: "CANCELLED" },
          createdAt: {
            gte: start,
            lte: end,
          }
        },
        _sum: { totalAmount: true }
      });

      trend.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: Number(dailyRevenue._sum.totalAmount || 0),
      });
    }

    return trend;
  },

  /**
   * Get top selling products
   */
  async getTopProducts() {
    const topItems = await prisma.saleItem.groupBy({
      by: ['variantId'],
      _sum: {
        quantity: true,
        price: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    // Hydrate with product names
    const hydratedProducts = await Promise.all(
      topItems.map(async (item) => {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: { Product: true }
        });
        return {
          name: variant?.Product.name || "Unknown Product",
          quantity: item._sum.quantity || 0,
          revenue: Number(item._sum.price || 0) * (item._sum.quantity || 0)
        };
      })
    );

    return hydratedProducts;
  },

  /**
   * Get 5 most recent transactions with hydrated customer and cashier information
   */
  async getRecentSales() {
    return await prisma.sale.findMany({
      orderBy: [
        { updatedAt: "desc" },
        { createdAt: "desc" }
      ],
      take: 5,
      include: {
        Customer: true,
        User: {
          select: { name: true }
        }
      }
    });
  },

  /**
   * Get 5 physical items with low stock (quantity <= 5) for alert highlights
   */
  async getLowStockItems() {
    return await prisma.inventory.findMany({
      where: {
        quantity: {
          lte: 5
        }
      },
      take: 5,
      include: {
        ProductVariant: {
          include: {
            Product: true
          }
        }
      }
    });
  },

  /**
   * Get category performance by aggregating product sales
   */
  async getCategoryPerformance() {
    const categories = await prisma.category.findMany({
      include: {
        Product: {
          include: {
            ProductVariant: {
              include: {
                SaleItem: true
              }
            }
          }
        }
      }
    });

    return categories.map(cat => {
      let unitsSold = 0;
      let revenue = 0;

      cat.Product.forEach(product => {
        product.ProductVariant.forEach(variant => {
          variant.SaleItem.forEach(item => {
            unitsSold += item.quantity;
            revenue += (Number(item.price) * item.quantity);
          });
        });
      });

      return {
        name: cat.name,
        unitsSold,
        revenue
      };
    }).sort((a, b) => b.revenue - a.revenue); // sort highest revenue first
  },

  /**
   * Get sales breakdown by payment method
   */
  async getPaymentMethodBreakdown() {
    const sales = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    return sales.map(s => ({
      method: s.paymentMethod,
      revenue: Number(s._sum.totalAmount || 0),
      count: s._count.id
    })).sort((a, b) => b.revenue - a.revenue);
  },

  /**
   * Get recently signed-up customers
   */
  async getRecentSignups() {
    return await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: { Sale: true }
        }
      }
    });
  }
};

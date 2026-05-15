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
      _sum: { totalAmount: true }
    });

    // 2. Today's Revenue
    const todayRevenue = await prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        }
      },
      _sum: { totalAmount: true }
    });

    // 3. Total Sales Count
    const totalSales = await prisma.sale.count();

    // 4. Low Stock Count — compare quantity against default threshold (5)
    const lowStockCount = await prisma.inventory.count({
      where: {
        quantity: {
          lte: 5
        }
      }
    });

    return {
      lifetimeRevenue: Number(totalRevenue._sum.totalAmount || 0),
      todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
      totalSales,
      lowStockCount
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
          include: { product: true }
        });
        return {
          name: variant?.product.name || "Unknown Product",
          quantity: item._sum.quantity || 0,
          revenue: Number(item._sum.price || 0) * (item._sum.quantity || 0)
        };
      })
    );

    return hydratedProducts;
  }
};

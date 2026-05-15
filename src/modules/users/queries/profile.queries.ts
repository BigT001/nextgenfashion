import { prisma } from "@/services/prisma.service";

export const ProfileQueries = {
  /**
   * Get comprehensive profile data for a specific user
   */
  async getProfileData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sales: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            customer: true
          }
        },
      }
    });

    if (!user) return null;

    // Aggregate lifetime performance
    const salesStats = await prisma.sale.aggregate({
      where: { userId },
      _sum: { totalAmount: true },
      _count: { id: true },
      _avg: { totalAmount: true }
    });

    return {
      user,
      stats: {
        totalRevenue: Number(salesStats._sum.totalAmount || 0),
        saleCount: salesStats._count.id,
        avgSale: Number(salesStats._avg.totalAmount || 0)
      }
    };
  }
};

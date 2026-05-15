import { prisma } from "@/services/prisma.service";

export const UserQueries = {
  /**
   * Get all staff members with their summarized contribution data
   */
  async getAllStaff() {
    return prisma.user.findMany({
      include: {
        sales: {
          select: {
            totalAmount: true,
            createdAt: true
          }
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  },

  /**
   * Get a single user by ID with deep inclusions
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        sales: true,
        sessions: true,
        accounts: true
      }
    });
  },

  /**
   * Get executive Staff KPIs
   */
  async getStaffKPIs() {
    const [totalStaff, adminCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } })
    ]);

    return {
      totalStaff,
      adminCount,
      staffCount: totalStaff - adminCount
    };
  }
};

import { prisma } from "@/services/prisma.service";

export const UserQueries = {
  /**
   * Get all staff members with their summarized contribution data
   */
  async getAllStaff() {
    return prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "SUPERADMIN", "STAFF"],
        },
      },
      include: {
        Sale: {
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
        Sale: true,
        Session: true,
        Account: true
      }
    });
  },

  /**
   * Get executive Staff KPIs
   */
  async getStaffKPIs() {
    const [totalStaff, adminCount] = await Promise.all([
      prisma.user.count({
        where: {
          role: {
            in: ["ADMIN", "SUPERADMIN", "STAFF"],
          },
        },
      }),
      prisma.user.count({
        where: {
          role: {
            in: ["ADMIN", "SUPERADMIN"],
          },
        },
      }),
    ]);

    return {
      totalStaff,
      adminCount,
      staffCount: totalStaff - adminCount
    };
  }
};

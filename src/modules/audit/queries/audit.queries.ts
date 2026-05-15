import { prisma } from "@/services/prisma.service";

export const AuditQueries = {
  /**
   * Get recent audit logs with staff attribution
   */
  async getRecentLogs(limit = 100) {
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // Manually fetch user info for each log since AuditLog doesn't have a direct relation in schema yet
    // In a real industrial app, we would use a relation, but for now we'll match by ID
    const userIds = Array.from(new Set(logs.map(l => l.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, role: true }
    });

    return logs.map(log => ({
      ...log,
      user: users.find(u => u.id === log.userId) || { name: "System", role: "SYSTEM" }
    }));
  },

  /**
   * Get audit statistics
   */
  async getAuditStats() {
    const [totalLogs, securityEvents] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { entity: "Security" } })
    ]);

    return {
      totalLogs,
      securityEvents
    };
  }
};

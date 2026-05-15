"use server";

import { AuditQueries } from "../queries/audit.queries";

/**
 * Fetch all data required for the Audit Dashboard
 */
export async function getAuditDashboardAction() {
  try {
    const [logs, stats] = await Promise.all([
      AuditQueries.getRecentLogs(200),
      AuditQueries.getAuditStats()
    ]);

    return {
      success: true,
      data: {
        logs,
        stats
      }
    };
  } catch (error) {
    console.error("Error fetching audit dashboard data:", error);
    return { success: false, error: "Failed to load system audit data" };
  }
}

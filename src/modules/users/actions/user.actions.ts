"use server";

import { UserQueries } from "../queries/user.queries";

/**
 * Fetch all data required for the Staff Management Dashboard
 */
export async function getStaffDashboardAction() {
  try {
    const [staff, kpis] = await Promise.all([
      UserQueries.getAllStaff(),
      UserQueries.getStaffKPIs()
    ]);

    // Process staff to calculate revenue contribution
    const processedStaff = staff.map(user => {
      const revenueGenerated = user.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const saleCount = user.sales.length;

      return {
        ...user,
        revenueGenerated,
        saleCount
      };
    });

    return {
      success: true,
      data: {
        staff: processedStaff,
        kpis
      }
    };
  } catch (error) {
    console.error("Error fetching staff dashboard data:", error);
    return { success: false, error: "Failed to load personnel management data" };
  }
}

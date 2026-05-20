"use server";

import { AnalyticsQueries } from "../queries/analytics.queries";

/**
 * Fetch all data required for the Executive Dashboard
 * Aggregates multiple queries into a single, high-fidelity payload
 */
export async function getExecutiveDashboardAction() {
  try {
    const [
      kpis, 
      trend, 
      topProducts, 
      recentSales, 
      lowStockItems, 
      categoryPerformance, 
      paymentMethods, 
      recentSignups
    ] = await Promise.all([
      AnalyticsQueries.getExecutiveKPIs(),
      AnalyticsQueries.getRevenueTrend(),
      AnalyticsQueries.getTopProducts(),
      AnalyticsQueries.getRecentSales(),
      AnalyticsQueries.getLowStockItems(),
      AnalyticsQueries.getCategoryPerformance(),
      AnalyticsQueries.getPaymentMethodBreakdown(),
      AnalyticsQueries.getRecentSignups()
    ]);

    return {
      success: true,
      data: JSON.parse(JSON.stringify({
        kpis,
        trend,
        topProducts,
        recentSales,
        lowStockItems,
        categoryPerformance,
        paymentMethods,
        recentSignups
      }))
    };
  } catch (error) {
    console.error("Error fetching executive dashboard data:", error);
    return { success: false, error: "Failed to load business intelligence data" };
  }
}

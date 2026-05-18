import { getExecutiveDashboardAction } from "@/modules/analytics/actions/analytics.actions";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const result = await getExecutiveDashboardAction();
  
  const initialData = result.success && result.data ? result.data : {
    kpis: {
      lifetimeRevenue: 0,
      todayRevenue: 0,
      totalSales: 0,
      lowStockCount: 0,
      totalInventory: 0,
      activeCustomers: 0
    },
    trend: [],
    recentSales: [],
    topProducts: [],
    lowStockItems: []
  };

  const serializedData = JSON.parse(JSON.stringify(initialData));

  return <DashboardClient initialData={serializedData} />;
}

import { getExecutiveDashboardAction } from "@/modules/analytics/actions/analytics.actions";
import { DashboardClient } from "./dashboard-client";
import { Suspense } from "react";

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

  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white mx-auto"></div>
          <p className="text-xs uppercase tracking-widest text-white/60">Loading Suite...</p>
        </div>
      </div>
    }>
      <DashboardClient initialData={serializedData} />
    </Suspense>
  );
}

import { getInventoryDashboardAction } from "@/modules/inventory/actions/inventory.actions";
import InventoryClient from "./client";

export const dynamic = "force-dynamic";

const defaultData = {
  products: [],
  kpis: {
    totalProducts: 0,
    stockAlerts: 0,
    totalValue: 0,
    productsWithImages: 0,
  },
};

export default async function InventoryPage() {
  const result = await getInventoryDashboardAction();
  const initialData = result.success && result.data ? result.data : defaultData;

  return <InventoryClient initialData={initialData} />;
}

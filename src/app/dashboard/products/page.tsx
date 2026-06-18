import { getInventoryDashboardAction } from "@/modules/inventory/actions/inventory.actions";
import { getAutoVatSetting } from "@/modules/settings/actions/settings.actions";
import ProductsClient from "./client";

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

export default async function ProductsPage() {
  const result = await getInventoryDashboardAction();
  const vatEnabled = await getAutoVatSetting();
  const initialData = result.success && result.data ? result.data : defaultData;

  return <ProductsClient initialData={initialData} vatEnabled={vatEnabled} />;
}

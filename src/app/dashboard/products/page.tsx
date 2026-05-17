import { getInventoryDashboardAction } from "@/modules/inventory/actions/inventory.actions";
import ProductsClient from "./client";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const result = await getInventoryDashboardAction();
  return <ProductsClient initialData={result.data} />;
}

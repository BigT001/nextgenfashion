import { getInventoryDashboardAction } from "@/modules/inventory/actions/inventory.actions";
import InventoryClient from "./client";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const result = await getInventoryDashboardAction();
  return <InventoryClient initialData={result.data} />;
}

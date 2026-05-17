import { getOrdersDashboardAction } from "@/modules/orders/actions/order.actions";
import OrdersClient from "./client";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const result = await getOrdersDashboardAction();
  return <OrdersClient initialData={result.data || []} />;
}

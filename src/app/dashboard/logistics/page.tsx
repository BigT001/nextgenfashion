import { getLogisticsSalesAction } from "@/modules/delivery/actions/actions";
import LogisticsClient from "./client";

export const dynamic = "force-dynamic";

export default async function LogisticsPage() {
  const result = await getLogisticsSalesAction();
  return <LogisticsClient initialData={result.data || []} />;
}

import "dotenv/config";
import { getInventoryDashboardAction } from "../src/modules/inventory/actions/inventory.actions";

async function test() {
  const res = await getInventoryDashboardAction();
  console.log("RESULT:", JSON.stringify(res, null, 2));
}

test();

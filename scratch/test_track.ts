import { getOrderTrackingAction } from "../src/modules/delivery/actions/actions";

async function main() {
  const saleId = "fae5d141-7693-40e8-833a-419981ef6c4a";
  console.log(`Tracking order: ${saleId}`);
  try {
    const res = await getOrderTrackingAction(saleId);
    console.log("Tracking Result:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Error tracking:", err);
  }
}

main().catch(console.error).finally(() => process.exit(0));

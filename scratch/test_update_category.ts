import { updateCategoryAction, getCategoriesAction } from "../src/modules/products/actions/product.actions";

async function run() {
  console.log("Fetching categories...");
  const fetchRes = await getCategoriesAction();
  if (!fetchRes.success || !fetchRes.data || fetchRes.data.length === 0) {
    console.error("No categories found!");
    return;
  }

  const firstCat = fetchRes.data[0];
  console.log(`Original category: ${firstCat.name} (ID: ${firstCat.id}), Weight: ${firstCat.weight}`);

  console.log("Updating category weight to 0.75...");
  const updateRes = await updateCategoryAction(firstCat.id, firstCat.name, 0.75);
  if (!updateRes.success) {
    console.error("Failed to update category!", updateRes.error);
    return;
  }

  console.log("Updated category weight successfully:", updateRes.data);

  // Re-fetch to confirm persistence
  const confirmRes = await getCategoriesAction();
  const updatedCat = confirmRes.data?.find((c: any) => c.id === firstCat.id);
  console.log(`Confirmed category in DB: ${updatedCat.name}, Weight: ${updatedCat.weight}`);

  // Revert back to original weight
  console.log("Reverting category weight back...");
  await updateCategoryAction(firstCat.id, firstCat.name, firstCat.weight);
  console.log("Reverted.");
}

run().catch(console.error);

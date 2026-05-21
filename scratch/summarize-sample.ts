import * as fs from "fs";
import * as path from "path";

const filePath = path.join(__dirname, "pos-response-sample.json");

function summarize() {
  if (!fs.existsSync(filePath)) {
    console.error("❌ File not found:", filePath);
    return;
  }

  const items = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`📊 Scanning ${items.length} POS items...`);

  let withImages = 0;
  let withVariations = 0;
  let withTags = 0;
  let totalQuantity = 0;

  for (const item of items) {
    if (item.images && item.images.length > 0) {
      withImages++;
      console.log(`📸 Item with images: "${item.name}" (ID: ${item.item_id}) ->`, item.images);
    }
    if (item.variations && item.variations.length > 0) {
      withVariations++;
      console.log(`🎨 Item with variations: "${item.name}" (ID: ${item.item_id}) ->`, JSON.stringify(item.variations, null, 2));
    }
    if (item.tags && item.tags.length > 0) {
      withTags++;
    }

    // Extract quantity from locations
    if (item.locations) {
      for (const locId in item.locations) {
        const qty = parseFloat(item.locations[locId].quantity || 0);
        totalQuantity += qty;
      }
    }
  }

  console.log("\n📊 Summary Statistics:");
  console.log(`   🔸 Total Items: ${items.length}`);
  console.log(`   🔸 Items with Images: ${withImages}`);
  console.log(`   🔸 Items with Variations: ${withVariations}`);
  console.log(`   🔸 Items with Tags: ${withTags}`);
  console.log(`   🔸 Total Stock Quantity: ${totalQuantity}`);
}

summarize();

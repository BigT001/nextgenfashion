import * as fs from "fs";
import * as path from "path";

const API_KEY = "ok00wk04wcgosws0csk0k4ssw4kkow8owk8wo00w";
const BASE_URL = "https://nextgen.storeapp.com.ng/index.php/api/v1/items";

async function scanAll() {
  console.log("🔍 Scanning entire POS catalog via paginated API calls...");
  
  let offset = 0;
  const limit = 100;
  let allItems: any[] = [];
  let keepFetching = true;

  let totalQty = 0;
  let itemsWithImages = 0;
  let itemsWithVariations = 0;
  
  const sampleVariations: any[] = [];
  const sampleImages: any[] = [];

  while (keepFetching) {
    const url = `${BASE_URL}?limit=${limit}&offset=${offset}`;
    console.log(`📡 Fetching offset ${offset}...`);
    
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json"
        }
      });
      
      if (res.status !== 200) {
        console.error(`❌ Bad Status: ${res.status}`);
        break;
      }
      
      const items: any = await res.json();
      if (!Array.isArray(items) || items.length === 0) {
        console.log("⏹️ Received empty array or invalid response. Pagination completed.");
        keepFetching = false;
        break;
      }
      
      console.log(`   ✅ Received ${items.length} items.`);
      allItems = allItems.concat(items);
      
      for (const item of items) {
        // Count total qty
        if (item.locations) {
          for (const locId in item.locations) {
            totalQty += parseFloat(item.locations[locId].quantity || 0);
          }
        }
        
        // Check variations
        if (item.variations && item.variations.length > 0) {
          itemsWithVariations++;
          if (sampleVariations.length < 3) {
            sampleVariations.push({ name: item.name, variations: item.variations });
          }
        }
        
        // Check images
        if (item.images && item.images.length > 0) {
          itemsWithImages++;
          if (sampleImages.length < 3) {
            sampleImages.push({ name: item.name, images: item.images });
          }
        }
      }
      
      offset += limit;
      // Safety guard to avoid infinite loop
      if (offset > 5000) {
        console.log("⚠️ Safety limit reached (5000 items). Stopping.");
        break;
      }
    } catch (e) {
      console.error("❌ Error fetching page:", e);
      break;
    }
  }

  console.log("\n==========================================");
  console.log("📊 COMPLETE POS SCAN SUMMARY:");
  console.log(`   🔹 Total Items Fetched: ${allItems.length}`);
  console.log(`   🔹 Total Inventory Stock Units: ${totalQty}`);
  console.log(`   🔹 Items with Images: ${itemsWithImages}`);
  console.log(`   🔹 Items with Variations: ${itemsWithVariations}`);
  console.log("==========================================");

  if (sampleVariations.length > 0) {
    console.log("\n🔍 Sample Variations:");
    console.log(JSON.stringify(sampleVariations, null, 2));
  }
  
  if (sampleImages.length > 0) {
    console.log("\n🔍 Sample Images:");
    console.log(JSON.stringify(sampleImages, null, 2));
  }

  // Save the full item manifest to a file for analysis
  const manifestPath = path.join(__dirname, "pos-item-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(allItems.slice(0, 100), null, 2), "utf-8");
  console.log(`💾 Saved a subset manifest (100 items) to: ${manifestPath}`);
}

scanAll();

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const API_KEY = "ok00wk04wcgosws0csk0k4ssw4kkow8owk8wo00w";
const BASE_URL = "https://nextgen.storeapp.com.ng/index.php/api/v1/items?limit=500";

async function testApi() {
  console.log("🚀 Testing PHP POS API connection...");
  console.log(`📡 GET ${BASE_URL}`);

  try {
    const res = await fetch(BASE_URL, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
      }
    });

    console.log(`📶 Status: ${res.status} ${res.statusText}`);

    const text = await res.text();
    console.log(`📊 Response length: ${text.length} chars`);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("❌ Failed to parse response as JSON. Raw text preview:");
      console.log(text.slice(0, 1000));
      return;
    }

    console.log("✅ Successfully received and parsed JSON!");
    console.log("📦 Received items count:", Array.isArray(data) ? data.length : typeof data);
    
    // Save a sample of the data to a scratch file so we can view the structure
    const outputPath = path.join(__dirname, "pos-response-sample.json");
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`💾 Saved full response structure to: ${outputPath}`);

    // Print a small sample of the first item
    if (Array.isArray(data) && data.length > 0) {
      console.log("\n🔍 Sample Item Structure (First Item):");
      console.log(JSON.stringify(data[0], null, 2));
    } else if (data && typeof data === "object") {
      console.log("\n🔍 Sample Data Structure:");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
  }
}

testApi();

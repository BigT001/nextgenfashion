const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");

const appCode = "NG000025";
const secretKey = "uYMGr8eU";
const baseUrl = "https://uat-api.speedaf.com";

function generateSignature(timestamp, secretKey, dataStr) {
  return CryptoJS.MD5(`${timestamp}${secretKey}${dataStr}`).toString();
}

async function run() {
  const timestamp = Date.now().toString();
  const endpoint = "/open-api/common/area/getTreeByCountryCode";
  const url = `${baseUrl}${endpoint}?appCode=${appCode}&timestamp=${timestamp}`;
  
  const payload = { countryCode: "NG" };
  const payloadStr = JSON.stringify(payload);
  const sign = generateSignature(timestamp, secretKey, payloadStr);
  const body = JSON.stringify({ data: payloadStr, sign });

  console.log("Downloading Nigeria location tree...");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body,
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  const text = await response.text();
  const result = JSON.parse(text);

  if (!result.success) {
    throw new Error(`API Error: ${result.message || JSON.stringify(result.error)}`);
  }

  const destDir = path.join(__dirname, "../src/modules/delivery/assets");
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const destPath = path.join(destDir, "nigeria_area_tree.json");
  // Clean up the children tree to keep only relevant fields for UI weight reduction (optional but good practice)
  // Let's inspect the keys and output the structure first.
  fs.writeFileSync(destPath, JSON.stringify(result.data, null, 2), "utf8");
  console.log(`Successfully saved Nigeria location tree to ${destPath}`);
}

run().catch(console.error);

const CryptoJS = require("crypto-js");

const appCode = "NG000025";
const secretKey = "uYMGr8eU";
const baseUrl = "https://uat-api.speedaf.com";

function generateSignature(timestamp, secretKey, dataStr) {
  return CryptoJS.MD5(`${timestamp}${secretKey}${dataStr}`).toString();
}

async function request(endpoint, payload) {
  const timestamp = Date.now().toString();
  const url = `${baseUrl}${endpoint}?appCode=${appCode}&timestamp=${timestamp}`;
  const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload);
  const sign = generateSignature(timestamp, secretKey, payloadStr);
  const body = JSON.stringify({ data: payloadStr, sign });

  console.log(`\n--- Requesting ${endpoint} ---`);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body,
  });

  const text = await response.text();
  console.log(`Status: ${response.status}`);
  try {
    const parsed = JSON.parse(text);
    console.log("Success:", parsed.success);
    if (parsed.success) {
      if (Array.isArray(parsed.data)) {
        console.log(`Returned array of ${parsed.data.length} items. Sample:`, parsed.data.slice(0, 2));
      } else {
        console.log("Returned data type:", typeof parsed.data, "keys:", Object.keys(parsed.data));
      }
    } else {
      console.log("Error:", parsed.error || parsed.message);
    }
    return parsed;
  } catch (e) {
    console.log("Raw Response:", text.slice(0, 500));
    return null;
  }
}

async function run() {
  // Test 1: getTreeByCountryCode
  await request("/open-api/common/area/getTreeByCountryCode", { countryCode: "NG" });

  // Test 2: new/getArea (Get provinces in NG)
  await request("/open-api/common/area/new/getArea", { countryCode: "NG" });
}

run().catch(console.error);

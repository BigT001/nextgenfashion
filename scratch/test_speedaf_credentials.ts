import { createRequestEnvelope, generateSignature, decryptPayload } from "../src/lib/speedaf/crypto";

async function testCredentials(isUAT: boolean) {
  const baseUrl = isUAT ? "https://uat-api.speedaf.com" : "https://apis.speedaf.com";
  const endpoint = "/open-api/fee/getFee";
  const appCode = "NG000025";
  const secretKey = "uYMGr8eU";
  
  const timestamp = Date.now().toString();
  const url = `${baseUrl}${endpoint}?appCode=${appCode}&timestamp=${timestamp}`;

  const payload = {
    sendCountryCode: "NG",
    sendProvinceCode: "NGR00023",
    sendCityCode: "NGC00360",
    sendAreaCode: "NGA05072",
    deliveryCountryCode: "NG",
    deliveryProvinceCode: "NGR00023",
    deliveryCityCode: "NGC00359",
    deliveryAreaCode: "NGA05061",
    pickedTime: Date.now(),
    productCode: "1",
    subjectCode: "101",
    weight: "1"
  };

  const dataStr = JSON.stringify(payload);
  const sign = generateSignature(timestamp, secretKey, dataStr);
  const requestBody = JSON.stringify({
    data: dataStr,
    sign,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: requestBody,
  });

  const responseText = await response.text();
  console.log(`\n--- UAT Mode: ${isUAT} ---`);
  console.log("Status:", response.status);
  
  try {
    const parsed = JSON.parse(responseText);
    console.log("Response JSON:", parsed);
  } catch (e) {
    console.log("Response Text:", responseText);
  }
}

async function run() {
  await testCredentials(false); // Live
  await testCredentials(true);  // UAT
}

run();

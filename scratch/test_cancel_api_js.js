const CryptoJS = require("crypto-js");

const appCode = "NG000025";
const secretKey = "uYMGr8eU";
const baseUrl = "https://uat-api.speedaf.com";
const endpoint = "/open-api/express/order/cancelOrder";

function generateSignature(timestamp, secretKey, dataStr) {
  const payload = `${timestamp}${secretKey}${dataStr}`;
  return CryptoJS.MD5(payload).toString();
}

async function testCancel(payload, description) {
  const timestamp = Date.now().toString();
  const url = `${baseUrl}${endpoint}?appCode=${appCode}&timestamp=${timestamp}`;

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
  console.log(`\n--- Test: ${description} ---`);
  console.log("Payload:", JSON.stringify(payload));
  console.log("Status:", response.status);
  try {
    const parsed = JSON.parse(responseText);
    console.log("Response:", JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log("Response Text:", responseText);
  }
}

async function run() {
  await testCancel([
    {
      billCode: "NG020001602529",
      customerCode: "NG000025",
      reasonCode: "01",
      reason: "Customer request"
    }
  ], "customerCode + reasonCode");

  await testCancel([
    {
      billCode: "NG020001602529",
      customerCode: "NG000025",
      cancelReasonCode: "01",
      reason: "Customer request"
    }
  ], "customerCode + cancelReasonCode");

  await testCancel([
    {
      billCode: "NG020001602529",
      customerCode: "NG000025",
      reason_code: "01",
      reason: "Customer request"
    }
  ], "customerCode + reason_code");

  await testCancel([
    {
      billCode: "NG020001602529",
      customerCode: "NG000025",
      cancelReason: "01",
      reason: "Customer request"
    }
  ], "customerCode + cancelReason");

  await testCancel([
    {
      billCode: "NG020001602529",
      customerCode: "NG000025",
      cancel_reason_code: "01",
      reason: "Customer request"
    }
  ], "customerCode + cancel_reason_code");

  await testCancel([
    {
      billCode: "NG020001602529",
      customerCode: "NG000025",
      reason: "Customer request"
    }
  ], "customerCode + reason only");

  await testCancel([
    {
      billCode: "NG020001602529",
      customerCode: "NG000025",
      reasonCode: "01",
      cancelReasonCode: "01",
      reason_code: "01",
      cancelReason: "01",
      cancel_reason_code: "01",
      reason: "Customer request"
    }
  ], "customerCode + all candidate reason fields");
}

run().catch(console.error);

require("dotenv").config();
const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");

const IV = CryptoJS.enc.Hex.parse('1234567890abcdef');

function generateSignature(timestamp, secretKey, dataStr) {
  const payload = `${timestamp}${secretKey}${dataStr}`;
  return CryptoJS.MD5(payload).toString();
}

function encryptPayload(plaintext, secretKey) {
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const encrypted = CryptoJS.DES.encrypt(CryptoJS.enc.Utf8.parse(plaintext), key, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
}

function decryptPayload(ciphertextBase64, secretKey) {
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const decrypted = CryptoJS.DES.decrypt(ciphertextBase64, key, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

function createRequestEnvelope(data, secretKey, timestamp) {
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  const sign = generateSignature(timestamp, secretKey, dataStr);
  
  const envelope = {
    data: data, // Keep data as an object/structure rather than a string
    sign: sign
  };
  
  return encryptPayload(JSON.stringify(envelope), secretKey);
}

async function testFetch() {
  const appCode = process.env.SPEEDAF_APP_CODE;
  const secretKey = process.env.SPEEDAF_SECRET_KEY;
  const uatMode = process.env.SPEEDAF_UAT_MODE !== "false";

  console.log("Credentials:", { appCode, secretKey, uatMode });

  const baseUrl = uatMode ? "https://uat-api.speedaf.com" : "https://apis.speedaf.com";
  const timestamp = Date.now().toString();
  const endpoint = "/open-api/fee/getFee";
  const url = `${baseUrl}${endpoint}?appCode=${appCode}&timestamp=${timestamp}`;

  const payload = {
    sendCountryCode: "NG",
    sendProvinceCode: "NGR00023",
    sendCityCode: "NGC00353",
    sendAreaCode: "NGA04940",
    deliveryCountryCode: "NG",
    deliveryProvinceCode: "NGR00023",
    deliveryCityCode: "NGC00353",
    deliveryAreaCode: "NGA04940",
    pickedTime: "2026-06-22 14:00:00",
    productCode: "1",
    subjectCode: "101",
    weight: "1.5"
  };
  
  const payloadStr = JSON.stringify(payload);
  const sign = generateSignature(timestamp, secretKey, payloadStr);
  
  const envelope = {
    data: payloadStr,
    sign: sign
  };
  
  const requestBody = JSON.stringify(envelope);

  console.log("Request URL:", url);
  console.log("Sending unencrypted body:", requestBody);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: requestBody,
  });

  console.log("Response status:", response.status);
  const text = await response.text();
  console.log("Received raw response (first 200 chars):", text.slice(0, 200));

  let decrypted = "";
  try {
    decrypted = decryptPayload(text.trim(), secretKey);
    console.log("Decryption successful!");
  } catch (err) {
    console.error("Decryption failed. Error:", err.message);
    // Check if it's already JSON
    try {
      const parsed = JSON.parse(text);
      console.log("Response is plain JSON:", parsed);
      if (parsed.data) {
        decrypted = decryptPayload(parsed.data, secretKey);
        console.log("Decrypted inner data:", decrypted);
      }
    } catch (e) {
      console.error("Not a valid JSON either.");
    }
  }

  if (decrypted) {
    const dataObj = JSON.parse(decrypted);
    console.log("Parsed JSON response success state:", dataObj.success);
    
    // Save to the assets folder
    const assetsDir = path.join(__dirname, "../src/modules/delivery/assets");
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    const destPath = path.join(assetsDir, "nigeria_area_tree.json");
    fs.writeFileSync(destPath, JSON.stringify(dataObj, null, 2), "utf8");
    console.log("Wrote Nigeria area tree to:", destPath);
  }
}

testFetch().catch(console.error);

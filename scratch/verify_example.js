const CryptoJS = require("crypto-js");

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

const timestamp = 1626145617859;
const secretKey = "12345678";
const data = "123456";

const sign = generateSignature(timestamp, secretKey, data);
console.log("Generated Sign:", sign);
console.log("Expected Sign:  905f4a332552cd980967b11e96ce7592");

const envelope = {
  data: data,
  sign: sign
};

// Speedaf doc envelope order: {"data":"123456","sign":"..."}
const envelopeStr = JSON.stringify(envelope);
console.log("Envelope String:", envelopeStr);

const encrypted = encryptPayload(envelopeStr, secretKey);
console.log("Generated Encrypted:\n", encrypted);
console.log("Expected Encrypted:\n", "1XO9yaijPlrZAgwMB7UcHGmYUGAhaI0G3F7FmgUsAxI0TF/ymaH9qjH5potyFLDibx0CK+2J/L+fR+Qy5O0sWA==");

import CryptoJS from 'crypto-js';

// Fixed IV array converted to CryptoJS WordArray
const IV = CryptoJS.enc.Hex.parse('1234567890abcdef');

/**
 * Calculates MD5 Signature: md5(timestamp + secretKey + dataString)
 */
export function generateSignature(timestamp: string | number, secretKey: string, dataStr: string): string {
  const payload = `${timestamp}${secretKey}${dataStr}`;
  return CryptoJS.MD5(payload).toString();
}

/**
 * Encrypts a plaintext string using DES-CBC.
 */
export function encryptPayload(plaintext: string, secretKey: string): string {
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const encrypted = CryptoJS.DES.encrypt(CryptoJS.enc.Utf8.parse(plaintext), key, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7, // PKCS7 is functionally identical to PKCS5 for DES
  });
  return encrypted.toString();
}

/**
 * Decrypts a ciphertext Base64 string using DES-CBC.
 */
export function decryptPayload(ciphertextBase64: string, secretKey: string): string {
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const decrypted = CryptoJS.DES.decrypt(ciphertextBase64, key, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Builds the final encrypted envelope string.
 */
export function createRequestEnvelope(data: any, secretKey: string, timestamp: string | number): string {
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  const sign = generateSignature(timestamp, secretKey, dataStr);
  
  const envelope = {
    data: dataStr,
    sign: sign
  };
  
  return encryptPayload(JSON.stringify(envelope), secretKey);
}

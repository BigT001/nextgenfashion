import { PaymentMethod } from "@prisma/client";

const normalizeValue = (value: unknown) => {
  if (typeof value === "string") return value.toLowerCase().trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value).toLowerCase();
  return "";
};

const collectValues = (payload: any, result: string[] = []): string[] => {
  if (payload == null) return result;
  if (typeof payload === "string" || typeof payload === "number" || typeof payload === "boolean") {
    result.push(normalizeValue(payload));
    return result;
  }
  if (Array.isArray(payload)) {
    for (const item of payload) collectValues(item, result);
    return result;
  }
  if (typeof payload === "object") {
    for (const [key, value] of Object.entries(payload)) {
      result.push(normalizeValue(key));
      collectValues(value, result);
    }
    return result;
  }
  return result;
};

const transferRegex = /\b(bank|transfer|banktransfer|ussd|account|account_bank|account_number|bank_account|bank_account)\b/;
const cardRegex = /\b(card|visa|mastercard|debit|credit|chip|auth_model|payment_card)\b/;
const posRegex = /\b(pos|point\s*of\s*sale)\b/;
const cashRegex = /\b(cash|cash_on_delivery|cod)\b/;

/**
 * PAYMENT SERVICE
 * Layer 3: Business Logic
 */
export class PaymentService {
  static async processPayment(data: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
  }, tx?: any) {
    // Logic for interacting with Paystack, Stripe, or Cash verification
    console.log(`Processing ${data.method} payment of ${data.amount}`);
    
    // In a real implementation, we might record the payment transaction here
    return {
      success: true,
      transactionId: `PAY-${Date.now()}`,
      status: "PAID",
    };
  }

  static async verifyTransaction(reference: string) {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secretKey) {
      console.warn("Flutterwave secret key is not configured; skipping provider verification.");
      return null;
    }

    const ref = String(reference || "").trim();
    if (!ref) {
      console.warn("No payment reference provided for Flutterwave verification.");
      return null;
    }

    const baseUrl = "https://api.flutterwave.com/v3";
    const isNumeric = /^\d+$/.test(ref);
    const verifyUrl = isNumeric
      ? `${baseUrl}/transactions/${encodeURIComponent(ref)}/verify`
      : `${baseUrl}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(ref)}`;

    const response = await fetch(verifyUrl, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(`Flutterwave verification failed (${response.status}): ${text}`);
      return null;
    }

    const payload = await response.json();
    if (!payload || payload.status !== "success" || !payload.data) {
      console.warn(`Invalid Flutterwave verification payload: ${JSON.stringify(payload)}`);
      return null;
    }

    return payload.data;
  }

  static resolvePaymentMethod(data: any): PaymentMethod {
    const values = collectValues(data).filter(Boolean);
    const joined = values.join(" ");

    if (transferRegex.test(joined)) return "TRANSFER";
    if (posRegex.test(joined)) return "POS";
    if (cashRegex.test(joined)) return "CASH";
    return "CARD";
  }

  static async verifyWebhook(payload: any) {
    // Logic for verifying external payment provider webhooks
    return true;
  }
}

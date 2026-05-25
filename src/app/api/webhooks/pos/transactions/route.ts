import { NextResponse } from "next/server";
import { SyncPosTransactionsService } from "@/modules/pos/services/sync-pos-transactions.service";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isTransactionPayload = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.items) ||
    Boolean(
      value.order_number ||
      value.orderNumber ||
      value.transaction_id ||
      value.transactionId ||
      value.invoice_number ||
      value.invoiceNumber
    )
  );
};

const getWebhookSecret = (request: Request) => {
  const headerSecret = request.headers.get("x-pos-webhook-secret");
  const querySecret = new URL(request.url).searchParams.get("secret");
  return headerSecret ?? querySecret ?? undefined;
};

const verifyWebhookSecret = (request: Request) => {
  const secret = getWebhookSecret(request);
  const expectedSecret = process.env.POS_WEBHOOK_SECRET || "pos-webhook-secret-key";

  if (process.env.NODE_ENV === "production" && secret !== expectedSecret) {
    return false;
  }

  return true;
};

/**
 * POST /api/webhooks/pos/transactions
 * Secure receiver for PHP POS transaction webhooks only.
 */
export async function POST(request: Request) {
  try {
    if (!verifyWebhookSecret(request)) {
      console.warn("⚠️ Unauthorized POS transactions webhook access attempt detected.");
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const payload = await request.json();
    console.log("⚡ POS transaction webhook received:", JSON.stringify(payload).slice(0, 300) + "...");

    if (Array.isArray(payload) && payload.length > 0 && isTransactionPayload(payload[0])) {
      const results = await Promise.all(payload.map((item) => SyncPosTransactionsService.processTransaction(item)));
      return NextResponse.json({
        success: true,
        message: `Processed ${results.length} transaction webhook event(s) successfully.`,
        details: results,
      });
    }

    if (isTransactionPayload(payload)) {
      const result = await SyncPosTransactionsService.processTransaction(payload);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Transaction synchronized successfully.",
        action: result.action,
        orderNumber: result.orderNumber,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid transaction webhook payload." }, { status: 400 });
  } catch (error: any) {
    console.error("❌ POS transactions webhook failed:", error);
    return NextResponse.json({ success: false, error: error?.message ?? "Unknown error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { SyncPosTransactionsService } from "@/modules/pos/services/sync-pos-transactions.service";

const getWebhookAuth = (request: Request) => {
  const secret = request.headers.get("x-pos-webhook-secret");
  const expectedSecret = process.env.POS_WEBHOOK_SECRET || "pos-webhook-secret-key";
  return process.env.NODE_ENV !== "production" || secret === expectedSecret;
};

const unauthorizedResponse = () =>
  NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });

const normalizePayload = (payload: unknown) => {
  if (Array.isArray(payload)) return payload;
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.transactions)) return record.transactions;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.items)) return record.items;
  }
  return [payload];
};

export async function POST(request: Request) {
  if (!getWebhookAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const payload = await request.json();
    const transactions = normalizePayload(payload);
    const results = await Promise.all(
      transactions.map((transaction) => SyncPosTransactionsService.processTransaction(transaction))
    );

    const successful = results.filter((item) => item.success).length;
    const skipped = results.filter((item) => !item.success).length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful,
      skipped,
      details: results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown webhook processing error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

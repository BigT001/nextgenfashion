import { NextResponse } from "next/server";
import { SyncPosSingleProductService } from "@/modules/products/services/sync-pos-single-product.service";
import { SyncPosTransactionsService } from "@/modules/pos/services/sync-pos-transactions.service";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isTransactionPayload = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.items) ||
    Boolean(value.order_number || value.orderNumber || value.transaction_id || value.transactionId || value.invoice_number || value.invoiceNumber)
  );
};

/**
 * POST /api/webhooks/pos
 * Secure receiver for real-time Point of Sale product, stock, and transaction webhooks
 */
const getWebhookSecret = (request: Request) => {
  const headerSecret = request.headers.get("x-pos-webhook-secret");
  const querySecret = new URL(request.url).searchParams.get("secret");
  return headerSecret ?? querySecret ?? undefined;
};

export async function POST(request: Request) {
  try {
    const secret = getWebhookSecret(request);
    
    // Security check to verify authenticity of incoming webhook requests
    const expectedSecret = process.env.POS_WEBHOOK_SECRET || "pos-webhook-secret-key";
    
    if (process.env.NODE_ENV === "production" && secret !== expectedSecret) {
      console.warn("⚠️ Unauthorized POS webhook access attempt detected.");
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const payload = await request.json();
    console.log("⚡ Real-time POS Webhook trigger received:", JSON.stringify(payload).slice(0, 300) + "...");

    if (Array.isArray(payload) && payload.length > 0 && isTransactionPayload(payload[0])) {
      const results = await Promise.all(payload.map((item) => SyncPosTransactionsService.processTransaction(item)));
      return NextResponse.json({
        success: true,
        message: `Processed ${results.length} POS transaction webhook events successfully.`,
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
        message: `Transaction synchronized successfully in real-time.`,
        action: result.action,
        orderNumber: result.orderNumber,
      });
    }

    if (Array.isArray(payload)) {
      const results = [];
      for (const item of payload) {
        const res = await SyncPosSingleProductService.execute(item);
        results.push(res);
      }
      
      const successfulCount = results.filter(r => r.success).length;
      return NextResponse.json({
        success: true,
        message: `Processed bulk webhook event successfully.`,
        processed: payload.length,
        successful: successfulCount,
        details: results
      });
    }

    const result = await SyncPosSingleProductService.execute(payload);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Product synchronized successfully in real-time.`,
      action: result.action,
      productId: result.productId
    });
  } catch (err: any) {
    console.error("❌ POS Webhook parser crashed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

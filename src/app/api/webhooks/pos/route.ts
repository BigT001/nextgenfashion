import { NextResponse } from "next/server";
import { SyncPosSingleProductService } from "@/modules/products/services/sync-pos-single-product.service";

/**
 * POST /api/webhooks/pos
 * Secure receiver for real-time Point of Sale product and stock webhook triggers
 */
export async function POST(request: Request) {
  try {
    const headersList = request.headers;
    const secret = headersList.get("x-pos-webhook-secret");
    
    // Security check to verify authenticity of incoming webhook requests
    const expectedSecret = process.env.POS_WEBHOOK_SECRET || "pos-webhook-secret-key";
    
    if (process.env.NODE_ENV === "production" && secret !== expectedSecret) {
      console.warn("⚠️ Unauthorized POS webhook access attempt detected.");
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const payload = await request.json();
    console.log("⚡ Real-time POS Webhook trigger received:", JSON.stringify(payload).slice(0, 300) + "...");

    // Check if the webhook payload is an array of items or a single item
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
    } else {
      // Single product/stock change event
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
    }
  } catch (err: any) {
    console.error("❌ POS Webhook parser crashed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

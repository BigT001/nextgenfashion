import { NextRequest, NextResponse } from "next/server";
import { decryptPayload } from "@/lib/speedaf/crypto";
import { DeliveryQueries } from "@/modules/delivery/queries/delivery.queries";

/**
 * Speedaf Webhook Tracking Callback Router
 * Exposes POST /api/webhooks/speedaf
 */
export async function POST(req: NextRequest) {
  try {
    const settings = await DeliveryQueries.getSpeedafSettings();
    if (!settings.enabled) {
      return NextResponse.json(
        { success: false, error: "Speedaf integration disabled" },
        { status: 400 }
      );
    }

    const rawText = await req.text();
    const cleanText = rawText.trim();
    let parsedBody: any = null;

    // 1. Try to decrypt incoming payload (Speedaf uses DES-CBC encryption)
    try {
      const decrypted = decryptPayload(cleanText, settings.secretKey);
      if (decrypted) {
        parsedBody = JSON.parse(decrypted);
        console.log("[Speedaf Webhook] Decrypted payload success");
      }
    } catch (decryptErr: any) {
      // 2. Fallback: Parse as raw JSON if not encrypted
      try {
        parsedBody = JSON.parse(cleanText);
        console.log("[Speedaf Webhook] Parsing raw JSON success");
      } catch (jsonErr: any) {
        console.error(
          "[Speedaf Webhook] Failed to parse payload as encrypted or plain JSON:",
          cleanText.slice(0, 200)
        );
        return NextResponse.json(
          { success: false, error: "Invalid payload format" },
          { status: 400 }
        );
      }
    }

    // 3. Resolve inner data envelope if present
    let payload = parsedBody;
    if (parsedBody && typeof parsedBody === "object" && "data" in parsedBody) {
      const innerData = parsedBody.data;
      if (typeof innerData === "string") {
        try {
          payload = JSON.parse(innerData);
        } catch (e) {
          // Keep as string if it's not JSON
          payload = innerData;
        }
      } else {
        payload = innerData;
      }
    }

    console.log("[Speedaf Webhook] Received tracking payload:", JSON.stringify(payload));

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Empty tracking payload" },
        { status: 400 }
      );
    }

    // 4. Standardize format: handle single object or array
    const events = Array.isArray(payload) ? payload : [payload];

    // Process each trajectory scan event
    for (const event of events) {
      const waybillNumber = event.mailNo || event.waybillCode;
      const action = String(event.action || "");
      const actionName = event.actionName || event.msgEng || "In Transit";

      if (!waybillNumber) {
        console.warn("[Speedaf Webhook] Skipping event due to missing waybill/mailNo:", event);
        continue;
      }

      // Find if sale order exists with this waybill
      const sale = await DeliveryQueries.findSaleByWaybill(waybillNumber);
      if (!sale) {
        console.warn(`[Speedaf Webhook] Waybill ${waybillNumber} is not associated with any store order.`);
        continue;
      }

      // Update database status and trajectory log
      await DeliveryQueries.updateSaleDeliveryStatus(waybillNumber, action, event);
      console.log(`[Speedaf Webhook] Updated order ${sale.orderNumber} status to ${action} (${actionName})`);
    }

    // Return the response Speedaf expects
    return NextResponse.json({
      success: true,
      error: null,
      data: null,
    });
  } catch (error: any) {
    console.error("[Speedaf Webhook] Error processing callback:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

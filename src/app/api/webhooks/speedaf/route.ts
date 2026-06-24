import { NextRequest, NextResponse } from "next/server";
import { DeliveryQueries } from "@/modules/delivery/queries/delivery.queries";

/**
 * Speedaf Webhook Tracking Callback Router
 * Exposes POST /api/webhooks/speedaf
 *
 * Per official docs: Speedaf pushes plain application/json to this endpoint.
 * Encryption is only on our requests TO Speedaf, NOT on their push TO us.
 *
 * Push payload shape (per docs):
 * {
 *   mailNo: string,        // waybill number
 *   action: string,        // status code e.g. "1", "4", "5"
 *   actionName: string,    // e.g. "Picked", "In delivery", "Collected"
 *   msgEng: string,        // English trajectory description
 *   msgLoc: string,        // Local language description
 *   time: string,          // "2021-01-21 13:40:28"
 *   timezone: number,      // 8 = GMT+8
 *   country: string,
 *   countryCode: string,
 * }
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

    // Speedaf tracking push is plain application/json (NOT encrypted)
    try {
      parsedBody = JSON.parse(cleanText);
      console.log("[Speedaf Webhook] Parsed plain JSON payload successfully");
    } catch (jsonErr: any) {
      console.error(
        "[Speedaf Webhook] Failed to parse JSON payload:",
        cleanText.slice(0, 300)
      );
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    if (!parsedBody) {
      return NextResponse.json(
        { success: false, error: "Empty tracking payload" },
        { status: 400 }
      );
    }

    console.log("[Speedaf Webhook] Received payload:", JSON.stringify(parsedBody));

    // Handle both single event object and array of events
    const events = Array.isArray(parsedBody) ? parsedBody : [parsedBody];

    // Process each trajectory scan event
    for (const event of events) {
      const waybillNumber = event.mailNo || event.waybillCode;
      const action = String(event.action || "");
      const actionName = event.actionName || event.msgEng || "In Transit";

      if (!waybillNumber) {
        console.warn("[Speedaf Webhook] Skipping event — missing mailNo:", event);
        continue;
      }

      // Find sale order associated with this waybill
      const sale = await DeliveryQueries.findSaleByWaybill(waybillNumber);
      if (!sale) {
        console.warn(`[Speedaf Webhook] Waybill ${waybillNumber} not associated with any store order.`);
        continue;
      }

      // Update DB status and trajectory log
      await DeliveryQueries.updateSaleDeliveryStatus(waybillNumber, action, event);
      console.log(`[Speedaf Webhook] Updated order ${sale.orderNumber} → action=${action} (${actionName})`);
    }

    // Return exactly what Speedaf docs specify for acknowledgement
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


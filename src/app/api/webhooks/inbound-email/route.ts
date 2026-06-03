import { NextResponse } from "next/server";
import { EmailQueries } from "@/modules/email/queries/email.queries";
import { Webhook } from "svix";

export const dynamic = "force-dynamic";

/**
 * INBOUND EMAIL WEBHOOK
 * 
 * This endpoint receives POST requests from an email provider (like Resend)
 * whenever an email is sent to support@nextgenkiddies.com.
 */
export async function POST(request: Request) {
  try {
    const payloadString = await request.text();
    const headersList = request.headers;

    const svix_id = headersList.get("svix-id");
    const svix_timestamp = headersList.get("svix-timestamp");
    const svix_signature = headersList.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("Missing RESEND_WEBHOOK_SECRET in environment");
      return new Response("Server configuration error", { status: 500 });
    }

    const wh = new Webhook(webhookSecret);
    let payload;

    try {
      payload = wh.verify(payloadString, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as any;
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response("Invalid signature", { status: 401 });
    }

    // Log the full payload so we can see Resend's exact field structure
    console.log("[RESEND WEBHOOK] Event type:", payload.type);
    console.log("[RESEND WEBHOOK] Full payload:", JSON.stringify(payload, null, 2));

    // Resend wraps inbound emails — try all known event type names
    if (payload.type === "email.received" || payload.type === "email.inbound" || payload.type === "inbound.email") {
        const data = payload.data || payload;
        
        // Handle all known Resend field name variations
        const fromEmail = data.from || data.sender || data.fromEmail || "unknown@example.com";
        const toEmail = (Array.isArray(data.to) ? data.to[0] : data.to) || data.recipient || "support@nextgenkiddies.com";
        const subject = data.subject || "No Subject";
        
        // Try all known body field name variations from Resend
        const html = data.html || data.bodyHtml || data.htmlBody || data.body_html || "";
        const text = data.text || data.bodyText || data.textBody || data.body_text || data.plain || data.body || "";
        
        console.log("[RESEND WEBHOOK] Parsed - from:", fromEmail, "subject:", subject, "html length:", html.length, "text length:", text.length);
        
        await EmailQueries.saveInboundMessage({
            fromEmail,
            toEmail,
            subject,
            bodyHtml: html,
            bodyText: text,
            status: "DELIVERED",
        });
    } else {
        // Log unhandled types so we learn the correct event name
        console.log("[RESEND WEBHOOK] Unhandled event type:", payload.type);
    }

    return NextResponse.json({ success: true, message: "Webhook processed securely" });
  } catch (error: any) {
    console.error("Inbound Webhook Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process inbound email" },
      { status: 500 }
    );
  }
}


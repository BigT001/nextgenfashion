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

    // Now we know the payload is 100% authentically from Resend
    
    // Resend wraps inbound emails in a specific JSON structure.
    // Example: payload.type === "email.received"
    if (payload.type === "email.received" || payload.type === "email.inbound") {
        const data = payload.data;
        const fromEmail = data.from || "unknown@example.com";
        const toEmail = data.to?.[0] || "support@nextgenkiddies.com";
        const subject = data.subject || "No Subject";
        const html = data.html || data.text || "";
        const text = data.text || "";
        
        await EmailQueries.saveInboundMessage({
            fromEmail,
            toEmail,
            subject,
            bodyHtml: html,
            bodyText: text,
            status: "DELIVERED",
        });
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


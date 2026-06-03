import { NextResponse } from "next/server";
import { EmailQueries } from "@/modules/email/queries/email.queries";
import { Webhook } from "svix";

export const dynamic = "force-dynamic";

/**
 * INBOUND EMAIL WEBHOOK
 *
 * Handles two webhook types from Resend:
 * 1. Outbound tracking events (email.sent, email.delivered, email.received)
 *    → These are delivery confirmations for emails YOU sent, NOT customer emails.
 *    → We skip these for the inbox.
 * 2. Raw inbound email routing (no Svix headers)
 *    → Real emails sent TO support@nextgenkiddies.com by customers.
 *    → Saved to inbox.
 */
export async function POST(request: Request) {
  try {
    const payloadString = await request.text();
    const headersList = request.headers;

    const svix_id = headersList.get("svix-id");
    const svix_timestamp = headersList.get("svix-timestamp");
    const svix_signature = headersList.get("svix-signature");

    // ─── CASE 1: No Svix headers → raw inbound email from Resend domain routing ───
    // This fires when a customer actually emails support@nextgenkiddies.com
    if (!svix_id || !svix_timestamp || !svix_signature) {
      let raw: any = {};
      try {
        raw = JSON.parse(payloadString);
      } catch (_) {
        raw = {};
      }

      const fromEmail = raw.from || "unknown@example.com";
      const toEmail = Array.isArray(raw.to)
        ? raw.to[0]
        : raw.to || "support@nextgenkiddies.com";
      const subject = raw.subject || "No Subject";
      const html = raw.html || "";
      const text = raw.text || "";

      await EmailQueries.saveInboundMessage({
        fromEmail,
        toEmail,
        subject,
        bodyHtml: html,
        bodyText: text,
        status: "DELIVERED",
      });

      return NextResponse.json({ success: true });
    }

    // ─── CASE 2: Svix-signed outbound event from Resend ───
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response("Server configuration error", { status: 500 });
    }

    const wh = new Webhook(webhookSecret);
    let payload: any;

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

    const eventType = payload.type as string;

    // These are outbound delivery tracking events — NOT customer emails.
    // They confirm that emails YOU sent were delivered. Skip them for the inbox.
    const OUTBOUND_TRACKING_EVENTS = [
      "email.sent",
      "email.delivered",
      "email.received",   // = "recipient's mail server confirmed receipt of YOUR sent email"
      "email.opened",
      "email.clicked",
      "email.bounced",
      "email.complained",
      "email.scheduled",
      "email.canceled",
    ];

    if (OUTBOUND_TRACKING_EVENTS.includes(eventType)) {
      // In the future, we could update the status of the outbound email in the Sent tab here.
      console.log(`[RESEND] Outbound tracking event: ${eventType} — skipping inbox save.`);
      return NextResponse.json({ success: true, note: `Outbound event ${eventType} acknowledged` });
    }

    // For any other event type we don't recognise, log and skip
    console.log(`[RESEND] Unhandled event type: ${eventType}`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Inbound Webhook Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process inbound email" },
      { status: 500 }
    );
  }
}

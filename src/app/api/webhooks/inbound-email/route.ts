import { NextResponse } from "next/server";
import { EmailQueries } from "@/modules/email/queries/email.queries";
import { Webhook } from "svix";
import { Resend } from "resend";
import fs from 'fs';

export const dynamic = "force-dynamic";

/**
 * INBOUND EMAIL WEBHOOK
 *
 * Handles two webhook paths from Resend:
 * 1. Svix-signed inbound email event (email.received)
 *    → Retrieves the full email content (HTML/text) using Resend API and saves to inbox.
 * 2. Raw inbound email routing (no Svix headers)
 *    → Fallback for local testing or custom routing.
 * 3. Outbound tracking events (email.sent, email.delivered, etc.)
 *    → Skipped or logged.
 */
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const payloadString = await request.text();
    const headersList = request.headers;

    const svix_id = headersList.get("svix-id");
    const svix_timestamp = headersList.get("svix-timestamp");
    const svix_signature = headersList.get("svix-signature");

    try {
      fs.appendFileSync('scratch/webhook.log', `\\n\\n--- NEW WEBHOOK at ${new Date().toISOString()} ---\\nHeaders: ${JSON.stringify(Object.fromEntries(headersList))}\\nBody: ${payloadString}\\n`);
    } catch (e) {}

    // ─── CASE 1: No Svix headers → raw inbound email from Resend domain routing ───
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

    // ─── CASE 2: Svix-signed outbound event or inbound notification from Resend ───
    let payload: any;

    if (process.env.NODE_ENV !== "production" && svix_signature === "bypass-dev") {
      try {
        payload = JSON.parse(payloadString);
      } catch (_) {
        return new Response("Invalid JSON payload for bypass-dev", { status: 400 });
      }
    } else {
      const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
      if (!webhookSecret) {
        return new Response("Server configuration error", { status: 500 });
      }

      const wh = new Webhook(webhookSecret);
      try {
        payload = wh.verify(payloadString, {
          "svix-id": svix_id,
          "svix-timestamp": svix_timestamp,
          "svix-signature": svix_signature,
        }) as any;
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        try { fs.appendFileSync('scratch/webhook.log', `\\nERROR svix verification: ${err.message}\\n`); } catch(e){}
        return new Response("Invalid signature", { status: 401 });
      }
    }

    const eventType = payload.type as string;

    // Handle inbound email received event (retrieves full email contents)
    if (eventType === "email.received") {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.error("Resend API key missing. Cannot fetch email content.");
        return new Response("Configuration error", { status: 500 });
      }

      const resendClient = new Resend(apiKey);
      const emailId = payload.data.email_id;
      try {
        const { data: email, error } = await resendClient.emails.receiving.get(emailId);
        
        if (error || !email) {
          console.error("Failed to fetch inbound email content from Resend:", error);
          try { fs.appendFileSync('scratch/webhook.log', `\\nERROR fetching email: ${JSON.stringify(error)}\\n`); } catch(e){}
          return new Response("Failed to fetch email content", { status: 500 });
        }

        const fromEmail = email.from || payload.data.from || "unknown@example.com";
        const toEmail = Array.isArray(email.to)
          ? email.to[0]
          : email.to || (payload.data.to ? payload.data.to[0] : "support@nextgenkiddies.com");
        const subject = email.subject || payload.data.subject || "No Subject";
        const html = email.html || "";
        const text = email.text || "";

        await EmailQueries.saveInboundMessage({
          fromEmail,
          toEmail,
          subject,
          bodyHtml: html,
          bodyText: text,
          status: "DELIVERED",
        });
        
        try { fs.appendFileSync('scratch/webhook.log', `\\nSUCCESS saving email ${emailId}\\n`); } catch(e){}

        return NextResponse.json({ success: true, note: "Inbound email processed and saved" });
      } catch (err: any) {
        console.error("Error retrieving inbound email content:", err);
        try { fs.appendFileSync('scratch/webhook.log', `\\nEXCEPTION fetching email: ${err.message}\\n`); } catch(e){}
        return new Response("Error retrieving email content", { status: 500 });
      }
    }

    // These are outbound delivery tracking events — NOT customer emails.
    const OUTBOUND_TRACKING_EVENTS = [
      "email.sent",
      "email.delivered",
      "email.opened",
      "email.clicked",
      "email.bounced",
      "email.complained",
      "email.scheduled",
      "email.canceled",
    ];

    if (OUTBOUND_TRACKING_EVENTS.includes(eventType)) {
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

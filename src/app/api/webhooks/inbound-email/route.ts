import { NextResponse } from "next/server";
import { EmailQueries } from "@/modules/email/queries/email.queries";
import { Webhook } from "svix";

export const dynamic = "force-dynamic";

/**
 * INBOUND EMAIL WEBHOOK
 *
 * Handles two cases:
 * 1. Resend outbound event webhooks (signed with Svix headers)
 * 2. Resend inbound email routing (raw POST without Svix headers)
 */
export async function POST(request: Request) {
  try {
    const payloadString = await request.text();
    const headersList = request.headers;

    const svix_id = headersList.get("svix-id");
    const svix_timestamp = headersList.get("svix-timestamp");
    const svix_signature = headersList.get("svix-signature");

    // ─── CASE 1: No Svix headers → raw inbound email from Resend routing ───
    if (!svix_id || !svix_timestamp || !svix_signature) {
      let raw: any = {};
      try {
        raw = JSON.parse(payloadString);
      } catch (_) {
        raw = { raw: payloadString };
      }

      const fromEmail = raw.from || "unknown@example.com";
      const toEmail = Array.isArray(raw.to)
        ? raw.to[0]
        : raw.to || "support@nextgenkiddies.com";
      const subject = raw.subject || "No Subject";
      const html = raw.html || "";
      const text = raw.text || "";

      // Always include raw payload in body so we can see the full structure
      const debugDump = JSON.stringify(raw, null, 2);

      await EmailQueries.saveInboundMessage({
        fromEmail,
        toEmail,
        subject,
        bodyHtml: html || `<pre style="font-size:12px">${debugDump}</pre>`,
        bodyText: text || debugDump,
        status: "DELIVERED",
      });

      return NextResponse.json({ success: true });
    }

    // ─── CASE 2: Svix-signed webhook event from Resend ───
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

    // Extract data — always fall back to full payload if no .data wrapper
    const data = payload.data || payload;
    const fromEmail =
      data.from || data.sender || data.fromEmail || "webhook@resend.com";
    const toEmail =
      (Array.isArray(data.to) ? data.to[0] : data.to) ||
      "support@nextgenkiddies.com";
    const subject =
      data.subject || `[Resend Event: ${payload.type || "unknown"}]`;
    const html = data.html || data.bodyHtml || "";
    const text = data.text || data.bodyText || "";

    // Save with full debug dump in body so we can see what Resend sends
    const debugBody =
      `EVENT TYPE: ${payload.type}\n\n` +
      `DATA:\n${JSON.stringify(data, null, 2)}\n\n` +
      `FULL PAYLOAD:\n${JSON.stringify(payload, null, 2)}`;

    await EmailQueries.saveInboundMessage({
      fromEmail,
      toEmail,
      subject,
      bodyHtml:
        html ||
        `<pre style="font-size:12px;line-height:1.5;white-space:pre-wrap">${debugBody}</pre>`,
      bodyText: text || debugBody,
      status: "DELIVERED",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Inbound Webhook Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process inbound email" },
      { status: 500 }
    );
  }
}

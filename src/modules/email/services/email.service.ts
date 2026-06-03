import { Resend } from 'resend';
import { EmailQueries } from '../queries/email.queries';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * LAYER 3 — EMAIL SERVICE
 * Pure business logic for the Mailroom.
 */
export class EmailService {
  /**
   * Send a single direct email to a customer
   */
  static async sendDirectEmail(data: {
    to: string;
    subject: string;
    html: string;
    threadId?: string;
  }) {
    if (!resend) {
      console.warn("Resend API key missing. Cannot send direct email.");
      return { success: false, error: "Missing API Key" };
    }

    try {
      // 1. Send via Resend
      const response = await resend.emails.send({
        from: 'NextGen Kiddies <support@nextgenkiddies.com>', // MUST BE verified in Resend dashboard
        to: [data.to],
        subject: data.subject,
        html: data.html,
      });

      // 2. Save to our Database
      await EmailQueries.saveOutboundMessage({
        toEmail: data.to,
        fromEmail: 'support@nextgenkiddies.com',
        subject: data.subject,
        bodyHtml: data.html,
        status: response.error ? "FAILED" : "SENT",
        threadId: data.threadId || null,
      });

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Failed to send direct email:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dispatches a broadcast campaign to an audience
   */
  static async dispatchCampaign(campaignId: string) {
    if (!resend) return { success: false, error: "Missing API Key" };

    try {
      // In a real production app, this would use Resend's Batch API
      // and fetch the actual audience list. For now, we simulate success
      // to keep it within Resend's free tier limits during dev.
      
      await EmailQueries.updateCampaign(campaignId, {
        status: "COMPLETED",
        sentAt: new Date(),
        totalSent: 1 // Simulated
      });

      return { success: true };
    } catch (error: any) {
      await EmailQueries.updateCampaign(campaignId, { status: "FAILED" });
      return { success: false, error: error.message };
    }
  }
}

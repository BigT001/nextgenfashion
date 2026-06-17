"use server";

import { EmailQueries } from "../queries/email.queries";
import { EmailService } from "../services/email.service";

/**
 * LAYER 2 — EMAIL ACTIONS
 * Server actions to connect the Mailroom UI to Services and Queries.
 */

export async function getInboxMessagesAction() {
  try {
    const messages = await EmailQueries.getInboxMessages();
    return { success: true, data: JSON.parse(JSON.stringify(messages)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSentMessagesAction() {
  try {
    const messages = await EmailQueries.getSentMessages();
    return { success: true, data: JSON.parse(JSON.stringify(messages)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMessageAction(id: string) {
  try {
    const deleted = await EmailQueries.deleteMessage(id);
    return { success: true, data: JSON.parse(JSON.stringify(deleted)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendDirectEmailAction(data: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const result = await EmailService.sendDirectEmail(data);
    if (!result.success) throw new Error(result.error as string);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// CAMPAIGNS

export async function getCampaignsAction() {
  try {
    const campaigns = await EmailQueries.getCampaigns();
    return { success: true, data: JSON.parse(JSON.stringify(campaigns)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createAndDispatchCampaignAction(data: {
  name: string;
  subject: string;
  bodyHtml: string;
  audience: string;
}) {
  try {
    // 1. Create campaign in DB
    const campaign = await EmailQueries.createCampaign({
      name: data.name,
      subject: data.subject,
      bodyHtml: data.bodyHtml,
      audience: data.audience,
      status: "PROCESSING"
    });

    // 2. Dispatch
    const dispatchResult = await EmailService.dispatchCampaign(campaign.id);
    if (!dispatchResult.success) {
      return { success: false, error: dispatchResult.error };
    }

    return { success: true, data: JSON.parse(JSON.stringify(campaign)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function subscribeNewsletterAction(email: string) {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }
  try {
    // 1. Add subscriber to database
    await EmailQueries.addSubscriber(email);

    // 2. Save an inbound message representing this subscription so it shows in the Mailroom Inbox
    await EmailQueries.saveInboundMessage({
      fromEmail: email,
      toEmail: "newsletter@nextgenkiddies.com",
      subject: "New Newsletter Subscription",
      bodyText: `A new user signed up for the newsletter.\n\nEmail: ${email}\nDate: ${new Date().toLocaleString()}`,
      bodyHtml: `<p>A new user signed up for the newsletter.</p><p><strong>Email:</strong> ${email}</p><p><strong>Date:</strong> ${new Date().toLocaleString()}</p>`,
      status: "DELIVERED",
    });

    return { success: true };
  } catch (error: any) {
    console.error("Newsletter subscription action failed:", error);
    return { success: false, error: error.message || "Failed to subscribe." };
  }
}

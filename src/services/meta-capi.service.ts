import { prisma } from "@/services/prisma.service";
import crypto from "crypto";

export interface MetaPurchaseData {
  orderId: string;
  amount: number;
  currency: string;
  email: string;
  phone?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * META CONVERSIONS API SERVICE
 * Layer 3: Service Layer for Meta Event Tracking
 */
export class MetaCapiService {
  /**
   * Helper to hash sensitive customer data using SHA-256 as required by Meta.
   */
  private static hashData(val: string): string {
    const cleaned = val.trim().toLowerCase();
    return crypto.createHash("sha256").update(cleaned).digest("hex");
  }

  /**
   * Track a completed Purchase event server-side via the Conversions API.
   */
  static async trackPurchase(data: MetaPurchaseData): Promise<boolean> {
    try {
      // 0. Ensure server-side event runs ONLY in production
      if (process.env.NODE_ENV !== "production") {
        console.log(`[MetaCapiService] Skipping CAPI event for order ${data.orderId} (non-production environment).`);
        return false;
      }

      // 1. Check if Meta tracking is enabled
      const enabledSetting = await prisma.settings.findUnique({
        where: { key: "metaTrackingEnabled" },
      });
      const isEnabled = enabledSetting?.value === "true";
      if (!isEnabled) {
        return false;
      }

      // 2. Fetch credentials from the database
      const [pixelIdSetting, tokenSetting] = await Promise.all([
        prisma.settings.findUnique({ where: { key: "metaPixelId" } }),
        prisma.settings.findUnique({ where: { key: "metaConversionsApiToken" } }),
      ]);

      const pixelId = pixelIdSetting?.value?.trim();
      const accessToken = tokenSetting?.value?.trim();

      if (!pixelId || !accessToken) {
        console.warn("[MetaCapiService] Missing Meta Pixel ID or Access Token in settings. Skipping CAPI event.");
        return false;
      }

      // 3. Prepare hashed customer identity parameters
      const emailHash = data.email ? this.hashData(data.email) : null;
      const phoneHash = data.phone ? this.hashData(data.phone) : null;

      if (!emailHash && !phoneHash) {
        console.warn("[MetaCapiService] No customer identifier (email/phone) provided. Skipping CAPI event to protect quality score.");
        return false;
      }

      const userData: Record<string, any> = {};
      if (emailHash) userData.em = [emailHash];
      if (phoneHash) userData.ph = [phoneHash];
      if (data.ipAddress) userData.client_ip_address = data.ipAddress;
      if (data.userAgent) userData.client_user_agent = data.userAgent;

      // 4. Construct CAPI payload
      const payload = {
        data: [
          {
            event_name: "Purchase",
            event_time: Math.floor(Date.now() / 1000),
            event_id: data.orderId, // Matches client-side event ID for deduplication
            event_source_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://nextgenkiddies.com"}/checkout/success`,
            action_source: "website",
            user_data: userData,
            custom_data: {
              value: Number(data.amount),
              currency: data.currency.toUpperCase(),
            },
          },
        ],
      };

      console.log(`[MetaCapiService] Sending Purchase event for order ${data.orderId} (Value: ${data.amount} ${data.currency})`);

      // 5. Send POST request to Meta Graph API
      const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[MetaCapiService] Meta API responded with status ${response.status}: ${errorText}`);
        return false;
      }

      const result = await response.json();
      console.log("[MetaCapiService] Event successfully accepted by Meta:", result);
      return true;
    } catch (error) {
      console.error("[MetaCapiService] Failed to dispatch CAPI event:", error);
      return false;
    }
  }
}

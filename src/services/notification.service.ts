import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
/**
 * NOTIFICATION SERVICE
 * Layer 3: Business Logic & External Integrations
 */
export class NotificationService {
  /**
   * EMAIL: New Staff Member Invitation
   */
  static async sendStaffInviteEmail(data: {
    email: string;
    name: string;
    role: string;
  }) {
    try {
      if (!resend) return { success: false, error: "Missing API Key" };
      await resend.emails.send({
        from: 'NextGen Kiddies <notifications@nextgenkiddies.com>',
        to: [data.email],
        subject: 'Welcome to the NextGen Elite Network',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #0B1E3F;">Access Granted</h1>
            <p>Hello <strong>${data.name}</strong>,</p>
            <p>You have been officially registered as a <strong>${data.role}</strong> on the NextGen Kiddies platform.</p>
            <p>You can now log in to the dashboard using your credentials.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              &copy; ${new Date().getFullYear()} NextGen Kiddies. Operational Protocol Management.
            </div>
          </div>
        `
      });
      return { success: true };
    } catch (error) {
      console.error("Resend Error:", error);
      return { success: false, error };
    }
  }

  /**
   * EMAIL: POS Customer Onboarding
   */
  static async sendCustomerWelcomeEmail(data: {
    email: string;
    name: string;
  }) {
    try {
      console.log(`Resend welcome email attempt for ${data.email}`);
      if (!resend) {
        console.warn("Resend API key missing. Welcome email not sent.");
        return { success: false, error: "Missing API Key" };
      }
      await resend.emails.send({
        from: 'NextGen Kiddies <concierge@nextgenkiddies.com>',
        to: [data.email],
        subject: 'Welcome to NextGen Kiddies',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #0B1E3F;">Welcome to the NextGen Community</h1>
            <p>Dear <strong>${data.name}</strong>,</p>
            <p>Your account has been successfully created and you can now shop with NextGen Kiddies.</p>
            <p>Use this email to sign in and manage your orders, addresses, and preferences.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 20px; border-top: 20px; font-size: 12px; color: #666;">
              &copy; ${new Date().getFullYear()} NextGen Kiddies. Elevating the next generation of style.
            </div>
          </div>
        `
      });
      return { success: true };
    } catch (error) {
      console.error("Resend Error:", error);
      return { success: false, error };
    }
  }

  static async sendPosCustomerWelcomeEmail(data: {
    email: string;
    name: string;
    orderNumber?: string;
    totalAmount?: number;
  }) {
    return this.sendCustomerWelcomeEmail({
      email: data.email,
      name: data.name,
    });
  }

  /**
   * SMS: Welcome message for new signups
   */
  static async sendWelcomeSms(data: {
    phone: string;
    name: string;
  }) {
    // Placeholder for SMS integration (e.g., Twilio/Termii)
    console.log(`[SMS OUTBOUND] To: ${data.phone} | Content: Welcome ${data.name} to NextGen Kiddies! Your account is active.`);
    
    // In a real scenario, you would call an SMS API here
    return { success: true, providerId: 'SMS_LOGGED' };
  }

  static async sendOrderConfirmation(data: {
    customerEmail: string;
    orderNumber: string;
    totalAmount: number;
    items?: Array<{
      productName?: string;
      sku?: string;
      size?: string | null;
      color?: string | null;
      quantity: number;
      price: number;
    }>;
  }) {
    console.log(`Sending order confirmation to ${data.customerEmail} for order ${data.orderNumber}`);
    
    try {
        if (!resend) {
          console.warn("Resend API key missing. Order confirmation not sent.");
          return { success: false, error: "Missing API Key" };
        }

        const itemsHtml = (data.items || [])
          .map((item) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #eee;">${item.productName || item.sku || "Item"}</td>
              <td style="padding: 8px; border: 1px solid #eee;">${item.quantity}</td>
              <td style="padding: 8px; border: 1px solid #eee;">₦${Number(item.price).toLocaleString()}</td>
              <td style="padding: 8px; border: 1px solid #eee;">₦${(Number(item.price) * item.quantity).toLocaleString()}</td>
            </tr>
          `)
          .join("");

        await resend.emails.send({
          from: 'NextGen Kiddies <orders@nextgenkiddies.com>',
          to: [data.customerEmail],
          subject: `Order Confirmed: ${data.orderNumber}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #ffffff;">
              <h1 style="color: #0B1E3F;">Thank You for Your Purchase!</h1>
              <p>Dear customer,</p>
              <p>Your order <strong>${data.orderNumber}</strong> has been confirmed successfully.</p>
              <p><strong>Total Paid:</strong> ₦${data.totalAmount.toLocaleString()}</p>
              ${itemsHtml ? `
                <h2 style="margin-top: 20px;">Purchase Details</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
                  <thead>
                    <tr>
                      <th style="text-align: left; padding: 8px; border: 1px solid #eee;">Item</th>
                      <th style="text-align: left; padding: 8px; border: 1px solid #eee;">Qty</th>
                      <th style="text-align: left; padding: 8px; border: 1px solid #eee;">Unit Price</th>
                      <th style="text-align: left; padding: 8px; border: 1px solid #eee;">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              ` : ""}
              <p style="margin-top: 24px;">We appreciate you choosing NextGen Kiddies. You can check your order status in the dashboard or continue shopping with us.</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                &copy; ${new Date().getFullYear()} NextGen Kiddies.
              </div>
            </div>
          `,
        });
    } catch (e) {
      console.error("Resend Error:", e);
      return { success: false, error: e };
    }

    return {
      success: true,
      providerId: `MSG-${Date.now()}`,
    };
  }

  static async sendLowStockAlert(data: {
    variantId: string;
    currentStock: number;
  }) {
    console.log(`Low stock alert for ${data.variantId}: ${data.currentStock} remaining`);
  }

  /**
   * EMAIL: Password Reset OTP (User self-service)
   */
  static async sendPasswordResetOtpEmail(data: {
    email: string;
    name: string;
    otp: string;
  }) {
    try {
      if (!resend) return { success: false, error: "Missing API Key" };
      await resend.emails.send({
        from: 'NextGen Kiddies <security@nextgenkiddies.com>',
        to: [data.email],
        subject: 'Your Password Reset Code',
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #0B1E3F 0%, #1a3a8a 100%); padding: 40px 40px 32px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.12); border-radius: 12px; padding: 10px 16px; margin-bottom: 16px;">
                <span style="color: #ffffff; font-size: 12px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase;">Security Alert</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Password Reset</h1>
              <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 13px; font-weight: 500;">NextGen Kiddies Operating System</p>
            </div>

            <div style="padding: 40px;">
              <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Hello <strong>${data.name}</strong>,</p>
              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0 0 32px;">We received a request to reset your password. Use the verification code below to proceed. This code expires in <strong>15 minutes</strong>.</p>

              <div style="background: #F8FAFC; border: 2px dashed #E2E8F0; border-radius: 16px; padding: 32px; text-align: center; margin: 0 0 32px;">
                <p style="color: #9CA3AF; font-size: 11px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase; margin: 0 0 16px;">Verification Code</p>
                <div style="display: inline-block; background: #0B1E3F; border-radius: 12px; padding: 16px 32px;">
                  <span style="color: #ffffff; font-size: 36px; font-weight: 900; letter-spacing: 0.25em; font-family: 'Courier New', monospace;">${data.otp}</span>
                </div>
                <p style="color: #9CA3AF; font-size: 12px; margin: 16px 0 0;">Do not share this code with anyone.</p>
              </div>

              <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 16px 20px;">
                <p style="color: #92400E; font-size: 13px; font-weight: 700; margin: 0 0 4px;">⚠ Didn&apos;t request this?</p>
                <p style="color: #B45309; font-size: 12px; margin: 0;">If you didn&apos;t request a password reset, please ignore this email. Your account remains secure.</p>
              </div>
            </div>

            <div style="background: #F9FAFB; border-top: 1px solid #F3F4F6; padding: 20px 40px; text-align: center;">
              <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; margin: 0; letter-spacing: 0.05em;">&copy; ${new Date().getFullYear()} NextGen Kiddies. All rights reserved.</p>
            </div>
          </div>
        `
      });
      return { success: true };
    } catch (error) {
      console.error("Resend Error [Password Reset OTP]:", error);
      return { success: false, error };
    }
  }

  /**
   * EMAIL: Admin-initiated password reset notification
   */
  static async sendAdminPasswordResetEmail(data: {
    email: string;
    name: string;
    resetByAdmin: string;
  }) {
    try {
      if (!resend) return { success: false, error: "Missing API Key" };
      await resend.emails.send({
        from: 'NextGen Kiddies <security@nextgenkiddies.com>',
        to: [data.email],
        subject: 'Your Password Has Been Reset by an Administrator',
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 40px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Password Reset</h1>
              <p style="color: rgba(255,255,255,0.55); margin: 8px 0 0; font-size: 13px; font-weight: 500;">Administrative Action — NextGen Kiddies OS</p>
            </div>

            <div style="padding: 40px;">
              <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">Hello <strong>${data.name}</strong>,</p>
              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">An administrator (<strong>${data.resetByAdmin}</strong>) has reset your account password. You can now log in to the dashboard using your new credentials.</p>

              <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 12px; padding: 16px 20px; margin: 0 0 24px;">
                <p style="color: #0369A1; font-size: 13px; font-weight: 700; margin: 0 0 4px;">🔒 What to do next</p>
                <p style="color: #0284C7; font-size: 12px; margin: 0;">Log in with your new password, then change it immediately from your profile settings for security.</p>
              </div>

              <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 16px 20px;">
                <p style="color: #92400E; font-size: 13px; font-weight: 700; margin: 0 0 4px;">⚠ Not expecting this?</p>
                <p style="color: #B45309; font-size: 12px; margin: 0;">Contact your system administrator immediately if you did not request or expect a password reset.</p>
              </div>
            </div>

            <div style="background: #F9FAFB; border-top: 1px solid #F3F4F6; padding: 20px 40px; text-align: center;">
              <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; margin: 0;">&copy; ${new Date().getFullYear()} NextGen Kiddies. Operational Security.</p>
            </div>
          </div>
        `
      });
      return { success: true };
    } catch (error) {
      console.error("Resend Error [Admin Password Reset]:", error);
      return { success: false, error };
    }
  }
}

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
  }) {
    console.log(`Sending order confirmation to ${data.customerEmail} for order ${data.orderNumber}`);
    
    try {
        if (!resend) {
          console.warn("Resend API key missing. Order confirmation not sent.");
          return { success: false, error: "Missing API Key" };
        }
        await resend.emails.send({
          from: 'NextGen Kiddies <orders@nextgenkiddies.com>',
          to: [data.customerEmail],
          subject: `Order Confirmed: ${data.orderNumber}`,
          html: `<p>Your order for NGN ${data.totalAmount} has been received.</p>`
        });
    } catch (e) {}

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
}

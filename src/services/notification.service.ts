/**
 * NOTIFICATION SERVICE
 * Layer 3: Business Logic
 */
export class NotificationService {
  static async sendOrderConfirmation(data: {
    customerEmail: string;
    orderNumber: string;
    totalAmount: number;
  }) {
    // Logic for sending Email via Resend/SendGrid or WhatsApp
    console.log(`Sending order confirmation to ${data.customerEmail} for order ${data.orderNumber}`);
    
    // This is often an async operation that doesn't need to block the main transaction
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

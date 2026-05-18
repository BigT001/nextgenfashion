"use server";

import { ProcessPOSSaleService } from "@/modules/orders/services/process-pos-sale.service";
import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@prisma/client";
import { auth } from "@/services/auth.service";

/**
 * POS SALE ACTIONS
 * Layer 2: Actions/API Layer
 */
export async function createSaleAction(data: {
  items: { variantId: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
}) {
  try {
    // 1. IDENTITY: Retrieve authenticated staff member from session
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized: Professional authentication required for POS transactions.");
    }

    const userId = session.user.id;

    // 2. ORCHESTRATION: Delegate to the specific granular service
    const result = await ProcessPOSSaleService.execute({
      ...data,
      userId,
    });

    // 3. CACHE: Revalidate critical views for real-time consistency
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/pos");
    revalidatePath("/dashboard/orders");
    
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    console.error("POS Sale Action Error:", error);
    return { success: false, error: error.message };
  }
}

export async function dispatchReceiptEmailAction(data: {
  email: string;
  orderNumber: string;
  totalAmount: number;
}) {
  try {
    const { NotificationService } = await import("@/services/notification.service");
    const result = await NotificationService.sendOrderConfirmation({
      customerEmail: data.email,
      orderNumber: data.orderNumber,
      totalAmount: data.totalAmount,
    });
    return { success: true, isMock: result.error === "Missing API Key", message: "Receipt email dispatched successfully" };
  } catch (error: any) {
    console.error("Dispatch Receipt Email Action Error:", error);
    return { success: false, error: error.message };
  }
}

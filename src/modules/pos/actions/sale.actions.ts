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
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error("POS Sale Action Error:", error);
    return { success: false, error: error.message };
  }
}

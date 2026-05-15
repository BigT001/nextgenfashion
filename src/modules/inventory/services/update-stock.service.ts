import { InventoryQueries } from "../queries/inventory.queries";
import { prisma } from "@/services/prisma.service";

/**
 * UPDATE STOCK SERVICE
 * Layer 3: Business Logic
 */
export class UpdateStockService {
  static async execute(
    variantId: string, 
    quantityChange: number, 
    reason: string, 
    userId: string = "system"
  ) {
    // Business Logic: Use a transaction for atomicity
    return await prisma.$transaction(async (tx) => {
      const updatedInventory = await InventoryQueries.updateQuantity(variantId, quantityChange, tx);

      await InventoryQueries.createAuditLog({
        userId,
        action: quantityChange < 0 ? "STOCK_DECREMENT" : "STOCK_INCREMENT",
        entity: "ProductVariant",
        entityId: variantId,
        details: {
          change: quantityChange,
          reason,
          newQuantity: updatedInventory.quantity,
        },
      }, tx);

      return updatedInventory;
    });
  }
}

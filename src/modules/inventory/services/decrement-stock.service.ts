import { InventoryQueries } from "../queries/inventory.queries";

/**
 * DECREMENT STOCK SERVICE
 * Layer 3: Business Logic (Inter-Service)
 */
export class DecrementStockService {
  static async forSale(
    variantId: string, 
    quantity: number, 
    tx: any, 
    userId: string = "system"
  ) {
    // 1. Business Rule: Check availability first
    const inventory = await InventoryQueries.findByVariantId(variantId);
    if (!inventory || inventory.quantity < quantity) {
      throw new Error(`Insufficient stock for item: ${variantId}`);
    }

    // 2. Execute adjustment using the shared transaction client
    const updatedInventory = await InventoryQueries.updateQuantity(variantId, -quantity, tx);

    // 3. Log the audit record
    await InventoryQueries.createAuditLog({
      userId,
      action: "STOCK_DECREMENT",
      entity: "ProductVariant",
      entityId: variantId,
      details: {
        change: -quantity,
        reason: "Customer Purchase",
        newQuantity: updatedInventory.quantity,
      },
    }, tx);

    return updatedInventory;
  }
}

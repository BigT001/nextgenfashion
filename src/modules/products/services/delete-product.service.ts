import { ProductQueries } from "../queries/product.queries";

/**
 * DELETE PRODUCT SERVICE
 * Layer 3: Business Logic
 */
export class DeleteProductService {
  static async execute(id: string) {
    // Business Logic: Perform pre-deletion audits or checks
    // E.g., check if there are pending sales associated with this product
    
    return await ProductQueries.delete(id);
  }
}

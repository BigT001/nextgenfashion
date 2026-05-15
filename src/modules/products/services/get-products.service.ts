import { ProductQueries } from "../queries/product.queries";
import { serialize } from "@/lib/utils";

/**
 * GET PRODUCTS SERVICE
 * Layer 3: Business Logic
 * Single Responsibility: Fetching and filtering products.
 * NOTE: All methods apply serialize() to convert Prisma Decimal/Date
 * objects into plain JS values safe for the Server→Client boundary.
 */
export class GetProductsService {
  static async execute(params?: {
    categoryId?: string;
    search?: string;
    includeVariants?: boolean;
  }) {
    const searchParams = {
      categoryId: params?.categoryId,
      search: params?.search,
      includeVariants: params?.includeVariants,
    };
    const result = await ProductQueries.findAll(searchParams);
    return serialize(result);
  }

  static async byId(id: string) {
    if (!id) throw new Error("Product ID is required");
    const result = await ProductQueries.findById(id);
    return serialize(result);
  }

  static async findFeatured(limit = 8) {
    const result = await ProductQueries.findFeatured(limit);
    return serialize(result);
  }
}

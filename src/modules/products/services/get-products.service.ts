import { ProductQueries } from "../queries/product.queries";
import { serialize } from "@/lib/server-serialization";
import { ResolveProductImagesService } from "@/modules/media/services/resolve-product-images.service";

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
    targetGender?: string;
    search?: string;
    maxPrice?: number;
    includeVariants?: boolean;
  }) {
    const searchParams = {
      categoryId: params?.categoryId,
      targetGender: params?.targetGender,
      search: params?.search,
      maxPrice: params?.maxPrice,
      includeVariants: params?.includeVariants,
    };
    const result = await ProductQueries.findAll(searchParams);
    const resolved = await ResolveProductImagesService.resolve(result);
    return serialize(resolved);
  }

  static async byId(id: string) {
    if (!id) throw new Error("Product ID is required");
    const result = await ProductQueries.findById(id);
    if (!result) return null;
    const [resolved] = await ResolveProductImagesService.resolve([result]);
    return serialize(resolved);
  }

  static async findFeatured(limit = 8) {
    const result = await ProductQueries.findFeatured(limit);
    const resolved = await ResolveProductImagesService.resolve(result);
    return serialize(resolved);
  }
}

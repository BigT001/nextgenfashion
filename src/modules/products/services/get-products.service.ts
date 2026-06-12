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
  private static normalizeProduct(product: any) {
    if (!product) return product;
    const variants = (product.ProductVariant ?? []).map((variant: any) => ({
      ...variant,
      inventory: variant.Inventory ?? variant.inventory,
    }));
    return { ...product, variants };
  }

  private static normalizeProducts(products: any[]) {
    return products.map((product) => this.normalizeProduct(product));
  }

  static async execute(params?: {
    categoryId?: string;
    targetGender?: string;
    search?: string;
    includeVariants?: boolean;
    limit?: number;
    offset?: number;
  }) {
    try {
      const searchParams = {
        categoryId: params?.categoryId,
        targetGender: params?.targetGender,
        search: params?.search,
        includeVariants: params?.includeVariants,
        limit: params?.limit ?? 30,
        offset: params?.offset ?? 0,
      };
      const result = await ProductQueries.findAll(searchParams);
      const normalized = this.normalizeProducts(result);
      const resolved = await ResolveProductImagesService.resolve(normalized, {
        allowRemoteImageDiscovery: false,
      });
      return serialize(resolved);
    } catch (error) {
      console.error("[GetProductsService.execute] Failed to load products:", error);
      return [];
    }
  }

  static async byId(id: string, options?: { allowRemoteImageDiscovery?: boolean }) {
    if (!id) throw new Error("Product ID is required");
    try {
      const result = await ProductQueries.findById(id);
      if (!result) return null;
      const normalized = this.normalizeProduct(result);
      const [resolved] = await ResolveProductImagesService.resolve([normalized], {
        allowRemoteImageDiscovery: options?.allowRemoteImageDiscovery,
      });
      return serialize(resolved);
    } catch (error) {
      console.error(`[GetProductsService.byId] Failed to load product ${id}:`, error);
      return null;
    }
  }

  static async findFeatured(limit = 8) {
    try {
      const result = await ProductQueries.findFeatured(limit);
      const normalized = this.normalizeProducts(result);
      const resolved = await ResolveProductImagesService.resolve(normalized, {
        allowRemoteImageDiscovery: false,
      });
      return serialize(resolved);
    } catch (error) {
      console.error("[GetProductsService.findFeatured] Failed to load featured products:", error);
      return [];
    }
  }
}

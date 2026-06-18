import { ProductQueries } from "../queries/product.queries";
import { serialize } from "@/lib/server-serialization";
import { ResolveProductImagesService } from "@/modules/media/services/resolve-product-images.service";
import { getAutoVatSetting } from "@/modules/settings/actions/settings.actions";

/**
 * GET PRODUCTS SERVICE
 * Layer 3: Business Logic
 * Single Responsibility: Fetching and filtering products.
 * NOTE: All methods apply serialize() to convert Prisma Decimal/Date
 * objects into plain JS values safe for the Server→Client boundary.
 */
export class GetProductsService {
  private static normalizeProduct(product: any, vatEnabled = false) {
    if (!product) return product;

    const basePriceNum = product.basePrice ? Number(product.basePrice) : null;
    const effectiveBasePrice = basePriceNum !== null 
      ? (vatEnabled ? Math.round(basePriceNum * 1.075) : basePriceNum)
      : null;

    const variants = (product.ProductVariant ?? []).map((variant: any) => {
      const priceNum = variant.price ? Number(variant.price) : null;
      const effectivePrice = priceNum !== null 
        ? (vatEnabled ? Math.round(priceNum * 1.075) : priceNum)
        : null;

      return {
        ...variant,
        price: effectivePrice,
        inventory: variant.Inventory ?? variant.inventory,
      };
    });

    return { 
      ...product, 
      basePrice: effectiveBasePrice,
      variants 
    };
  }

  private static normalizeProducts(products: any[], vatEnabled = false) {
    return products.map((product) => this.normalizeProduct(product, vatEnabled));
  }

  static async execute(params?: {
    categoryId?: string;
    targetGender?: string;
    search?: string;
    includeVariants?: boolean;
    limit?: number;
    offset?: number;
    random?: boolean;
  }) {
    try {
      const searchParams = {
        categoryId: params?.categoryId,
        targetGender: params?.targetGender,
        search: params?.search,
        includeVariants: params?.includeVariants,
        take: params?.limit,
        skip: params?.offset,
        random: params?.random,
      };
      const vatEnabled = await getAutoVatSetting();
      const result = await ProductQueries.findAll(searchParams);
      const normalized = this.normalizeProducts(result, vatEnabled);
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
      const vatEnabled = await getAutoVatSetting();
      const normalized = this.normalizeProduct(result, vatEnabled);
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
      const vatEnabled = await getAutoVatSetting();
      const normalized = this.normalizeProducts(result, vatEnabled);
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

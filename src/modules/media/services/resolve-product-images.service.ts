import { v2 as cloudinary } from "cloudinary";

const normalizeIdentifier = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const extractProductSlug = (value: string) => {
  const withoutFolder = value.split("/").slice(-1)[0] || value;
  const withoutProductPrefix = withoutFolder.replace(/^PRODUCT-?/i, "");
  const withoutTimestamp = withoutProductPrefix.replace(/-\d{10,}$/g, "");
  return normalizeIdentifier(withoutTimestamp);
};

const extractAssetTimestamp = (value: string) => {
  const match = value.match(/-(\d{10,})$/);
  return match ? Number(match[1]) : 0;
};

const tokenizeIdentifier = (value: string) => {
  const normalized = normalizeIdentifier(value);
  if (!normalized) return [];

  const segments = normalized.split("-").filter(Boolean);
  const tokens = new Set<string>();

  for (const segment of segments) {
    if (segment.length >= 4) {
      tokens.add(segment);
    }

    if (/^[A-Z]+$/.test(segment) && segment.length >= 4) {
      for (let length = 4; length <= Math.min(segment.length, 5); length += 1) {
        tokens.add(segment.slice(0, length));
      }
    }
  }

  return Array.from(tokens);
};

export type ProductWithVariants = {
  id: string;
  name: string;
  images?: string[] | null;
  categoryId?: string | null;
  category?: { name?: string | null } | null;
  variants?: Array<{
    sku?: string | null;
    barcode?: string | null;
  }> | null;
};

export type ResolvedProduct<T extends ProductWithVariants = ProductWithVariants> = T & {
  resolvedImage: string;
  images: string[];
};

const PRODUCT_PLACEHOLDER_IMAGE = "/images/product-placeholder.svg";

export class ResolveProductImagesService {
  static async resolve<T extends ProductWithVariants>(products: T[]): Promise<ResolvedProduct<T>[]> {
    if (products.length === 0) return [];

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    const assetGroups = new Map<string, Array<{ publicId: string; secureUrl: string; slug: string; timestamp: number; tokens: string[] }>>();
    const globalTokenFrequency = new Map<string, number>();
    const searchExpressions = [
      "folder:nextgenfashion/products AND resource_type:image",
      "folder:nextgenfashion AND resource_type:image",
    ];

    try {
      for (const expression of searchExpressions) {
        let nextCursor: string | undefined = undefined;
        do {
          const search = cloudinary.search
            .expression(expression)
            .sort_by("public_id", "asc")
            .max_results(200);

          if (nextCursor) {
            search.next_cursor(nextCursor);
          }

          const result = await search.execute();
          const assets = result.resources || [];

          for (const asset of assets) {
            const publicId = String(asset.public_id || "");
            const secureUrl = String(asset.secure_url || asset.url || "");
            if (!publicId || !secureUrl) continue;

            const slug = extractProductSlug(publicId);
            const timestamp = extractAssetTimestamp(publicId);
            const tokens = tokenizeIdentifier(slug);

            for (const token of tokens) {
              globalTokenFrequency.set(token, (globalTokenFrequency.get(token) || 0) + 1);
            }

            const assetRecord = {
              publicId,
              secureUrl,
              slug,
              timestamp,
              tokens,
            };

            const existingGroup = assetGroups.get(slug) || [];
            existingGroup.push(assetRecord);
            assetGroups.set(slug, existingGroup);
          }

          nextCursor = result.next_cursor || undefined;
        } while (nextCursor);
      }
    } catch (error) {
      console.error("[ResolveProductImagesService] Cloudinary search failed:", error);
    }

    if (assetGroups.size === 0) {
      console.warn("[ResolveProductImagesService] No Cloudinary assets were discovered; using local product placeholder fallback.");
    }

    const usedUrls = new Set<string>();
    const assetPool = Array.from(assetGroups.values()).flat().sort((a, b) => b.timestamp - a.timestamp);

    const selectUniqueAssets = (candidates: Array<{ publicId: string; secureUrl: string; slug: string; timestamp: number; tokens: string[] }>) => {
      const unused = candidates.filter((asset) => !usedUrls.has(asset.secureUrl));
      const selected = unused.length > 0 ? unused : candidates;
      if (selected.length > 0) {
        usedUrls.add(selected[0].secureUrl);
      }
      return selected;
    };

    return products.map((product) => {
      const fallbackImages = Array.isArray(product.images)
        ? product.images.filter((image): image is string => Boolean(image && image.trim() !== ""))
        : [];

      const candidateKeys = new Set<string>();
      if (product.name) candidateKeys.add(normalizeIdentifier(product.name));
      if (product.category?.name) candidateKeys.add(normalizeIdentifier(product.category.name));
      for (const variant of product.variants || []) {
        if (variant.sku) candidateKeys.add(normalizeIdentifier(variant.sku));
        if (variant.barcode) candidateKeys.add(normalizeIdentifier(variant.barcode));
      }

      let matchedAssets: Array<{ publicId: string; secureUrl: string; slug: string; timestamp: number; tokens: string[] }> = [];
      for (const key of candidateKeys) {
        const exactGroup = assetGroups.get(key);
        if (exactGroup && exactGroup.length > 0) {
          matchedAssets = exactGroup.slice().sort((a, b) => b.timestamp - a.timestamp);
          break;
        }
      }

      if (matchedAssets.length === 0) {
        const hintTokens = new Map<string, number>();
        for (const key of candidateKeys) {
          const tokens = tokenizeIdentifier(key);
          for (const token of tokens) {
            hintTokens.set(token, (hintTokens.get(token) || 0) + 1);
          }
        }

        let bestGroup: Array<{ publicId: string; secureUrl: string; slug: string; timestamp: number; tokens: string[] }> | null = null;
        let bestScore = -1;
        let bestTokenCount = 0;

        for (const assetGroup of assetGroups.values()) {
          const representative = assetGroup[0];
          let score = 0;
          let matchedTokenCount = 0;

          for (const token of representative.tokens) {
            if (hintTokens.has(token)) {
              const rarityWeight = 1 / (globalTokenFrequency.get(token) || 1);
              const tokenStrength = token.length >= 6 ? 6 : token.length >= 4 ? 4 : 2;
              score += tokenStrength * rarityWeight * hintTokens.get(token)!;
              matchedTokenCount += 1;
            }
          }

          if (
            (matchedTokenCount > bestTokenCount && matchedTokenCount >= 2) ||
            (matchedTokenCount === bestTokenCount && score > bestScore && matchedTokenCount >= 2)
          ) {
            bestScore = score;
            bestGroup = assetGroup.slice().sort((a, b) => b.timestamp - a.timestamp);
            bestTokenCount = matchedTokenCount;
          }
        }

        if (bestTokenCount >= 2 && bestScore > 0 && bestGroup) {
          matchedAssets = bestGroup;
        }
      }

      const selectedAssets = matchedAssets.length > 0
        ? selectUniqueAssets(matchedAssets)
        : selectUniqueAssets(assetPool.filter((asset) => asset.slug.length > 0));

      const selectedAsset = selectedAssets[0];
      const resolvedImages = selectedAsset
        ? [selectedAsset.secureUrl]
        : fallbackImages.length > 0
          ? fallbackImages
          : [PRODUCT_PLACEHOLDER_IMAGE];
      const resolvedImage = resolvedImages[0] || PRODUCT_PLACEHOLDER_IMAGE;

      return {
        ...product,
        resolvedImage,
        images: resolvedImages,
      };
    });
  }
}

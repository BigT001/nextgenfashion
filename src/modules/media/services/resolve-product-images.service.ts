import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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

const tokenizeIdentifier = (value: string) => {
  const normalized = normalizeIdentifier(value);
  if (!normalized) return [];

  const segments = normalized.split("-").filter(Boolean);
  const tokens = new Set<string>();

  for (const segment of segments) {
    if (segment.length >= 3) {
      tokens.add(segment);
    }

    if (/^[A-Z]+$/.test(segment)) {
      for (let length = 3; length <= Math.min(segment.length, 5); length += 1) {
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

export class ResolveProductImagesService {
  static async resolve<T extends ProductWithVariants>(products: T[]): Promise<ResolvedProduct<T>[]> {
    if (products.length === 0) return [];

    const folder = "nextgenfashion/products";
    const assetIndex = new Map<string, string>();
    const assetRecords: Array<{ publicId: string; secureUrl: string; tokens: string[] }> = [];
    const globalTokenFrequency = new Map<string, number>();

    try {
      let nextCursor: string | undefined = undefined;
      do {
        const search = cloudinary.search
          .expression(`folder:${folder} AND resource_type:image`)
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

          const normalizedAssetKey = extractProductSlug(publicId);
          assetIndex.set(normalizedAssetKey, secureUrl);

          const tokens = tokenizeIdentifier(normalizedAssetKey);
          for (const token of tokens) {
            globalTokenFrequency.set(token, (globalTokenFrequency.get(token) || 0) + 1);
          }

          assetRecords.push({
            publicId,
            secureUrl,
            tokens,
          });
        }

        nextCursor = result.next_cursor || undefined;
      } while (nextCursor);
    } catch (error) {
      console.error("[ResolveProductImagesService] Cloudinary search failed:", error);
    }

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

      // Prefer direct substring match on asset baseId
      let matchedUrl = "";
      let foundDirect = false;
      for (const key of candidateKeys) {
        for (const asset of assetRecords) {
          if (asset.publicId && extractProductSlug(asset.publicId).includes(key)) {
            matchedUrl = asset.secureUrl;
            foundDirect = true;
            break;
          }
        }
        if (foundDirect) break;
      }

      // If no direct substring match, use token overlap but require at least 2 unique tokens
      if (!matchedUrl) {
        const hintTokens = new Map<string, number>();
        for (const key of candidateKeys) {
          const tokens = tokenizeIdentifier(key);
          for (const token of tokens) {
            hintTokens.set(token, (hintTokens.get(token) || 0) + 1);
          }
        }

        let bestAsset: { secureUrl: string } | null = null;
        let bestScore = -1;
        let bestTokenCount = 0;

        for (const asset of assetRecords) {
          let score = 0;
          let matchedTokenCount = 0;
          for (const token of asset.tokens) {
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
            bestAsset = asset;
            bestTokenCount = matchedTokenCount;
          }
        }
        if (bestTokenCount >= 2 && bestScore > 0) {
          matchedUrl = bestAsset?.secureUrl || "";
        }
      }

      const resolvedImages = matchedUrl
        ? [matchedUrl]
        : fallbackImages;

      return {
        ...product,
        resolvedImage: matchedUrl || fallbackImages[0] || "",
        images: resolvedImages,
      };
    });
  }
}

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
  // Prisma relation alias
  Category?: { name?: string | null } | null;
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

const isValidImageSource = (value: string) => {
  if (!value) return false;
  if (value.startsWith("/")) return true;

  try {
    const parsedUrl = new URL(value);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

const sanitizeImageSources = (values: unknown[]) => {
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .filter((value) => isValidImageSource(value));
};

const collectCloudinaryAssets = async (shouldFetchRemoteAssets: boolean) => {
  const assetGroups = new Map<string, Array<{ publicId: string; secureUrl: string; slug: string; timestamp: number; tokens: string[] }>>();
  const globalTokenFrequency = new Map<string, number>();

  const addAssetRecord = (asset: { public_id?: string | null; secure_url?: string | null; url?: string | null }) => {
    const publicId = String(asset.public_id || "");
    const secureUrl = String(asset.secure_url || asset.url || "");
    if (!publicId || !secureUrl) return;

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
  };

  if (!shouldFetchRemoteAssets) {
    console.warn("[ResolveProductImagesService] Cloudinary credentials are incomplete; skipping remote asset discovery.");
    return { assetGroups, globalTokenFrequency };
  }

  try {
    let nextCursor: string | undefined = undefined;
    do {
      const result = await cloudinary.api.resources({
        type: "upload",
        resource_type: "image",
        prefix: "nextgenfashion/products",
        max_results: 500,
        next_cursor: nextCursor,
      });

      const assets = Array.isArray(result.resources) ? result.resources : [];
      for (const asset of assets) {
        addAssetRecord(asset);
      }

      nextCursor = typeof result.next_cursor === "string" ? result.next_cursor : undefined;
    } while (nextCursor);
  } catch (error) {
    console.error("[ResolveProductImagesService] Cloudinary resources API failed:", error);
  }

  if (assetGroups.size === 0) {
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
            addAssetRecord(asset);
          }

          nextCursor = result.next_cursor || undefined;
        } while (nextCursor);
      }
    } catch (error) {
      console.error("[ResolveProductImagesService] Cloudinary search failed:", error);
    }
  }

  return { assetGroups, globalTokenFrequency };
};

export class ResolveProductImagesService {
  static async resolve<T extends ProductWithVariants>(products: T[]): Promise<ResolvedProduct<T>[]> {
    if (products.length === 0) return [];

    const hasCloudinaryCredentials = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (hasCloudinaryCredentials) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    } else {
      console.warn("[ResolveProductImagesService] Cloudinary environment variables are not fully configured.");
    }

    const { assetGroups, globalTokenFrequency } = await collectCloudinaryAssets(hasCloudinaryCredentials);

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

      // If the product already has persisted images in the database, prefer
      // those as the source of truth. This avoids the Cloudinary heuristic
      // matching selecting assets that belong to other products and prevents
      // images from leaking across products.
      const dbImages = sanitizeImageSources(fallbackImages);
      if (dbImages.length > 0) {
        const resolvedImage = dbImages[0] || PRODUCT_PLACEHOLDER_IMAGE;
        // Debug trace to help diagnose image assignment issues in production.
        try {
          // eslint-disable-next-line no-console
          console.log(`[ResolveProductImagesService] Using DB images for product ${product.id}: ${resolvedImage}`);
        } catch (e) {}

        return {
          ...product,
          resolvedImage,
          images: dbImages,
        } as ResolvedProduct<T>;
      }

      // Heuristic Cloudinary matching has been disabled to prevent accidental
      // assignment of assets belonging to other products. If a product has no
      // persisted images, we return the placeholder image only. This ensures
      // that images are only shown when explicitly linked to the product.
      try {
        // eslint-disable-next-line no-console
        console.log(`[ResolveProductImagesService] No DB images for product ${product.id}; using placeholder`);
      } catch (e) {}

      return {
        ...product,
        resolvedImage: PRODUCT_PLACEHOLDER_IMAGE,
        images: [PRODUCT_PLACEHOLDER_IMAGE],
      } as ResolvedProduct<T>;
    });
  }
}

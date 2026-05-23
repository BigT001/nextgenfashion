import { prisma } from "@/services/prisma.service";

export interface PosImageSyncResult {
  success: boolean;
  skipped: boolean;
  processed: number;
  uploaded: number;
  itemId?: string;
  errors: string[];
}

const buildPosUrl = (base: string, path: string) => {
  const normalizedBase = base.replace(/\/+$|^\s+|\s+$/g, "");
  const normalizedPath = path.replace(/^\/+|\s+$/g, "");
  return `${normalizedBase}/${normalizedPath}`;
};

const normalizeImageUrl = (url: unknown): string | null => {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return null;
  return /^(https?:\/\/|\/)/.test(trimmed) ? trimmed : null;
};

const parsePosItemId = (sku?: string) => {
  if (!sku) return undefined;
  const match = sku.trim().toUpperCase().match(/^POS-ITEM-(\d+)$/);
  return match ? match[1] : undefined;
};

const getExtensionFromMime = (mime: string | null) => {
  if (!mime) return "jpg";
  if (mime.includes("jpeg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("svg")) return "svg";
  return "jpg";
};

export class PushPosProductImagesService {
  static async execute(productId: string, imageUrls: string[]): Promise<PosImageSyncResult> {
    const apiUrl = process.env.POS_API_URL;
    const apiKey = process.env.POS_API_KEY;

    if (!apiUrl || !apiKey) {
      return {
        success: false,
        skipped: true,
        processed: imageUrls.length,
        uploaded: 0,
        errors: ["POS_API_URL or POS_API_KEY is not configured."],
      };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        images: true,
        variants: { select: { sku: true } },
      },
    });

    if (!product) {
      return {
        success: false,
        skipped: false,
        processed: imageUrls.length,
        uploaded: 0,
        errors: ["Product not found."],
      };
    }

    const posVariant = product.variants.find((variant) => typeof variant.sku === "string" && variant.sku.toUpperCase().startsWith("POS-ITEM-"));
    if (!posVariant) {
      return {
        success: false,
        skipped: true,
        processed: imageUrls.length,
        uploaded: 0,
        errors: ["Product is not linked to a POS item."],
      };
    }

    const itemId = parsePosItemId(posVariant.sku);
    if (!itemId) {
      return {
        success: false,
        skipped: false,
        processed: imageUrls.length,
        uploaded: 0,
        errors: ["Unable to parse POS item ID from variant SKU."],
      };
    }

    const uniqueUrls = Array.from(new Set(imageUrls.map((url) => url.trim()).filter(Boolean)));
    let uploaded = 0;
    const errors: string[] = [];

    const getErrorMessage = (error: unknown) =>
      error instanceof Error ? error.message : String(error ?? "Unknown error");

    for (const rawUrl of uniqueUrls) {
      const imageUrl = normalizeImageUrl(rawUrl);
      if (!imageUrl) {
        errors.push(`Skipping invalid image URL: ${rawUrl}`);
        continue;
      }

      try {
        await this.uploadImageToPos(itemId, imageUrl, apiUrl, apiKey);
        uploaded++;
      } catch (error: unknown) {
        errors.push(`POS image upload failed for ${imageUrl}: ${getErrorMessage(error)}`);
      }
    }

    return {
      success: errors.length === 0,
      skipped: false,
      processed: uniqueUrls.length,
      uploaded,
      itemId,
      errors,
    };
  }

  private static async uploadImageToPos(itemId: string, imageUrl: string, apiUrl: string, apiKey: string) {
    const assetResponse = await fetch(imageUrl);
    if (!assetResponse.ok) {
      throw new Error(`Failed to download image from ${imageUrl}: ${assetResponse.status} ${assetResponse.statusText}`);
    }

    const contentType = assetResponse.headers.get("content-type") || "application/octet-stream";
    const extension = getExtensionFromMime(contentType);
    const fileName = `pos-image-${itemId}-${Date.now()}.${extension}`;
    const buffer = await assetResponse.arrayBuffer();
    const formData = new FormData();

    formData.append("image", new Blob([buffer], { type: contentType }), fileName);
    formData.append("item_id", itemId);

    const endpoint = buildPosUrl(apiUrl, `items/${itemId}/image`);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
      body: formData,
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`POS image upload request failed with status ${response.status}: ${responseText}`);
    }

    if (responseText.trim().startsWith("{")) {
      const payload = JSON.parse(responseText);
      if (payload?.status === false) {
        throw new Error(payload?.error || "POS returned a failed status");
      }
    }
  }
}

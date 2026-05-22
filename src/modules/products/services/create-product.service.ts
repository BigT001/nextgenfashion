import { ProductQueries } from "../queries/product.queries";
import { Prisma } from "@prisma/client";

/**
 * CREATE PRODUCT SERVICE
 * Layer 3: Business Logic
 */
export class CreateProductService {
  private static normalizeImageUrls(images: any): string[] {
    if (!Array.isArray(images)) return [];

    return images
      .map((img: any) => {
        if (typeof img === "string") return img;
        if (img && typeof img === "object" && typeof img.url === "string") return img.url;
        return null;
      })
      .filter((url: string | null): url is string => {
        if (!url || typeof url !== "string") return false;
        if (url.startsWith("blob:") || url.startsWith("data:")) return false;
        return /^(https?:\/\/|\/)/.test(url);
      });
  }

  static async execute(
    productData: Omit<Prisma.ProductCreateInput, "category"> & {
      categoryId: string;
      images?: string[];
    },
    variants: (Prisma.ProductVariantCreateWithoutProductInput & {
      stock: number;
    })[]
  ) {
    // Business Logic: Prepare the data structure for the query layer
    const createInput: any = {
      name: productData.name,
      description: productData.description,
      basePrice: productData.basePrice,
      costPrice: (productData as any).costPrice,
      tax: (productData as any).tax,
      targetGender: productData.targetGender,
      images: this.normalizeImageUrls(productData.images),
      category: { connect: { id: productData.categoryId } },
      variants: {
        create: variants.map(({ stock, ...v }) => ({
          ...v,
          inventory: {
            create: {
              quantity: stock,
              warehouseId: (productData as any).warehouseId || null,
            },
          },
        })),
      },
    };

    return await ProductQueries.create(createInput);
  }
}

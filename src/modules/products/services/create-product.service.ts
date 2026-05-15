import { ProductQueries } from "../queries/product.queries";
import { Prisma } from "@prisma/client";

/**
 * CREATE PRODUCT SERVICE
 * Layer 3: Business Logic
 */
export class CreateProductService {
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
      images: productData.images || [],
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

import { ProductQueries } from "../queries/product.queries";
import { Prisma } from "@prisma/client";

/**
 * UPDATE PRODUCT SERVICE
 * Layer 3: Business Logic
 */
export class UpdateProductService {
  static async execute(
    id: string,
    productData: Partial<Prisma.ProductUpdateInput> & {
      categoryId?: string;
      images?: string[];
    }
  ) {
    // Prepare the update input
    const updateInput: Prisma.ProductUpdateInput = {
      ...productData,
      ...(productData.categoryId && {
        category: { connect: { id: productData.categoryId } }
      }),
      ...(productData.images && {
        images: productData.images
      })
    };

    // Note: Variant synchronization (CRUD on variants) would happen here
    // For the MVP, we focus on the core product identity and metadata.

    return await ProductQueries.update(id, updateInput);
  }
}

import { ProductQueries } from "../queries/product.queries";

/**
 * GET CATEGORIES SERVICE
 * Layer 3: Business Logic
 */
export class GetCategoriesService {
  static async execute() {
    return await ProductQueries.findCategories();
  }
}

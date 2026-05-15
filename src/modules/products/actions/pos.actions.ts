"use server";

import { POSProductQueries } from "../queries/pos-product.queries";

/**
 * Fetch products for POS with optional search query
 * This is a server action wrapper around our specialized POS queries
 */
export async function getPOSProductsAction(query?: string) {
  try {
    const products = await POSProductQueries.searchProducts(query);
    return { success: true, data: products };
  } catch (error) {
    console.error("Error fetching POS products:", error);
    return { success: false, error: "Failed to load products" };
  }
}

/**
 * Fetch categories for POS filtering
 */
export async function getPOSCategoriesAction() {
  try {
    const categories = await POSProductQueries.getCategories();
    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching POS categories:", error);
    return { success: false, error: "Failed to load categories" };
  }
}

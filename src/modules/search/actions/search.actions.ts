"use server";

import { SearchQueries } from "../queries/search.queries";

/**
 * Perform a universal search across the entire OS
 */
export async function universalSearchAction(query: string) {
  try {
    const results = await SearchQueries.universalSearch(query);
    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error("Error during universal search:", error);
    return { success: false, error: "Failed to perform system discovery" };
  }
}

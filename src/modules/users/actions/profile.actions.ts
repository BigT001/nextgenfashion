"use server";

import { ProfileQueries } from "../queries/profile.queries";
import { auth } from "@/services/auth.service";

/**
 * Fetch all data required for the Personal Profile Dashboard
 */
export async function getProfileDashboardAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const data = await ProfileQueries.getProfileData(session.user.id);
    if (!data) return { success: false, error: "Profile not found" };

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error("Error fetching profile dashboard data:", error);
    return { success: false, error: "Failed to load personal intelligence" };
  }
}

import { NextResponse, after } from "next/server";
import { SyncPosProductsService } from "@/modules/products/services/sync-pos-products.service";

export const maxDuration = 300; // Allow up to 5 minutes execution time for full paginated catalog syncing

/**
 * GET /api/pos-sync
 * Safe trigger endpoint for automated 5-minute cron schedulers
 */
export async function GET(request: Request) {
  // Simple Authorization header check or secret param check for security
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  
  const expectedSecret = process.env.NEXTAUTH_SECRET || "pos-sync-secret";
  const cronSecret = process.env.CRON_SECRET;

  const isAuthorized = 
    (secret === expectedSecret) || 
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (process.env.NODE_ENV !== "production");

  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("⏱️ Automated/Cron trigger received. Running POS synchronization in background...");
    
    // Utilize Next.js after to run the sync asynchronously in the background.
    // This responds immediately (within milliseconds) to avoid Vercel and cron-job.org timeouts,
    // while keeping the serverless instance alive until the sync completes.
    after(async () => {
      try {
        const result = await SyncPosProductsService.execute();
        console.log(`🎉 Background POS sync completed. Synced: ${result.totalSynced}, Created: ${result.totalCreated}, Updated: ${result.totalUpdated}.`);
      } catch (error) {
        console.error("❌ Background POS sync failed:", error);
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "POS Synchronization triggered and running asynchronously in background." 
    });
  } catch (error: any) {
    console.error("❌ Cron sync dispatch failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/pos-sync
 * Trigger sync via client action posts
 */
export async function POST() {
  try {
    const result = await SyncPosProductsService.execute();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

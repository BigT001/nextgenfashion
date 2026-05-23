import { NextResponse, after } from "next/server";
import { SyncPosProductsService } from "@/modules/products/services/sync-pos-products.service";
import { SyncPosTransactionsService } from "@/modules/pos/services/sync-pos-transactions.service";

export const maxDuration = 300; // Allow up to 5 minutes execution time for full paginated catalog syncing

const getPosSyncAuth = (request: Request) => {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  const expectedSecret = process.env.POS_SYNC_SECRET || process.env.NEXTAUTH_SECRET || "pos-sync-secret";
  const cronSecret = process.env.CRON_SECRET;

  return (
    secret === expectedSecret ||
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    process.env.NODE_ENV !== "production"
  );
};

const unauthorizedResponse = () =>
  NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

/**
 * GET /api/pos-sync
 * Safe trigger endpoint for automated 5-minute cron schedulers
 */
export async function GET(request: Request) {
  if (!getPosSyncAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || searchParams.get("kind") || "products").toLowerCase();

    console.log(`⏱️ Automated/Cron trigger received. Running POS ${type} synchronization in background...`);

    after(async () => {
      try {
        if (type === "transactions") {
          const result = await SyncPosTransactionsService.execute();
          console.log(`🎉 Background POS transaction sync completed: ${result.totalCreated} created, ${result.totalUpdated} updated, ${result.totalSkipped} skipped.`);
        } else if (type === "all") {
          const productResult = await SyncPosProductsService.execute();
          console.log(`🎉 Background POS product sync completed: Synced ${productResult.totalSynced}, Created ${productResult.totalCreated}, Updated ${productResult.totalUpdated}.`);
          const transactionResult = await SyncPosTransactionsService.execute();
          console.log(`🎉 Background POS transaction sync completed: ${transactionResult.totalCreated} created, ${transactionResult.totalUpdated} updated, ${transactionResult.totalSkipped} skipped.`);
        } else {
          const result = await SyncPosProductsService.execute();
          console.log(`🎉 Background POS product sync completed: Synced ${result.totalSynced}, Created ${result.totalCreated}, Updated ${result.totalUpdated}.`);
        }
      } catch (error) {
        console.error("❌ Background POS sync failed:", error);
      }
    });

    return NextResponse.json({
      success: true,
      message: `POS ${type} synchronization triggered and running asynchronously in background.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown cron sync dispatch error";
    console.error("❌ Cron sync dispatch failed:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/pos-sync
 * Trigger sync via client action posts
 */
export async function POST(request: Request) {
  if (!getPosSyncAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || searchParams.get("kind") || "products").toLowerCase();

    if (type === "transactions") {
      const result = await SyncPosTransactionsService.execute();
      return NextResponse.json(result);
    }

    if (type === "all") {
      const productResult = await SyncPosProductsService.execute();
      const transactionResult = await SyncPosTransactionsService.execute();
      return NextResponse.json({
        success: true,
        products: productResult,
        transactions: transactionResult,
      });
    }

    const result = await SyncPosProductsService.execute();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown POS sync error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

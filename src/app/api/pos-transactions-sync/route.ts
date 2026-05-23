import { NextResponse, after } from "next/server";
import { SyncPosTransactionsService } from "@/modules/pos/services/sync-pos-transactions.service";

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

export async function GET(request: Request) {
  if (!getPosSyncAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    after(async () => {
      try {
        const result = await SyncPosTransactionsService.execute();
        console.log(`🎉 Background POS transaction sync completed: ${result.totalCreated} created, ${result.totalUpdated} updated, ${result.totalSkipped} skipped.`);
      } catch (error) {
        console.error("❌ Background POS transaction sync failed:", error);
      }
    });

    return NextResponse.json({
      success: true,
      message: "POS transaction sync has been queued and will run in the background.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!getPosSyncAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const result = await SyncPosTransactionsService.execute();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

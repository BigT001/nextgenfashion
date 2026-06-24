import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma.service";
import { getShippingFeeAction } from "@/modules/delivery/actions/actions";
import { DeliveryQueries } from "@/modules/delivery/queries/delivery.queries";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch DB settings
    const settings = await DeliveryQueries.getSpeedafSettings();
    const rawSettings = await prisma.settings.findMany();

    // 2. Call the server action directly to check results or exceptions
    const params = {
      receiverProvinceCode: "NGR00016", // Plateau
      receiverCityCode: "NGC00241",     // Bokkos
      receiverAreaCode: "NGA04048",     // Mushere West
      weight: 1.5,
    };

    let calculatedFee: any = null;
    let errorLogged = null;
    try {
      calculatedFee = await getShippingFeeAction(params);
    } catch (err: any) {
      errorLogged = err.message || err;
    }

    return NextResponse.json({
      success: true,
      settings,
      rawSettings,
      actionResult: calculatedFee,
      actionError: errorLogged,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || error
    }, { status: 500 });
  }
}

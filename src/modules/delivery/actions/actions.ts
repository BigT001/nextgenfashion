"use server";

import { SpeedafService, SpeedafItem } from "../services/speedaf.service";
import { DeliveryQueries } from "../queries/delivery.queries";
import { prisma } from "@/services/prisma.service";

interface AreaNode {
  code: string;
  name: string;
  enName?: string;
  children?: AreaNode[];
}

/**
 * Server Action: Fetch all Provinces in Nigeria from cached asset
 */
export async function getProvincesAction() {
  try {
    const tree = (await SpeedafService.fetchLocationTree()) as any;
    if (!tree || !Array.isArray(tree.children)) {
      return { success: false, error: "Failed to load location tree" };
    }
    const provinces = tree.children.map((p: AreaNode) => ({
      code: p.code,
      name: p.enName || p.name,
    }));
    return { success: true, data: provinces };
  } catch (error: any) {
    console.error("[getProvincesAction] error:", error);
    return { success: false, error: error.message || "Failed to fetch provinces" };
  }
}

/**
 * Server Action: Fetch all Cities under a Province
 */
export async function getCitiesAction(provinceCode: string) {
  try {
    if (!provinceCode) return { success: true, data: [] };
    const tree = (await SpeedafService.fetchLocationTree()) as any;
    const province = tree.children?.find((p: AreaNode) => p.code === provinceCode);
    if (!province || !Array.isArray(province.children)) {
      return { success: true, data: [] };
    }
    const cities = province.children.map((c: AreaNode) => ({
      code: c.code,
      name: c.enName || c.name,
    }));
    return { success: true, data: cities };
  } catch (error: any) {
    console.error("[getCitiesAction] error:", error);
    return { success: false, error: error.message || "Failed to fetch cities" };
  }
}

/**
 * Server Action: Fetch all Districts/Areas under a Province and City
 */
export async function getAreasAction(provinceCode: string, cityCode: string) {
  try {
    if (!provinceCode || !cityCode) return { success: true, data: [] };
    const tree = (await SpeedafService.fetchLocationTree()) as any;
    const province = tree.children?.find((p: AreaNode) => p.code === provinceCode);
    if (!province) return { success: true, data: [] };
    const city = province.children?.find((c: AreaNode) => c.code === cityCode);
    if (!city || !Array.isArray(city.children)) {
      return { success: true, data: [] };
    }
    const areas = city.children.map((a: AreaNode) => ({
      code: a.code,
      name: a.enName || a.name,
    }));
    return { success: true, data: areas };
  } catch (error: any) {
    console.error("[getAreasAction] error:", error);
    return { success: false, error: error.message || "Failed to fetch areas" };
  }
}

/**
 * Server Action: Calculates Speedaf Tariff fee, with a default fallback if disabled
 */
export async function getShippingFeeAction(params: {
  receiverProvinceCode: string;
  receiverCityCode: string;
  receiverAreaCode: string;
  weight: number;
}) {
  try {
    const settings = await DeliveryQueries.getSpeedafSettings();
    if (!settings.enabled) {
      // Return default flat rate fallback
      return { success: true, fee: 3500, currency: "NGN", isFallback: true };
    }
    const feeData = await SpeedafService.calculateTariff(params);
    return {
      success: true,
      fee: Number(feeData.fee) || 3500,
      currency: feeData.currencyCode || "NGN",
      isFallback: false,
    };
  } catch (error: any) {
    console.error("[getShippingFeeAction] error (falling back):", error);
    // Graceful fallback to flat rate NGN 3500 so checkout page is not broken
    return { success: true, fee: 3500, currency: "NGN", isFallback: true };
  }
}

/**
 * Server Action: Dispatches an Order (Sale) to Speedaf to generate a Waybill number
 */
export async function dispatchOrderToSpeedafAction(saleId: string) {
  try {
    const sale = await DeliveryQueries.findSaleForSpeedaf(saleId);
    if (!sale) {
      return { success: false, error: "Order not found" };
    }

    if (sale.waybillNumber) {
      return { success: true, waybillNumber: sale.waybillNumber, alreadyDispatched: true };
    }

    // Verify address codes are present
    if (!sale.deliveryProvinceCode || !sale.deliveryCityCode || !sale.deliveryDistrictCode) {
      return {
        success: false,
        error: "Missing location codes (State, City, or Area) on order. Please update order destination first.",
      };
    }

    // Resolve items and compute weight
    let totalWeight = 0;
    const speedafItems: SpeedafItem[] = sale.SaleItem.map((item) => {
      const variant = item.ProductVariant;
      const product = variant?.Product;
      
      // Default item weight to 0.5 kg if not specified
      const itemWeight = Number((variant as any)?.weight) || Number((product as any)?.weight) || 0.5;
      totalWeight += itemWeight * item.quantity;

      return {
        sku: variant?.sku || variant?.id || "N/A",
        name: product?.name || "Luxury Apparel",
        quantity: item.quantity,
        price: Number(item.price),
        weight: itemWeight,
      };
    });

    // Check customer info
    const customer = sale.Customer;
    if (!customer) {
      return { success: false, error: "No customer details linked to this sale." };
    }

    // Get shipping address details
    // Format street address from customer address if code properties are in sale record
    const streetAddress = customer.address || "No Address Provided";

    console.log("[dispatchOrderToSpeedafAction] sale data:", JSON.stringify({
      id: sale.id,
      orderNumber: sale.orderNumber,
      deliveryProvinceCode: sale.deliveryProvinceCode,
      deliveryProvinceName: sale.deliveryProvinceName,
      deliveryCityCode: sale.deliveryCityCode,
      deliveryCityName: sale.deliveryCityName,
      deliveryDistrictCode: sale.deliveryDistrictCode,
      deliveryDistrictName: sale.deliveryDistrictName,
      customer: {
        name: customer?.name,
        phone: customer?.phone,
        address: customer?.address,
      },
      itemCount: sale.SaleItem.length,
      totalWeight,
    }, null, 2));

    // Call Speedaf API
    const response = await SpeedafService.createWaybill({
      orderNumber: sale.orderNumber,
      receiver: {
        name: customer.name || "Valued Patron",
        phone: customer.phone || "08000000000",
        provinceName: sale.deliveryProvinceName || "",
        cityName: sale.deliveryCityName || "",
        districtName: sale.deliveryDistrictName || "",
        streetAddress,
      },
      items: speedafItems,
      weight: totalWeight || 1.0,
    });

    // Speedaf response contains billCode (Waybill number)
    const waybillNumber = response.billCode;
    if (!waybillNumber) {
      return { success: false, error: "Speedaf response did not contain waybill billCode." };
    }

    // Fetch delivery fee
    const deliveryFee = Number(sale.deliveryFee) || 0;

    // Update database
    await DeliveryQueries.updateSaleWaybill(sale.id, waybillNumber, deliveryFee);

    return {
      success: true,
      waybillNumber,
      alreadyDispatched: false,
    };
  } catch (error: any) {
    console.error("[dispatchOrderToSpeedafAction] error:", error);
    return { success: false, error: error.message || "Failed to dispatch waybill to Speedaf." };
  }
}

/**
 * Server Action: Get global Speedaf configuration settings
 */
export async function getSpeedafSettingsAction() {
  try {
    const settings = await DeliveryQueries.getSpeedafSettings();
    return { success: true, data: settings };
  } catch (error: any) {
    console.error("[getSpeedafSettingsAction] error:", error);
    return { success: false, error: error.message || "Failed to retrieve Speedaf settings." };
  }
}

/**
 * Server Action: Update global Speedaf configuration settings
 */
export async function updateSpeedafSettingsAction(settings: Record<string, string>) {
  try {
    await DeliveryQueries.updateSpeedafSettings(settings);
    return { success: true };
  } catch (error: any) {
    console.error("[updateSpeedafSettingsAction] error:", error);
    return { success: false, error: error.message || "Failed to save Speedaf settings." };
  }
}

/**
 * Server Action: Get all store orders with logistics details
 */
export async function getLogisticsSalesAction() {
  try {
    const sales = await DeliveryQueries.getLogisticsSales();
    return { success: true, data: JSON.parse(JSON.stringify(sales)) };
  } catch (error: any) {
    console.error("[getLogisticsSalesAction] error:", error);
    return { success: false, error: error.message || "Failed to load logistics orders." };
  }
}

/**
 * Server Action: Cancel a Speedaf waybill/order
 */
export async function cancelWaybillAction(saleId: string, reason: string) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      select: { waybillNumber: true },
    });

    if (!sale || !sale.waybillNumber) {
      return { success: false, error: "Order or waybill number not found." };
    }

    await SpeedafService.cancelWaybill(sale.waybillNumber, reason);

    // Update DB status
    await prisma.sale.update({
      where: { id: saleId },
      data: {
        deliveryStatus: "CANCELLED",
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("[cancelWaybillAction] error:", error);
    return { success: false, error: error.message || "Failed to cancel waybill." };
  }
}

/**
 * Server Action: Get live tracking events for an order from Speedaf
 */
export async function getOrderTrackingAction(orderId: string) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: orderId },
      select: { waybillNumber: true, deliveryStatus: true, deliveryHistory: true },
    });

    if (!sale) {
      return { success: false, error: "Order not found." };
    }

    if (!sale.waybillNumber) {
      return {
        success: true,
        data: {
          waybillNumber: null,
          status: sale.deliveryStatus || "Processing Shipment",
          events: [],
        },
      };
    }

    // Fetch live tracking from Speedaf
    let events: any[] = [];
    let latestStatus: string | null = null;

    try {
      const trackData = await SpeedafService.trackShipment(sale.waybillNumber);

      // Speedaf returns scan logs in a trajectoryList or similar field
      const trajectoryList =
        trackData?.trajectoryList ??
        trackData?.traceList ??
        trackData?.scanList ??
        (Array.isArray(trackData) ? trackData : null);

      if (Array.isArray(trajectoryList) && trajectoryList.length > 0) {
        events = trajectoryList.map((scan: any) => ({
          time: scan.scanTime || scan.time || scan.operateTime || "",
          status: scan.scanDesc || scan.desc || scan.status || scan.scanType || "",
          location: scan.location || scan.city || scan.scanCity || "",
        }));

        // Determine the latest status from the most recent scan
        const latestScan = events[0];
        latestStatus = latestScan?.status || null;
      }

      // Persist delivery history into DB for caching
      if (events.length > 0) {
        await prisma.sale.update({
          where: { id: orderId },
          data: {
            deliveryHistory: events as any,
            ...(latestStatus ? { deliveryStatus: latestStatus } : {}),
          },
        });
      }
    } catch (trackErr: any) {
      console.warn("[getOrderTrackingAction] Speedaf tracking fetch failed, using cached:", trackErr.message);
      // Fall back to cached history stored in DB
      if (Array.isArray(sale.deliveryHistory)) {
        events = sale.deliveryHistory as any[];
      }
    }

    return {
      success: true,
      data: {
        waybillNumber: sale.waybillNumber,
        status: latestStatus || sale.deliveryStatus || "Processing Shipment",
        events,
      },
    };
  } catch (error: any) {
    console.error("[getOrderTrackingAction] error:", error);
    return { success: false, error: error.message || "Failed to fetch tracking." };
  }
}

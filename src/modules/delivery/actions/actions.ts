"use server";

import { SpeedafService, SpeedafItem } from "../services/speedaf.service";
import { DeliveryQueries } from "../queries/delivery.queries";

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
      
      // Resolve weight: Variant weight > Product weight > Category weight fallback > Default 0.5kg
      let itemWeight = Number((variant as any)?.weight) || Number((product as any)?.weight);
      if (!itemWeight && product?.categories && Array.isArray(product.categories)) {
        const catWeights = product.categories
          .map((c: any) => Number(c.weight))
          .filter((w: number) => !Number.isNaN(w) && w > 0);
        if (catWeights.length > 0) {
          itemWeight = Math.max(...catWeights);
        }
      }
      if (!itemWeight) {
        itemWeight = 0.5; // fallback default
      }

      totalWeight += itemWeight * item.quantity;

      return {
        sku: variant?.sku || variant?.id || "N/A",
        name: product?.name || "Luxury Apparel",
        quantity: item.quantity,
        price: Number(item.price),
        weight: itemWeight,
      };
    });

    // Enforce Speedaf's maximum weight limit per waybill (10kg)
    if (totalWeight > 10.0) {
      return {
        success: false,
        error: `This order's total weight (${totalWeight.toFixed(2)}kg) exceeds Speedaf's maximum single waybill weight limit of 10.0kg. Please split this order or reduce item quantities.`,
      };
    }

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
 *
 * Per Speedaf docs: cancellation is only possible BEFORE the parcel is picked up.
 * Once status is "1" (Picked) or beyond, cancellation must be handled offline with Speedaf.
 */
export async function cancelWaybillAction(saleId: string, reason: string) {
  try {
    const sale = await DeliveryQueries.getSaleWaybillNumber(saleId);

    if (!sale || !sale.waybillNumber) {
      return { success: false, error: "Order or waybill number not found." };
    }

    // Guard: Speedaf docs say cancellation is only valid BEFORE local pickup.
    // Status codes ≥ "1" mean the courier has already collected the parcel.
    const nonCancellableStatuses = ["1", "2", "3", "4", "5", "16", "18", "DELIVERED", "COMPLETED"];
    if (sale.deliveryStatus && nonCancellableStatuses.includes(sale.deliveryStatus)) {
      return {
        success: false,
        error: `Cannot cancel — the parcel has already been collected by Speedaf courier (status: ${sale.deliveryStatus}). Please contact Speedaf directly.`,
      };
    }

    await SpeedafService.cancelWaybill(sale.waybillNumber, reason);

    // Update DB status
    await DeliveryQueries.updateSaleDeliveryStatusById(saleId, "CANCELLED");

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
    const sale = await DeliveryQueries.getSaleTrackingInfo(orderId);

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
      // trackShipment now returns the `tracks` array directly (per Speedaf docs)
      const tracksArray = await SpeedafService.trackShipment(sale.waybillNumber);

      if (Array.isArray(tracksArray) && tracksArray.length > 0) {
        events = tracksArray.map((scan: any) => ({
          // Confirmed Speedaf field names from documentation:
          time: scan.time || scan.scanTime || scan.operateTime || "",
          status: scan.msgEng || scan.actionName || scan.message || scan.msgLoc || "",
          location: scan.optName || scan.location || scan.city || "",
          action: scan.action || "",
          pictureUrl: scan.pictureUrl || null,
        }));

        // Most recent scan is first — derive latest status from it
        const latestScan = tracksArray[0];
        latestStatus = latestScan?.msgEng || latestScan?.actionName || null;
      }

      // Persist delivery history into DB for caching
      if (events.length > 0) {
        await DeliveryQueries.updateSaleTrackingCache(orderId, {
          deliveryHistory: events as any,
          ...(latestStatus ? { deliveryStatus: latestStatus } : {}),
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

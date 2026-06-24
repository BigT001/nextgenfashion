import { createRequestEnvelope, decryptPayload, generateSignature } from "@/lib/speedaf/crypto";
import { DeliveryQueries } from "../queries/delivery.queries";
import nigeriaAreaTree from "../assets/nigeria_area_tree.json";

export interface SpeedafAddress {
  name?: string;
  phone?: string;
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
  districtCode: string;
  districtName: string;
  address?: string;
}

export interface SpeedafItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  weight?: number;
}

export class SpeedafService {
  /**
   * Helper to execute a POST request to Speedaf APIs.
   * Signs and encrypts payload, then decrypts the response.
   */
  private static async postSpeedaf(endpoint: string, payload: any, encrypted = false) {
    const settings = await DeliveryQueries.getSpeedafSettings();
    if (!settings.enabled) {
      throw new Error("Speedaf integration is currently disabled in settings.");
    }

    const baseUrl = settings.uatMode
      ? "https://uat-api.speedaf.com"
      : "https://apis.speedaf.com";
    const timestamp = Date.now().toString();
    const url = `${baseUrl}${endpoint}?appCode=${settings.appCode}&timestamp=${timestamp}`;

    let requestBody: string;
    if (encrypted) {
      requestBody = createRequestEnvelope(payload, settings.secretKey, timestamp);
    } else {
      const dataStr = typeof payload === "string" ? payload : JSON.stringify(payload);
      const sign = generateSignature(timestamp, settings.secretKey, dataStr);
      requestBody = JSON.stringify({
        data: dataStr,
        sign,
      });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(`Speedaf API responded with HTTP status ${response.status}`);
    }

    const responseText = await response.text();

    // 1. Try parsing as a plain JSON object first (common in UAT/test mode)
    try {
      const parsed = JSON.parse(responseText);
      if (parsed && typeof parsed === "object") {
        // If 'data' is a string, first try to decrypt it (production mode),
        // then fall back to plain JSON.parse (UAT/sandbox mode)
        if (parsed.data && typeof parsed.data === "string") {
          // Try decryption first
          try {
            const decryptedData = decryptPayload(parsed.data, settings.secretKey);
            if (decryptedData) {
              return {
                ...parsed,
                data: JSON.parse(decryptedData),
              };
            }
          } catch (e) {
            // Decryption failed — not an encrypted payload
          }
          // Try plain JSON.parse (UAT returns data as a JSON string literal)
          try {
            const parsedData = JSON.parse(parsed.data);
            return {
              ...parsed,
              data: parsedData,
            };
          } catch (e) {
            // Not valid JSON either — keep data as-is (raw string)
          }
        }
        return parsed;
      }
    } catch (jsonErr) {
      // 2. If it's not valid JSON, it might be a fully encrypted string
      try {
        const decrypted = decryptPayload(responseText.trim(), settings.secretKey);
        if (decrypted) {
          return JSON.parse(decrypted);
        }
      } catch (decryptErr) {
        // Ignore decryption errors and fall through
      }
    }

    return responseText;
  }

  /**
   * Fetches the entire location tree for Nigeria from the cached asset.
   */
  static async fetchLocationTree() {
    return nigeriaAreaTree;
  }



  /**
   * Helper to calculate a realistic mock shipping fee when in UAT sandbox mode,
   * since the Speedaf sandbox API always returns a flat 10 or 11 NGN.
   */
  static calculateMockTariff(provinceName: string, weight: number): number {
    const normName = (provinceName || "").toLowerCase().trim();
    
    // Default base rates (base weight is up to 1.0kg)
    let baseRate = 3500;
    let perKgRate = 800;

    if (normName === "lagos") {
      baseRate = 1500;
      perKgRate = 400;
    } else if (
      normName.includes("abuja") || 
      normName.includes("federal capital territory") || 
      normName.includes("fct") ||
      normName === "oyo" || 
      normName === "ogun" || 
      normName === "osun" || 
      normName === "ondo" || 
      normName === "ekiti"
    ) {
      // South-West regional and FCT
      baseRate = 2500;
      perKgRate = 600;
    } else if (
      normName === "plateau" ||
      normName === "kano" ||
      normName === "kaduna" ||
      normName === "rivers" ||
      normName === "enugu" ||
      normName === "anambra" ||
      normName === "delta" ||
      normName === "edo"
    ) {
      // Major shipping hubs and Plateau
      baseRate = 3500;
      perKgRate = 800;
    } else {
      // Far North and remote states
      baseRate = 4500;
      perKgRate = 1000;
    }

    const excessWeight = Math.max(0, weight - 1.0);
    const totalFee = baseRate + Math.ceil(excessWeight) * perKgRate;
    return totalFee;
  }

  /**
   * Calculates the delivery tariff for a package.
   */
  static async calculateTariff(params: {
    receiverProvinceCode: string;
    receiverCityCode: string;
    receiverAreaCode: string;
    weight: number;
  }) {
    const settings = await DeliveryQueries.getSpeedafSettings();
    
    if (settings.uatMode) {
      // UAT sandbox returns a flat 10/11 NGN. To simulate dynamic rates for checkout,
      // we calculate a realistic mock fee based on the receiver's province.
      const province = (nigeriaAreaTree as any).children?.find(
        (p: any) => p.code === params.receiverProvinceCode
      );
      const provinceName = province ? (province.enName || province.name) : "";
      const fee = this.calculateMockTariff(provinceName, params.weight);
      return {
        fee,
        currencyCode: "NGN",
        isMock: true,
      };
    }

    // Construct sender warehouse codes (either configured or default to Lagos head office)
    const payload = {
      sendCountryCode: "NG",
      sendProvinceCode: settings.senderProvince || "NGR00030", // default Lagos
      sendCityCode: settings.senderCity || "NGC00464",         // default Ikeja
      sendAreaCode: settings.senderDistrict || "NGA01180",     // default Allen
      deliveryCountryCode: "NG",
      deliveryProvinceCode: params.receiverProvinceCode,
      deliveryCityCode: params.receiverCityCode,
      deliveryAreaCode: params.receiverAreaCode,
      pickedTime: Date.now(),
      productCode: "1",   // Express
      subjectCode: "101", // Delivery Fee
      weight: params.weight.toString(),
    };

    const response = await this.postSpeedaf("/open-api/fee/getFee", payload);
    if (response.success && Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    }

    const errorMessage = response.error?.message || response.message || "Failed to calculate tariff from Speedaf API.";
    throw new Error(errorMessage);
  }

  /**
   * Places an order and generates a Waybill (Tracking code).
   */
  static async createWaybill(params: {
    orderNumber: string;
    receiver: {
      name: string;
      phone: string;
      provinceName: string;
      cityName: string;
      districtName: string;
      streetAddress: string;
    };
    items: SpeedafItem[];
    weight: number;
  }) {
    const settings = await DeliveryQueries.getSpeedafSettings();

    // Resolve sender address names from codes if they are formatted as codes
    const tree = nigeriaAreaTree as any;
    let sendProvinceName = settings.senderProvince || "Lagos";
    let sendCityName = settings.senderCity || "Ikeja";
    let sendDistrictName = settings.senderDistrict || "Allen";

    if (settings.senderProvince && settings.senderProvince.startsWith("NG")) {
      const province = tree.children?.find((p: any) => p.code === settings.senderProvince);
      if (province) {
        sendProvinceName = province.enName || province.name;
        
        if (settings.senderCity && settings.senderCity.startsWith("NG")) {
          const city = province.children?.find((c: any) => c.code === settings.senderCity);
          if (city) {
            sendCityName = city.enName || city.name;
            
            if (settings.senderDistrict && settings.senderDistrict.startsWith("NG")) {
              const district = city.children?.find((d: any) => d.code === settings.senderDistrict);
              if (district) {
                sendDistrictName = district.enName || district.name;
              }
            }
          }
        }
      }
    }

    const totalQty = params.items.reduce((acc, curr) => acc + curr.quantity, 0);

    const payload = {
      customerCode: settings.customerCode || settings.appCode, // Speedaf merchant customer code
      platformSource: settings.platformSource || "csp",
      parcelType: "PT01",             // Express
      deliveryType: "DE01",           // Door Delivery
      transportType: "TT02",          // Air
      shipType: "ST01",               // Standard Express
      payMethod: "PA02",              // Monthly Merchant Billing
      acceptName: params.receiver.name,
      acceptMobile: params.receiver.phone,
      acceptAddress: params.receiver.streetAddress,
      acceptCountryCode: "NG",
      acceptProvinceName: params.receiver.provinceName,
      acceptCityName: params.receiver.cityName,
      acceptDistrictName: params.receiver.districtName,
      sendName: settings.senderName || "NextGen Fashion Store",
      sendMobile: settings.senderPhone || "08000000000",
      sendAddress: settings.senderAddress || "Lagos Warehouse",
      sendCountryCode: "NG",
      sendProvinceName,
      sendCityName,
      sendDistrictName,
      parcelWeight: params.weight,
      piece: 1,
      goodsQTY: totalQty,
      itemList: params.items.map((item) => ({
        sku: item.sku,
        goodsName: item.name,
        goodsQTY: item.quantity,
        goodsValue: item.price,
        currencyType: "NGN",
        goodsWeight: item.weight || 0.5,
        goodsType: "IT01",
        blInsure: 0,
        battery: 0,
      })),
    };

    console.log("[SpeedafService.createWaybill] sending payload:", JSON.stringify(payload, null, 2));
    const response = await this.postSpeedaf("/open-api/express/order/createOrder", payload);
    console.log("[SpeedafService.createWaybill] raw response:", JSON.stringify(response, null, 2));

    // Speedaf API success: top-level code is "0" or "200", or response.success === true
    // The billCode might be at response.data.billCode or response.data.data.billCode
    const isSuccess =
      response.success === true ||
      response.code === "0" ||
      response.code === 0 ||
      response.code === "200" ||
      (response.data && (response.data.success === true || response.data.code === "0" || response.data.code === 0));

    if (isSuccess) {
      // Unwrap nested data if needed
      const resultData = response.data?.data ?? response.data ?? response;
      if (resultData?.billCode) {
        return resultData;
      }
      // Sometimes Speedaf wraps in another level
      if (response.data?.billCode) {
        return response.data;
      }
    }

    // Extract the deepest error message available
    const errorMsg =
      response.data?.message ||
      response.data?.msg ||
      response.data?.errorMsg ||
      response.message ||
      response.msg ||
      (typeof response === "string" ? response : null) ||
      "Failed to create waybill from Speedaf API.";

    console.error("[SpeedafService.createWaybill] FAILED. Full response:", JSON.stringify(response, null, 2));
    throw new Error(errorMsg);
  }


  /**
   * Cancels a waybill order with Speedaf.
   *
   * CONFIRMED via live API testing:
   *  - Field "customerCode" is required (the merchant's appCode)
   *  - Field "cancelReason" is required (a numeric string code e.g. "01")
   *  - "reasonCode", "cancelReasonCode", "reason_code" are all IGNORED by Speedaf
   */
  static async cancelWaybill(waybillNumber: string, reason: string) {
    const settings = await DeliveryQueries.getSpeedafSettings();

    // Per official docs: cancelReason is a FREE-TEXT STRING, not a numeric code.
    // e.g. "Customer cancels shipment", "Wrong address", etc.
    const payload = [
      {
        billCode: waybillNumber,
        customerCode: settings.customerCode || settings.appCode,
        cancelReason: reason || "Customer request",
        cancelBy: "NextGen Fashion Admin",
      },
    ];

    console.log("[SpeedafService.cancelWaybill] Sending payload:", JSON.stringify(payload));

    const response = await this.postSpeedaf("/open-api/express/order/cancelOrder", payload);

    console.log("[SpeedafService.cancelWaybill] Raw response:", JSON.stringify(response, null, 2));

    if (response.success === true) {
      // Speedaf returns data as a JSON string: "[{\"billCode\":\"...\",\"success\":true}]"
      let parsedData: any = response.data;
      if (typeof response.data === "string") {
        try {
          parsedData = JSON.parse(response.data);
        } catch {
          // keep as raw string if unparseable
        }
      }
      // Confirm item-level success
      if (Array.isArray(parsedData) && parsedData[0]?.success === false) {
        const itemError = parsedData[0].message || parsedData[0].msg || "Speedaf rejected the cancellation.";
        console.error("[SpeedafService.cancelWaybill] Item-level failure:", itemError);
        throw new Error(itemError);
      }
      return parsedData;
    }

    const errorMsg =
      response.error?.message ||
      response.data?.message ||
      response.data?.msg ||
      response.message ||
      response.msg ||
      "Failed to cancel waybill from Speedaf API.";

    console.error("[SpeedafService.cancelWaybill] FAILED. Full response:", JSON.stringify(response, null, 2));
    throw new Error(errorMsg);
  }

  /**
   * Fetches the live shipment tracking timeline for a waybill number.
   *
   * CONFIRMED from Speedaf docs:
   *  - Endpoint: /open-api/express/track/query
   *  - Request: { mailNoList: ["waybill_number"] }  (application/json, no encryption needed)
   *  - Response: [{ mailNo, tracks: [{ action, actionName, msgEng, msgLoc, time, timezone, pictureUrl }] }]
   */
  static async trackShipment(waybillNumber: string) {
    const payload = {
      mailNoList: [waybillNumber],
    };

    try {
      const response = await this.postSpeedaf("/open-api/express/track/query", payload);

      // Response is an array of waybill objects, each with a `tracks` array
      let resultList: any[] = [];
      if (Array.isArray(response)) {
        resultList = response;
      } else if (response?.success && Array.isArray(response?.data)) {
        resultList = response.data;
      } else if (response?.data) {
        // Sometimes wrapped: data is the array itself
        resultList = Array.isArray(response.data) ? response.data : [response.data];
      }

      const waybillResult = resultList.find((r: any) => r.mailNo === waybillNumber) ?? resultList[0];
      if (waybillResult?.tracks) {
        return waybillResult.tracks;
      }

      console.warn("[trackShipment] No tracks found in response, falling back:", JSON.stringify(response));
    } catch (err) {
      console.warn("[trackShipment] /open-api/express/track/query failed, trying fallback:", err);
    }

    // Fallback: queryOrder for basic status
    try {
      const altPayload = { billCode: waybillNumber };
      const altResponse = await this.postSpeedaf("/open-api/express/order/queryOrder", altPayload);
      if (altResponse && (altResponse.success || altResponse.code === "0" || altResponse.code === 0)) {
        const data = Array.isArray(altResponse.data) ? altResponse.data[0] : altResponse.data;
        // Wrap single status into a tracks-compatible array
        if (data) {
          return [{
            action: data.status || data.orderStatus || "",
            actionName: data.statusName || data.orderStatusName || "In Transit",
            msgEng: data.statusName || data.remark || "Shipment in transit",
            time: data.updateTime || data.createTime || "",
            timezone: 1,
          }];
        }
      }
    } catch (err) {
      console.warn("[trackShipment] /open-api/express/order/queryOrder fallback failed:", err);
    }

    throw new Error("Failed to fetch tracking info from Speedaf API.");
  }
}

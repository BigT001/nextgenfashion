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
   * Resolves the Speedaf Zone (1 to 4) for a given Nigerian state/province name.
   */
  static getZoneForProvince(provinceName: string): number {
    const norm = (provinceName || "").toLowerCase().trim();
    if (norm.includes("lagos")) {
      return 1;
    }
    
    // Zone 2: South West & Kwara
    const zone2Keywords = ["ogun", "ondo", "ekiti", "oyo", "osun", "kwara"];
    if (zone2Keywords.some((keyword) => norm.includes(keyword))) {
      return 2;
    }
    
    // Zone 3: South East, South South, Abuja (FCT)
    const zone3Keywords = [
      "abia", "anambra", "ebonyi", "enugu", "imo",
      "akwa ibom", "bayelsa", "cross river", "delta", "edo", "rivers",
      "abuja", "federal capital territory", "fct"
    ];
    if (zone3Keywords.some((keyword) => norm.includes(keyword))) {
      return 3;
    }
    
    // Zone 4: All Northern Cities (default fallback)
    return 4;
  }

  /**
   * Helper to calculate a realistic mock shipping fee when in UAT sandbox mode,
   * since the Speedaf sandbox API always returns a flat 10 or 11 NGN.
   * Matches the official Speedaf Rate Matrix.
   */
  static calculateMockTariff(provinceName: string, weight: number): number {
    const zone = this.getZoneForProvince(provinceName);
    
    // Clamp minimum weight to 0.5kg
    const w = Math.max(0.5, weight);
    
    // Rate lists where index is Math.ceil(weight * 2) - 1
    const zone1Rates = [
      2494.4, 2992.8, 3242.4, 3492.0, 3740.8, 4240.0, 4489.6, 4747.2, 4996.8, 5495.2,
      5994.4, 6244.0, 6492.8, 6992.0, 7241.6, 7490.4, 7989.6, 8239.2, 8488.0, 8987.2
    ];
    
    const zone2Rates = [
      4092.3, 4383.0, 4963.5, 5253.3, 5553.9, 5843.7, 6424.2, 6714.9, 7014.6, 7304.4,
      8175.6, 8465.4, 8766.0, 9346.5, 9636.3, 9927.0, 10516.5, 10807.2, 11097.0, 11387.7
    ];
    
    const zone3Rates = [
      5476.5, 5776.2, 6085.8, 6695.1, 6994.8, 7304.4, 7605.0, 8214.3, 8514.0, 8823.6,
      10516.5, 10845.9, 11174.4, 11832.3, 12161.7, 12490.2, 12819.6, 13467.6, 13797.0, 14125.5
    ];
    
    const zone4Rates = [
      6695.1, 6994.8, 7304.4, 7605.0, 8214.3, 8514.0, 8823.6, 9123.3, 9733.5, 10043.1,
      11832.3, 12161.7, 12490.2, 12819.6, 13467.6, 13797.0, 14125.5, 14783.4, 15112.8, 15441.3
    ];
    
    let rates = zone1Rates;
    if (zone === 2) rates = zone2Rates;
    else if (zone === 3) rates = zone3Rates;
    else if (zone === 4) rates = zone4Rates;
    
    // Splitting logic for weights exceeding 10.0kg (maximum weight per waybill is 10kg)
    if (w <= 10.0) {
      const index = Math.min(19, Math.max(0, Math.ceil(w * 2) - 1));
      return rates[index];
    } else {
      let total = 0;
      let remaining = w;
      while (remaining > 10.0) {
        total += rates[19]; // 10.0kg rate
        remaining -= 10.0;
      }
      if (remaining > 0) {
        const index = Math.min(19, Math.max(0, Math.ceil(remaining * 2) - 1));
        total += rates[index];
      }
      return total;
    }
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

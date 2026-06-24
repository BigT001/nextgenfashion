import { prisma } from "@/services/prisma.service";
import { Prisma } from "@prisma/client";

export class DeliveryQueries {
  static async getSpeedafSettings() {
    const keys = [
      "speedafEnabled",
      "speedafUatMode",
      "speedafAppCode",
      "speedafSecretKey",
      "speedafCustomerCode",
      "speedafPlatformSource",
      "speedafSenderName",
      "speedafSenderPhone",
      "speedafSenderCountry",
      "speedafSenderProvince",
      "speedafSenderCity",
      "speedafSenderDistrict",
      "speedafSenderAddress",
    ];

    const dbSettings = await prisma.settings.findMany({
      where: {
        key: { in: keys },
      },
    });

    const settingsMap = dbSettings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      enabled: settingsMap["speedafEnabled"] !== undefined 
        ? settingsMap["speedafEnabled"] === "true" 
        : process.env.SPEEDAF_ENABLED === "true",
      uatMode: settingsMap["speedafUatMode"] !== undefined 
        ? settingsMap["speedafUatMode"] !== "false" 
        : process.env.SPEEDAF_UAT_MODE !== "false",
      appCode: settingsMap["speedafAppCode"] || process.env.SPEEDAF_APP_CODE || "",
      secretKey: settingsMap["speedafSecretKey"] || process.env.SPEEDAF_SECRET_KEY || "",
      customerCode: settingsMap["speedafCustomerCode"] || process.env.SPEEDAF_CUSTOMER_CODE || "",
      platformSource: settingsMap["speedafPlatformSource"] || process.env.SPEEDAF_PLATFORM_SOURCE || "TEST 345",
      senderName: settingsMap["speedafSenderName"] || process.env.SPEEDAF_SENDER_NAME || "",
      senderPhone: settingsMap["speedafSenderPhone"] || process.env.SPEEDAF_SENDER_PHONE || "",
      senderCountry: settingsMap["speedafSenderCountry"] || process.env.SPEEDAF_SENDER_COUNTRY || "NG",
      senderProvince: settingsMap["speedafSenderProvince"] || process.env.SPEEDAF_SENDER_PROVINCE || "",
      senderCity: settingsMap["speedafSenderCity"] || process.env.SPEEDAF_SENDER_CITY || "",
      senderDistrict: settingsMap["speedafSenderDistrict"] || process.env.SPEEDAF_SENDER_DISTRICT || "",
      senderAddress: settingsMap["speedafSenderAddress"] || process.env.SPEEDAF_SENDER_ADDRESS || "",
    };
  }

  static async updateSpeedafSettings(settings: Record<string, string>) {
    const ops = Object.entries(settings).map(([key, value]) => {
      return prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    });
    return await prisma.$transaction(ops);
  }

  static async findSaleForSpeedaf(saleId: string) {
    return await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        Customer: true,
        SaleItem: {
          include: {
            ProductVariant: {
              include: {
                Product: {
                  include: {
                    categories: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  static async findSaleByWaybill(waybillNumber: string) {
    return await prisma.sale.findUnique({
      where: { waybillNumber },
    });
  }

  static async updateSaleWaybill(saleId: string, waybillNumber: string, deliveryFee: number) {
    return await prisma.sale.update({
      where: { id: saleId },
      data: {
        waybillNumber,
        deliveryFee,
        deliveryStatus: "ORDER_CREATED",
        status: "PROCESSING",
      },
    });
  }

  static async updateSaleDeliveryStatus(
    waybillNumber: string,
    status: string,
    historyLog: any
  ) {
    const sale = await prisma.sale.findUnique({
      where: { waybillNumber },
      select: { deliveryHistory: true },
    });

    let currentHistory: any[] = [];
    if (sale?.deliveryHistory) {
      if (Array.isArray(sale.deliveryHistory)) {
        currentHistory = sale.deliveryHistory as any[];
      } else {
        currentHistory = [sale.deliveryHistory];
      }
    }

    currentHistory.push(historyLog);

    const saleStatusUpdate: Prisma.SaleUpdateInput = {
      deliveryStatus: status,
      deliveryHistory: currentHistory,
    };

    if (status === "200" || status === "DELIVERED") {
      saleStatusUpdate.status = "COMPLETED";
    }

    return await prisma.sale.update({
      where: { waybillNumber },
      data: saleStatusUpdate,
    });
  }

  static async updateSaleDeliveryAddressCodes(
    saleId: string,
    codes: {
      deliveryProvinceCode: string;
      deliveryProvinceName: string;
      deliveryCityCode: string;
      deliveryCityName: string;
      deliveryDistrictCode: string;
      deliveryDistrictName: string;
      deliveryFee?: number;
    }
  ) {
    return await prisma.sale.update({
      where: { id: saleId },
      data: codes,
    });
  }

  static async getLogisticsSales() {
    return await prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        Customer: true,
        SaleItem: {
          include: {
            ProductVariant: {
              include: {
                Product: true,
              },
            },
          },
        },
      },
    });
  }

  static async getSaleWaybillNumber(saleId: string) {
    return await prisma.sale.findUnique({
      where: { id: saleId },
      select: { waybillNumber: true, deliveryStatus: true },
    });
  }

  static async updateSaleDeliveryStatusById(saleId: string, deliveryStatus: string) {
    return await prisma.sale.update({
      where: { id: saleId },
      data: {
        deliveryStatus,
      },
    });
  }

  static async getSaleTrackingInfo(orderId: string) {
    return await prisma.sale.findUnique({
      where: { id: orderId },
      select: { waybillNumber: true, deliveryStatus: true, deliveryHistory: true },
    });
  }

  static async updateSaleTrackingCache(
    orderId: string,
    data: {
      deliveryHistory: any;
      deliveryStatus?: string;
    }
  ) {
    return await prisma.sale.update({
      where: { id: orderId },
      data,
    });
  }
}

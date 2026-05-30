"use server";

import { prisma } from "@/services/prisma.service";

const PRODUCT_PRICE_REQUIREMENT_KEY = "productPriceFieldsRequired";

export async function getProductPriceRequirementSetting() {
  const setting = await prisma.settings.findUnique({
    where: { key: PRODUCT_PRICE_REQUIREMENT_KEY },
  });

  if (!setting) {
    return true;
  }

  return setting.value === "true";
}

export async function setProductPriceRequirementSetting(value: boolean) {
  const setting = await prisma.settings.upsert({
    where: { key: PRODUCT_PRICE_REQUIREMENT_KEY },
    update: {
      value: value ? "true" : "false",
      description: "Require cost and selling price during product creation.",
      dataType: "boolean",
    },
    create: {
      key: PRODUCT_PRICE_REQUIREMENT_KEY,
      value: value ? "true" : "false",
      description: "Require cost and selling price during product creation.",
      dataType: "boolean",
    },
  });

  return { success: true, value: setting.value === "true" };
}

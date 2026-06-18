"use server";

import { prisma } from "@/services/prisma.service";

const PRODUCT_PRICE_REQUIREMENT_KEY = "productPriceFieldsRequired";
const AUTO_VAT_ENABLED_KEY = "autoVatEnabled";

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

export async function getAutoVatSetting() {
  const setting = await prisma.settings.findUnique({
    where: { key: AUTO_VAT_ENABLED_KEY },
  });

  if (!setting) {
    return false;
  }

  return setting.value === "true";
}

export async function setAutoVatSetting(value: boolean) {
  const setting = await prisma.settings.upsert({
    where: { key: AUTO_VAT_ENABLED_KEY },
    update: {
      value: value ? "true" : "false",
      description: "Automatically add 7.5% VAT to all product prices visible to customers.",
      dataType: "boolean",
    },
    create: {
      key: AUTO_VAT_ENABLED_KEY,
      value: value ? "true" : "false",
      description: "Automatically add 7.5% VAT to all product prices visible to customers.",
      dataType: "boolean",
    },
  });

  return { success: true, value: setting.value === "true" };
}

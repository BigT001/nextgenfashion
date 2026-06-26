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

const META_PIXEL_ID_KEY = "metaPixelId";
const META_CAPI_TOKEN_KEY = "metaConversionsApiToken";
const META_TRACKING_ENABLED_KEY = "metaTrackingEnabled";

export async function getMetaPixelIdSetting() {
  const setting = await prisma.settings.findUnique({
    where: { key: META_PIXEL_ID_KEY },
  });
  return setting ? setting.value : "";
}

export async function setMetaPixelIdSetting(value: string) {
  const setting = await prisma.settings.upsert({
    where: { key: META_PIXEL_ID_KEY },
    update: {
      value: value.trim(),
      description: "Meta (Facebook) Pixel ID for client-side event tracking.",
      dataType: "string",
    },
    create: {
      key: META_PIXEL_ID_KEY,
      value: value.trim(),
      description: "Meta (Facebook) Pixel ID for client-side event tracking.",
      dataType: "string",
    },
  });
  return { success: true, value: setting.value };
}

export async function getMetaConversionsApiTokenSetting() {
  const setting = await prisma.settings.findUnique({
    where: { key: META_CAPI_TOKEN_KEY },
  });
  return setting ? setting.value : "";
}

export async function setMetaConversionsApiTokenSetting(value: string) {
  const setting = await prisma.settings.upsert({
    where: { key: META_CAPI_TOKEN_KEY },
    update: {
      value: value.trim(),
      description: "Meta Conversions API (CAPI) Access Token for server-side event tracking.",
      dataType: "string",
    },
    create: {
      key: META_CAPI_TOKEN_KEY,
      value: value.trim(),
      description: "Meta Conversions API (CAPI) Access Token for server-side event tracking.",
      dataType: "string",
    },
  });
  return { success: true, value: setting.value };
}

export async function getMetaTrackingEnabledSetting() {
  const setting = await prisma.settings.findUnique({
    where: { key: META_TRACKING_ENABLED_KEY },
  });
  return setting ? setting.value === "true" : false;
}

export async function setMetaTrackingEnabledSetting(value: boolean) {
  const setting = await prisma.settings.upsert({
    where: { key: META_TRACKING_ENABLED_KEY },
    update: {
      value: value ? "true" : "false",
      description: "Toggle Meta Pixel and Conversions API tracking on or off.",
      dataType: "boolean",
    },
    create: {
      key: META_TRACKING_ENABLED_KEY,
      value: value ? "true" : "false",
      description: "Toggle Meta Pixel and Conversions API tracking on or off.",
      dataType: "boolean",
    },
  });
  return { success: true, value: setting.value === "true" };
}


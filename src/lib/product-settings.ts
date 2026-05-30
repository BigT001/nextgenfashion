const PRICE_REQUIREMENT_KEY = "nextgen:productPriceFieldsRequired";

export function getProductPriceRequirement(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(PRICE_REQUIREMENT_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

export function setProductPriceRequirement(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PRICE_REQUIREMENT_KEY, value ? "true" : "false");
  } catch {
    // keep app stable if localStorage is unavailable
  }
}

import { logger } from "./logger";

/**
 * Safely track client-side Meta Pixel events.
 */
export function trackPixelEvent(eventName: string, params?: Record<string, any>, options?: { eventID?: string }) {
  let detailedMessage = `User Event - ${eventName}`;
  if (eventName === "AddToCart" && params?.content_name) {
    detailedMessage = `User AddToCart: "${params.content_name}" (${params.currency || "NGN"} ${params.value?.toLocaleString()})`;
  } else if (eventName === "ViewContent" && params?.content_name) {
    detailedMessage = `User ViewContent: "${params.content_name}" (${params.currency || "NGN"} ${params.value?.toLocaleString()})`;
  } else if (eventName === "InitiateCheckout" && params?.value) {
    detailedMessage = `User InitiateCheckout: Cart value ${params.currency || "NGN"} ${params.value?.toLocaleString()}`;
  } else if (eventName === "Purchase" && params?.value) {
    detailedMessage = `User Purchase Success: Order total ${params.currency || "NGN"} ${params.value?.toLocaleString()}`;
  }

  logger.info(detailedMessage, { params, options });

  if (typeof window !== "undefined") {
    const fbq = (window as any).fbq;
    if (fbq) {
      try {
        if (options?.eventID) {
          fbq("track", eventName, params, { eventID: options.eventID });
        } else {
          fbq("track", eventName, params);
        }
      } catch (error) {
        console.error(`[MetaPixel] Failed to track event: ${eventName}`, error);
      }
    }
  }
}

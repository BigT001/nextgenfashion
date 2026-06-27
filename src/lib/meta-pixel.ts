/**
 * Safely track client-side Meta Pixel events.
 */
export function trackPixelEvent(eventName: string, params?: Record<string, any>, options?: { eventID?: string }) {
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

import { useEffect, useRef } from "react";
import { useCartStore } from "../store/cart.store";
import { getCartItemsLatestDetailsAction } from "../actions/cart.actions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export function useCartSync() {
  const { items, updateCartItemsDetails, openCart } = useCartStore();
  const isSyncingRef = useRef(false);
  const lastSyncedRef = useRef<string | null>(null);

  const syncCart = async () => {
    if (items.length === 0 || isSyncingRef.current) return;

    const fingerprint = items.map((it) => `${it.variantId}-${it.price}`).join("|");
    if (lastSyncedRef.current === fingerprint) return;

    isSyncingRef.current = true;
    try {
      const payload = items.map((item) => ({ variantId: item.variantId }));
      const response = await getCartItemsLatestDetailsAction(payload);

      if (response.success && response.data) {
        const details = response.data;
        
        let priceChanged = false;
        let itemsRemoved = false;

        items.forEach((item) => {
          const detail = details.find((d) => d.variantId === item.variantId);
          if (!detail || !detail.isAvailable) {
            itemsRemoved = true;
          } else if (detail.price !== item.price) {
            priceChanged = true;
          }
        });

        updateCartItemsDetails(details);
        lastSyncedRef.current = details.map((d) => `${d.variantId}-${d.price}`).join("|");

        if (itemsRemoved) {
          toast.error("Some items in your cart are no longer available and were removed.");
        } else if (priceChanged) {
          toast.info("Prices for some items in your cart have been updated to match current rates.");
        }
      }
    } catch (error) {
      console.error("[useCartSync] failed to sync cart items details:", error);
    } finally {
      isSyncingRef.current = false;
    }
  };

  useEffect(() => {
    syncCart();

    const handleBeforeUnload = () => {
      const currentItems = useCartStore.getState().items;
      if (currentItems && currentItems.length > 0) {
        const total = currentItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        logger.info(`Shopping Session Ending: Cart Abandoned (Total: ₦${total.toLocaleString()})`, {
          itemsCount: currentItems.length,
          totalAmount: total,
          cartItems: currentItems.map(item => ({
            name: item.name,
            size: item.size,
            color: item.color,
            price: item.price,
            quantity: item.quantity,
            sku: item.variantId
          }))
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (openCart) {
      syncCart();
    }
  }, [openCart]);

  return { syncCart };
}

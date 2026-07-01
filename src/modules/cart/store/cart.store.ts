import { create } from "zustand";
import { persist } from "zustand/middleware";
import { logger } from "@/lib/logger";

export type CartItem = {
  id: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
  availableStock?: number;
  category?: string;
  weight?: number;
};

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  openCart: boolean;
  setOpenCart: (open: boolean) => void;
  updateCartItemsDetails: (details: {
    variantId: string;
    price: number;
    availableStock: number;
    name: string;
    image?: string;
    isAvailable: boolean;
  }[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      openCart: false,
      addItem: (newItem) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.variantId === newItem.variantId);
        const normalizedPrice = Number(newItem.price ?? 0) || 0;
        const itemToAdd = { ...newItem, price: normalizedPrice };

        if (existingItem) {
          const desiredQty = existingItem.quantity + newItem.quantity;
          const cappedQty = existingItem.availableStock ? Math.min(desiredQty, existingItem.availableStock) : desiredQty;
          set({
            items: currentItems.map((item) =>
              item.variantId === newItem.variantId
                ? { ...item, quantity: cappedQty }
                : item
            ),
          });
          logger.info(`Cart Quantity Increased: "${newItem.name}" is now qty ${cappedQty}`, { newItem, totalQty: cappedQty });
        } else {
          set({ items: [...currentItems, itemToAdd] });
          logger.info(`Cart Item Added: "${newItem.name}" (qty ${newItem.quantity})`, { newItem });
        }
      },
      setOpenCart: (open: boolean) => set({ openCart: open }),
      removeItem: (variantId) => {
        const itemToRemove = get().items.find((item) => item.variantId === variantId);
        set({ items: get().items.filter((item) => item.variantId !== variantId) });
        if (itemToRemove) {
          logger.info(`Cart Item Removed: "${itemToRemove.name}"`, { itemToRemove });
        }
      },
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        const itemToUpdate = get().items.find((item) => item.variantId === variantId);
        set({
          items: get().items.map((item) => {
            if (item.variantId !== variantId) return item;
            const max = item.availableStock ?? Infinity;
            const newQty = Math.min(quantity, max);
            return { ...item, quantity: newQty };
          }),
        });
        if (itemToUpdate) {
          logger.info(`Cart Quantity Updated: "${itemToUpdate.name}" set to ${quantity}`, { itemToUpdate, newQuantity: quantity });
        }
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + (Number(item.price) || 0) * item.quantity, 0);
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
      updateCartItemsDetails: (details) => {
        const currentItems = get().items;
        const updatedItems = currentItems
          .map((item): CartItem | null => {
            const detail = details.find((d) => d.variantId === item.variantId);
            if (!detail || !detail.isAvailable) {
              return null;
            }
            const max = detail.availableStock;
            const newQty = Math.min(item.quantity, max);
            return {
              ...item,
              price: detail.price,
              availableStock: detail.availableStock,
              name: detail.name,
              image: detail.image ?? item.image,
              quantity: newQty,
            };
          })
          .filter((item): item is CartItem => item !== null);

        set({ items: updatedItems });
      },
    }),
    {
      name: "nextgen-cart-storage",
    }
  )
);

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
        } else {
          set({ items: [...currentItems, itemToAdd] });
        }
      },
      setOpenCart: (open: boolean) => set({ openCart: open }),
      removeItem: (variantId) => {
        set({ items: get().items.filter((item) => item.variantId !== variantId) });
      },
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((item) => {
            if (item.variantId !== variantId) return item;
            const max = item.availableStock ?? Infinity;
            const newQty = Math.min(quantity, max);
            return { ...item, quantity: newQty };
          }),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + (Number(item.price) || 0) * item.quantity, 0);
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "nextgen-cart-storage",
    }
  )
);

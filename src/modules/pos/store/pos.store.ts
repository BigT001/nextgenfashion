import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  size?: string;
  color?: string;
}

interface POSState {
  cart: CartItem[];
  customerId: string | null;
  discount: number;
  subtotal: number;
  taxRate: number; // e.g., 0.075 for 7.5%
  taxAmount: number;
  total: number;
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  setCustomer: (customerId: string | null) => void;
  setDiscount: (amount: number) => void;
  clearCart: () => void;
  calculateTotals: () => void;
}

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      cart: [],
      customerId: null,
      discount: 0,
      subtotal: 0,
      taxRate: 0.075, // 7.5% VAT (Standard for Nigeria)
      taxAmount: 0,
      total: 0,

      addItem: (item) => {
        const { cart } = get();
        const existingItem = cart.find((i) => i.variantId === item.variantId);

        if (existingItem) {
          set({
            cart: cart.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ cart: [...cart, { ...item, quantity: 1 }] });
        }
        get().calculateTotals();
      },

      removeItem: (variantId) => {
        set({
          cart: get().cart.filter((i) => i.variantId !== variantId),
        });
        get().calculateTotals();
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          cart: get().cart.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        });
        get().calculateTotals();
      },

      setCustomer: (customerId) => set({ customerId }),
      
      setDiscount: (discount) => {
        set({ discount });
        get().calculateTotals();
      },

      clearCart: () => set({ cart: [], customerId: null, discount: 0, subtotal: 0, taxAmount: 0, total: 0 }),

      calculateTotals: () => {
        const { cart, discount, taxRate } = get();
        
        // 1. Calculate Base Subtotal
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        // 2. Calculate Taxable Amount (Subtotal - Discount)
        const taxableAmount = Math.max(0, subtotal - discount);
        
        // 3. Calculate Tax Amount
        const taxAmount = taxableAmount * taxRate;
        
        // 4. Calculate Final Total
        const total = taxableAmount + taxAmount;
        
        set({ subtotal, taxAmount, total });
      },
    }),
    {
      name: "nextgen-pos-storage",
    }
  )
);

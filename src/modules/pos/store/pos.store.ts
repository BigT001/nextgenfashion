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
  discount?: number; // Per-item discount
}

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface POSState {
  cart: CartItem[];
  customer: Customer | null;
  discount: number;
  discountType: "FIXED" | "PERCENTAGE";
  subtotal: number;
  taxRate: number; // e.g., 0.075 for 7.5%
  taxAmount: number;
  total: number;
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity' | 'discount'>) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  updateItemDiscount: (variantId: string, discount: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (amount: number, type?: "FIXED" | "PERCENTAGE") => void;
  setTaxRate: (rate: number) => void;
  clearCart: () => void;
  calculateTotals: () => void;
}

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      cart: [],
      customer: null,
      discount: 0,
      discountType: "FIXED",
      subtotal: 0,
      taxRate: 0.075, // 7.5% VAT
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
          set({ cart: [...cart, { ...item, quantity: 1, discount: 0 }] });
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

      updateItemDiscount: (variantId, discount) => {
        set({
          cart: get().cart.map((i) =>
            i.variantId === variantId ? { ...i, discount: Math.max(0, discount) } : i
          ),
        });
        get().calculateTotals();
      },

      setCustomer: (customer) => set({ customer }),
      
      setDiscount: (discount, type) => {
        set((state) => ({ 
          discount: Math.max(0, discount),
          discountType: type || state.discountType 
        }));
        get().calculateTotals();
      },

      setTaxRate: (taxRate) => {
        set({ taxRate });
        get().calculateTotals();
      },

      clearCart: () => set({ 
        cart: [], 
        customer: null, 
        discount: 0, 
        discountType: "FIXED", 
        subtotal: 0, 
        taxAmount: 0, 
        total: 0 
      }),

      calculateTotals: () => {
        const { cart, discount, discountType, taxRate } = get();
        
        // 1. Calculate Base Subtotal (sum of items * quantity)
        // Note: individual item discounts are subtracted from their respective totals
        const subtotal = cart.reduce((sum, item) => {
          const itemTotal = (item.price * item.quantity) - (item.discount || 0);
          return sum + Math.max(0, itemTotal);
        }, 0);
        
        // 2. Calculate Global Discount
        const globalDiscountAmount = discountType === "PERCENTAGE" 
          ? (subtotal * (discount / 100)) 
          : discount;
        
        // 3. Calculate Taxable Amount (Subtotal - Global Discount)
        const taxableAmount = Math.max(0, subtotal - globalDiscountAmount);
        
        // 4. Calculate Tax Amount
        const taxAmount = taxableAmount * taxRate;
        
        // 5. Calculate Final Total
        const total = taxableAmount + taxAmount;
        
        set({ subtotal, taxAmount, total });
      },
    }),
    {
      name: "nextgen-pos-storage",
    }
  )
);

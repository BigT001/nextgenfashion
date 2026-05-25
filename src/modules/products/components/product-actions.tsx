"use client";

import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, Share2, Minus, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/modules/cart/store/cart.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductActionsProps {
  product: any;
}

export function ProductActions({ product }: ProductActionsProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const [quantity, setQuantity] = useState(1);

  // Normalize sizes: treat OS / One Size as no-size (don't show selector)
  const rawSizes = Array.from(new Set(product.variants.map((v: any) => v.size || "").filter(Boolean))) as string[];
  const sizes = rawSizes.filter((s) => !/^\s*(os|one[\s-]*size|onesize)\s*$/i.test(s));

  const totalStock = product.variants.reduce((acc: number, v: any) => acc + (v.inventory?.quantity || 0), 0);
  const isOutOfStock = totalStock <= 0;

  const sameProductCartItems = useMemo(
    () => items.filter((item: any) => item.id === product.id),
    [items, product.id]
  );

  useEffect(() => {
    if (!selectedSize && sizes.length > 0 && sameProductCartItems.length === 1) {
      const cartSize = sameProductCartItems[0].size;
      if (cartSize) {
        setSelectedSize(cartSize);
      }
    }
  }, [sameProductCartItems, selectedSize, sizes.length]);

  // Compute selected variant and available stock for UI limits
  const selectedVariant = useMemo(() => {
    if (sizes.length > 0 && selectedSize) {
      return product.variants.find((v: any) => v.size === selectedSize) ?? null;
    }
    if (sizes.length === 0) {
      return product.variants.find((v: any) => (v.inventory?.quantity || 0) > 0) || product.variants[0] || null;
    }
    return null;
  }, [product.variants, selectedSize, sizes.length]);

  const variantId = selectedVariant ? selectedVariant.id : sizes.length === 0 ? product.id : null;
  const existingCartItem = useMemo(
    () => (variantId ? items.find((it: any) => it.variantId === variantId) : undefined),
    [items, variantId]
  );

  useEffect(() => {
    if (existingCartItem) {
      setQuantity(existingCartItem.quantity);
      return;
    }

    if (quantity !== 1) {
      setQuantity(1);
    }
  }, [existingCartItem?.quantity, existingCartItem, quantity]);

  const maxAvailable = selectedVariant ? (selectedVariant.inventory?.quantity ?? 0) : totalStock;

  const adjustQuantity = (newQuantity: number) => {
    const cappedQuantity = Math.max(1, Math.min(newQuantity, maxAvailable));
    setQuantity(cappedQuantity);
    if (existingCartItem) {
      updateQuantity(variantId, cappedQuantity);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error(`"${product.name}" is completely out of stock!`, {
        duration: 5000,
      });
      return;
    }
    if (sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size to continue.");
      return;
    }

    const stockAvailable = selectedVariant?.inventory?.quantity ?? 0;
    if (stockAvailable <= 0) {
      toast.error(`The selected options for "${product.name}" are out of stock!`, {
        duration: 5000,
      });
      return;
    }

    if (quantity > stockAvailable) {
      toast.error(`Only ${stockAvailable} item(s) left in stock. You cannot request ${quantity}.`, {
        duration: 5000,
      });
      return;
    }

    if (existingCartItem) {
      updateQuantity(variantId, quantity);
      toast.success(`${product.name} quantity updated in your bag.`);
      return;
    }

    const cartItem = {
      id: product.id,
      variantId,
      name: product.name,
      price: Number(selectedVariant?.price || product.basePrice),
      quantity,
      image: product.images?.[0],
      size: selectedSize || undefined,
      availableStock: stockAvailable,
    };

    addItem(cartItem);
    toast.success(`${product.name} added to your bag.`);
  };

  const handleShare = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : `/products/${product.id}`;
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.description || undefined,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Product link copied to clipboard.");
    } catch (err: any) {
      // If the user cancels the native share dialog, do not show an error
      if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) return;
      console.error("Share failed:", err);
      toast.error("Could not share the product.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Variants Selection */}
      <div className="space-y-8">
        {sizes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">Select Size</h3>
            <div className="flex flex-wrap gap-4">
              {sizes.map((size: any) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "h-10 min-w-[3rem] px-4 rounded-xl border-2 font-black text-xs transition-all active:scale-95",
                    selectedSize === size
                      ? "border-brand-navy bg-brand-navy/5 text-brand-navy shadow-lg shadow-brand-navy/10"
                      : "border-border/50 hover:border-brand-navy/50 glass-card"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Edition/Color selector removed per design — we rely on default variant mapping */}
      </div>

      {/* Quantity & Actions */}
      <div className="space-y-6">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 glass-card rounded-xl p-1 h-12 w-32">
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors"
              onClick={() => adjustQuantity(quantity - 1)}
              disabled={quantity <= 1}
            >
              <Minus className="size-4" />
            </Button>
            <span className="flex-1 text-center font-black text-base tracking-tighter">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-10 rounded-lg transition-colors", quantity >= maxAvailable || maxAvailable <= 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-white dark:hover:bg-zinc-800")}
              onClick={() => adjustQuantity(quantity + 1)}
              disabled={quantity >= maxAvailable || maxAvailable <= 0}
            >
              <Plus className="size-4" />
            </Button>
          </div>
            <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-500 uppercase tracking-widest">
              <Zap className="size-4 fill-emerald-500" />
              {maxAvailable <= 0 ? (
                <span className="text-rose-600">Out of stock</span>
              ) : maxAvailable <= 10 ? (
                <span className="text-emerald-600">Limited stock — {maxAvailable} left</span>
              ) : (
                <span className="text-emerald-600">In stock</span>
              )}
            </div>
            {existingCartItem && (
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-navy">
                In cart: {existingCartItem.quantity}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            onClick={handleAddToCart}
            className={cn(
              "flex-[2] h-14 rounded-xl text-sm font-black tracking-widest transition-all",
              isOutOfStock
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/20 cursor-not-allowed"
                : "bg-brand-navy hover:bg-brand-navy/90 text-white shadow-xl shadow-brand-navy/20 active:scale-95 group"
            )}
          >
            <ShoppingCart className="mr-3 size-5 group-hover:scale-110 transition-transform" />
            {isOutOfStock ? "OUT OF STOCK" : existingCartItem ? "UPDATE CART" : "ADD TO COLLECTION"}
          </Button>
          <div className="flex flex-1 gap-3">
            <Button size="icon" variant="outline" onClick={handleShare} className="h-14 w-14 rounded-xl border-2 border-border/50 hover:text-brand-silver hover:border-brand-silver/50 transition-all glass-card">
              <Share2 className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

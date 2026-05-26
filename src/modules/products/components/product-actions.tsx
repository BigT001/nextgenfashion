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
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const [quantity, setQuantity] = useState(1);

  // Normalize sizes: treat OS / One Size as no-size (don't show selector)
  const rawSizes = Array.from(new Set(product.variants.map((v: any) => v.size || "").filter(Boolean))) as string[];
  const sizes = rawSizes.filter((s) => !/^\s*(os|one[\s-]*size|onesize)\s*$/i.test(s));
  const colors = Array.from(new Set(product.variants.map((v: any) => v.color || "").filter(Boolean))) as string[];

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

  useEffect(() => {
    if (!selectedColor && colors.length === 1) {
      setSelectedColor(colors[0]);
    }
  }, [colors, selectedColor]);

  useEffect(() => {
    if (!selectedColor && colors.length > 0 && sameProductCartItems.length === 1) {
      const cartColor = sameProductCartItems[0].color;
      if (cartColor) {
        setSelectedColor(cartColor);
      }
    }
  }, [sameProductCartItems, selectedColor, colors.length]);

  useEffect(() => {
    if (selectedSize && !selectedColor && colors.length > 0) {
      const matchingColors = product.variants
        .filter((v: any) => v.size === selectedSize && v.color)
        .map((v: any) => v.color)
        .filter((color: unknown): color is string => typeof color === "string");
      const uniqueColors = Array.from(new Set(matchingColors)) as string[];
      if (uniqueColors.length === 1) {
        setSelectedColor(uniqueColors[0]);
      }
    }
  }, [product.variants, selectedColor, selectedSize, colors.length, sizes.length]);

  const selectedVariant = useMemo(() => {
    if (sizes.length > 0 && selectedSize && colors.length > 0 && selectedColor) {
      return product.variants.find((v: any) => v.size === selectedSize && v.color === selectedColor) ?? null;
    }
    if (sizes.length > 0 && selectedSize) {
      return product.variants.find((v: any) => v.size === selectedSize) ?? null;
    }
    if (colors.length > 0 && selectedColor) {
      return product.variants.find((v: any) => v.color === selectedColor) ?? null;
    }
    return product.variants.find((v: any) => (v.inventory?.quantity || 0) > 0) || product.variants[0] || null;
  }, [product.variants, selectedColor, selectedSize, sizes.length, colors.length]);

  const isCssColor = (color: string) => {
    if (!color || typeof window === "undefined") return false;
    return CSS.supports("color", color.trim());
  };

  const renderColorChip = (color: string) => {
    const value = color?.trim();
    const valid = isCssColor(value);

    return (
      <span
        key={value}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-black",
          valid ? "border-transparent text-white" : "border-border/40 bg-muted/10 text-muted-foreground"
        )}
        style={valid ? { backgroundColor: value } : undefined}
      >
        {valid ? <span className="h-2.5 w-2.5 rounded-full border border-white/30" style={{ backgroundColor: value }} /> : null}
        {value || "Unknown"}
      </span>
    );
  };

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
    if (colors.length > 0 && !selectedColor) {
      toast.error("Please select a color to continue.");
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
      color: selectedVariant?.color || selectedColor || undefined,
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

        {colors.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">Select Color</h3>
            <div className="flex flex-wrap gap-3">
              {colors.map((color: any) => {
                const isActive = selectedColor === color;
                const buttonStyles = cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all",
                  isActive ? "border-brand-navy bg-brand-navy/5 text-brand-navy shadow-lg shadow-brand-navy/10" : "border-border/40 bg-white/90 hover:border-brand-navy/50"
                );
                return (
                  <button key={color} type="button" onClick={() => setSelectedColor(color)} className={buttonStyles}>
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-border/50"
                      style={{ backgroundColor: color || "transparent" }}
                    />
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedColor && colors.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80 font-black">Color</span>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-muted/10 border border-border/30">
              <span className="h-3.5 w-3.5 rounded-full border border-border/40" style={{ backgroundColor: selectedColor }} />
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground">{selectedColor}</span>
            </div>
          </div>
        )}
      </div>

      {/* Quantity & Actions */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 glass-card rounded-2xl p-2 min-h-[3.75rem] min-w-[10rem] sm:w-auto">
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors"
              onClick={() => adjustQuantity(quantity - 1)}
              disabled={quantity <= 1}
            >
              <Minus className="size-4" />
            </Button>
            <span className="flex-1 text-center font-black text-base tracking-tighter">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-10 rounded-xl transition-colors", quantity >= maxAvailable || maxAvailable <= 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-white dark:hover:bg-zinc-800")}
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

        <div className="flex flex-row flex-wrap gap-3 items-stretch">
          <Button
            size="lg"
            onClick={handleAddToCart}
            className={cn(
              "flex-1 min-h-[4rem] rounded-2xl px-5 text-base font-black tracking-widest transition-all sm:text-sm",
              isOutOfStock
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/20 cursor-not-allowed"
                : "bg-brand-navy hover:bg-brand-navy/90 text-white shadow-xl shadow-brand-navy/20 active:scale-95 group"
            )}
          >
            <ShoppingCart className="mr-3 size-5 group-hover:scale-110 transition-transform" />
            {isOutOfStock ? "OUT OF STOCK" : existingCartItem ? "UPDATE CART" : "ADD TO COLLECTION"}
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleShare}
            className="h-16 w-16 rounded-2xl border-2 border-border/50 hover:text-brand-silver hover:border-brand-silver/50 transition-all glass-card sm:h-14 sm:w-14"
          >
            <Share2 className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

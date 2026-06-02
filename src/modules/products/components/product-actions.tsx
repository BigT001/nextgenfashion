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

  const variants = product.variants ?? [];
  const normalize = (value?: string) => value?.toString().trim() ?? "";
  const splitSizes = (raw?: string): string[] => {
    if (!raw) return [];
    return raw
      .toString()
      .split(/[,\/|]+/) // split on comma, slash, or pipe
      .map((s: string) => normalize(s))
      .filter(Boolean);
  };

  const uniqueColors = useMemo<string[]>(() =>
    Array.from<string>(
      new Set(
        variants
          .map((v: any) => normalize(v.color))
          .filter((color: string) => color.length > 0)
      )
    ) as string[],
    [variants]
  );

  const uniqueSizes = useMemo<string[]>(() => {
    const all = variants.flatMap((v: any) => splitSizes(v.size));
    return Array.from(
      new Set(all.filter((sz: string) => sz.length > 0 && !/^\s*(os|one[\s-]*size|onesize)\s*$/i.test(sz)))
    );
  }, [variants]);

  const colors = useMemo<string[]>(() => {
    if (!selectedSize) return uniqueColors;
    return Array.from(
      new Set(
        variants
          .filter((v: any) => splitSizes(v.size).includes(selectedSize))
          .map((v: any) => normalize(v.color))
          .filter((color: string) => color.length > 0)
      )
    );
  }, [variants, selectedSize, uniqueColors]);

  const sizes = useMemo<string[]>(() => {
    if (!selectedColor) return uniqueSizes;
    return Array.from(
      new Set(
        variants
          .filter((v: any) => normalize(v.color) === selectedColor)
          .flatMap((v: any) => splitSizes(v.size))
          .filter((size: string) => size.length > 0)
      )
    );
  }, [variants, selectedColor, uniqueSizes]);

  // Helper function to get stock for a specific size
  const getStockForSize = (size: string) => {
    const variantsWithSize = variants.filter(
      (v: any) => splitSizes(v.size).includes(size)
    );
    
    if (!variantsWithSize.length) return 0;
    
    if (selectedColor) {
      const variant = variantsWithSize.find((v: any) => normalize(v.color) === selectedColor);
      return variant ? (variant.inventory?.quantity ?? 0) : 0;
    }
    
    // Return max stock across all colors for this size
    return Math.max(...variantsWithSize.map((v: any) => v.inventory?.quantity ?? 0));
  };

  // Helper function to get stock for a specific color
  const getStockForColor = (color: string) => {
    const variantsWithColor = variants.filter(
      (v: any) => normalize(v.color) === color
    );
    
    if (!variantsWithColor.length) return 0;
    
    if (selectedSize) {
      const variant = variantsWithColor.find((v: any) => 
        splitSizes(v.size).includes(selectedSize)
      );
      return variant ? (variant.inventory?.quantity ?? 0) : 0;
    }
    
    // Return max stock across all sizes for this color
    return Math.max(...variantsWithColor.map((v: any) => v.inventory?.quantity ?? 0));
  };

  const totalStock = variants.reduce((acc: number, v: any) => acc + (v.inventory?.quantity || 0), 0);
  const isOutOfStock = totalStock <= 0;

  const sameProductCartItems = useMemo(
    () => items.filter((item: any) => item.id === product.id),
    [items, product.id]
  );

  useEffect(() => {
    if (!selectedColor && uniqueColors.length === 1) {
      setSelectedColor(uniqueColors[0]);
    }
  }, [uniqueColors, selectedColor]);

  useEffect(() => {
    if (!selectedSize && uniqueSizes.length === 1) {
      setSelectedSize(uniqueSizes[0]);
    }
  }, [uniqueSizes, selectedSize]);

  useEffect(() => {
    if (!selectedSize && sameProductCartItems.length === 1) {
      const cartSize = sameProductCartItems[0].size;
      if (cartSize) {
        setSelectedSize(cartSize);
      }
    }
  }, [sameProductCartItems, selectedSize]);

  useEffect(() => {
    if (!selectedColor && sameProductCartItems.length === 1) {
      const cartColor = sameProductCartItems[0].color;
      if (cartColor) {
        setSelectedColor(cartColor);
      }
    }
  }, [sameProductCartItems, selectedColor]);

  useEffect(() => {
    if (selectedColor && selectedSize) {
      const validCombo = variants.some(
        (v: any) => normalize(v.color) === selectedColor && splitSizes(v.size).includes(selectedSize || "")
      );
      if (!validCombo) {
        setSelectedSize(null);
      }
    }
  }, [selectedColor, selectedSize, variants]);

  useEffect(() => {
    if (!selectedColor && selectedSize && colors.length === 1) {
      setSelectedColor(colors[0]);
    }
  }, [colors, selectedColor, selectedSize]);

  useEffect(() => {
    if (!selectedSize && selectedColor && sizes.length === 1) {
      setSelectedSize(sizes[0]);
    }
  }, [sizes, selectedColor, selectedSize]);

  const selectedVariant = useMemo(() => {
    const exactMatch = variants.find(
      (v: any) => normalize(v.color) === selectedColor && splitSizes(v.size).includes(selectedSize || "")
    );
    if (exactMatch) return exactMatch;

    if (selectedColor) {
      return variants.find((v: any) => normalize(v.color) === selectedColor && splitSizes(v.size).includes(selectedSize || "") && (v.inventory?.quantity ?? 0) > 0) ??
        variants.find((v: any) => normalize(v.color) === selectedColor && splitSizes(v.size).includes(selectedSize || "")) ??
        variants.find((v: any) => normalize(v.color) === selectedColor && (v.inventory?.quantity ?? 0) > 0) ??
        variants.find((v: any) => normalize(v.color) === selectedColor) ??
        null;
    }

    if (selectedSize) {
      return variants.find((v: any) => splitSizes(v.size).includes(selectedSize || "") && (v.inventory?.quantity ?? 0) > 0) ??
        variants.find((v: any) => splitSizes(v.size).includes(selectedSize || "")) ??
        null;
    }

    return variants.find((v: any) => (v.inventory?.quantity || 0) > 0) || variants[0] || null;
  }, [variants, selectedColor, selectedSize]);

  const selectedVariantQuantity = selectedVariant ? Number(selectedVariant.inventory?.quantity ?? 0) : totalStock;
  const maxAvailable = Math.max(0, selectedVariantQuantity);

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

  const variantId = selectedVariant?.id ?? null;
  const existingCartItem = useMemo(
    () => (variantId ? items.find((it: any) => it.variantId === variantId) : undefined),
    [items, variantId]
  );

  useEffect(() => {
    if (existingCartItem) {
      setQuantity(existingCartItem.quantity);
      return;
    }

    setQuantity(1);
  }, [existingCartItem?.quantity, existingCartItem]);

  const adjustQuantity = (newQuantity: number) => {
    const cappedQuantity = Math.max(1, Math.min(newQuantity, maxAvailable));
    setQuantity(cappedQuantity);
    if (existingCartItem && variantId) {
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

    if (selectedColor && selectedSize && !selectedVariant) {
      toast.error("The selected combination is unavailable. Please choose another size or color.");
      return;
    }

    const stockAvailable = selectedVariant ? maxAvailable : totalStock;

    if (stockAvailable <= 0) {
      toast.error(`The selected options for "${product.name}" are out of stock!`, {
        duration: 5000,
      });
      return;
    }

    if (quantity > stockAvailable) {
      toast.error(`Only ${stockAvailable} item(s) left in stock for the selected option.`, {
        duration: 5000,
      });
      return;
    }

    if (!variantId) {
      toast.error("Unable to determine a valid product variant. Please refresh the page or choose another option.");
      return;
    }

    if (existingCartItem) {
      updateQuantity(variantId, quantity);
      toast.success(`${product.name} quantity updated in your bag.`);
      return;
    }

    const cartItem: Parameters<typeof addItem>[0] = {
      id: product.id,
      variantId,
      name: product.name,
      price: Number(selectedVariant?.price ?? product.basePrice) || 0,
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
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Product link copied to clipboard.");
        return;
      }
      window.prompt("Copy this product link:", url);
    } catch (err: any) {
      if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) return;
      console.error("Share failed:", err);
      toast.error("Could not share the product.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Variants Selection */}
      <div className="space-y-6 sm:space-y-8">
        {sizes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">Select Size</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {sizes.map((size: any) => {
                const stock = getStockForSize(size);
                const isOutOfStockVariant = stock <= 0;
                return (
                  <div key={size} className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      disabled={isOutOfStockVariant}
                      className={cn(
                        "h-11 sm:h-10 min-w-[3rem] px-4 rounded-lg sm:rounded-xl border-2 font-black text-xs sm:text-xs transition-all active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed",
                        selectedSize === size
                          ? "border-brand-navy bg-brand-navy/5 text-brand-navy shadow-lg shadow-brand-navy/10"
                          : "border-border/50 hover:border-brand-navy/50 glass-card"
                      )}
                    >
                      {size}
                    </button>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      isOutOfStockVariant ? "text-rose-500" : "text-emerald-600"
                    )}>
                      {stock} {stock === 1 ? "item" : "items"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {colors.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">Select Color</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {colors.map((color: any) => {
                const stock = getStockForColor(color);
                const isOutOfStockVariant = stock <= 0;
                return (
                  <div key={color} className="flex flex-col items-center gap-1">
                    <button 
                      type="button" 
                      onClick={() => setSelectedColor(color)}
                      disabled={isOutOfStockVariant}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed",
                        selectedColor === color 
                          ? "border-brand-navy bg-brand-navy/5 text-brand-navy shadow-lg shadow-brand-navy/10" 
                          : "border-border/40 bg-white/90 hover:border-brand-navy/50"
                      )}
                    >
                      <span
                        className={cn(
                          "h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border",
                          isOutOfStockVariant ? "border-rose-500/40" : "border-border/50"
                        )}
                        style={{ backgroundColor: color || "transparent" }}
                      />
                      {color}
                    </button>
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest",
                      isOutOfStockVariant ? "text-rose-500" : "text-emerald-600"
                    )}>
                      {stock} {stock === 1 ? "item" : "items"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedColor && colors.length > 0 && (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80 font-black">Color</span>
            <div className="inline-flex items-center gap-2 rounded-full px-2 sm:px-3 py-1 bg-muted/10 border border-border/30">
              <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border border-border/40" style={{ backgroundColor: selectedColor }} />
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-foreground">{selectedColor}</span>
            </div>
          </div>
        )}
      </div>

      {/* Quantity & Actions */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center gap-3 glass-card rounded-xl sm:rounded-2xl p-1 sm:p-2 min-h-[3.5rem] sm:min-h-[3.75rem]">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 sm:size-10 rounded-lg sm:rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors touch-manipulation"
              onClick={() => adjustQuantity(quantity - 1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="size-4 sm:size-5" />
            </Button>
            <span className="flex-1 text-center font-black text-lg sm:text-base tracking-tighter">{quantity}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("size-11 sm:size-10 rounded-lg sm:rounded-xl transition-colors touch-manipulation", quantity >= maxAvailable || maxAvailable <= 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-white dark:hover:bg-zinc-800")}
              onClick={() => adjustQuantity(quantity + 1)}
              disabled={quantity >= maxAvailable || maxAvailable <= 0}
              aria-label="Increase quantity"
            >
              <Plus className="size-4 sm:size-5" />
            </Button>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest">
              <Zap className="size-3.5 sm:size-4 fill-emerald-500" />
              {selectedVariant ? (
                maxAvailable <= 0 ? (
                  <span className="text-rose-600">Selected option out of stock</span>
                ) : (
                  <span className="text-emerald-600">Limited stock — {maxAvailable} left for selected option</span>
                )
              ) : (
                <span className="text-emerald-600">{totalStock} item{totalStock === 1 ? "" : "s"} available</span>
              )}
            </div>
            {existingCartItem && (
              <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-brand-navy">
                In cart: {existingCartItem.quantity}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-stretch">
          <Button
            type="button"
            size="lg"
            onClick={handleAddToCart}
            className={cn(
              "w-full min-h-[3.5rem] sm:min-h-[4rem] rounded-xl sm:rounded-2xl px-4 sm:px-5 text-sm sm:text-base font-black tracking-widest transition-all touch-manipulation",
              isOutOfStock
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/20 cursor-not-allowed"
                : "bg-brand-navy hover:bg-brand-navy/90 text-white shadow-xl shadow-brand-navy/20 active:scale-95 group"
            )}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="mr-2 sm:mr-3 size-4 sm:size-5 group-hover:scale-110 transition-transform" />
            {isOutOfStock ? "OUT OF STOCK" : existingCartItem ? "UPDATE CART" : "ADD TO COLLECTION"}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={handleShare}
            className="w-full min-h-[3rem] sm:min-h-[3.75rem] rounded-xl sm:rounded-2xl border-2 border-border/50 hover:text-brand-silver hover:border-brand-silver/50 transition-all glass-card touch-manipulation text-sm sm:text-base font-black tracking-widest"
          >
            <Share2 className="mr-2 sm:mr-3 size-4 sm:size-5" />
            SHARE
          </Button>
        </div>
      </div>
    </div>
  );
}

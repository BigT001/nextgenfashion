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
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantityByVariantId, setQuantityByVariantId] = useState<Record<string, number>>({});
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

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

  const findVariantForSize = (size: string) => {
    return variants.find(
      (v: any) =>
        splitSizes(v.size).includes(size) &&
        (!selectedColor || normalize(v.color) === selectedColor) &&
        (v.inventory?.quantity ?? 0) > 0
    ) ?? variants.find(
      (v: any) =>
        splitSizes(v.size).includes(size) &&
        (!selectedColor || normalize(v.color) === selectedColor)
    );
  };

  const selectedVariants = useMemo(() => {
    if (selectedSizes.length > 0) {
      if (selectedColor) {
        return variants.filter(
          (v: any) =>
            normalize(v.color) === selectedColor &&
            splitSizes(v.size).some((size) => selectedSizes.includes(size))
        );
      }

      return selectedSizes
        .map(findVariantForSize)
        .filter(Boolean)
        .reduce((unique: any[], variant: any) => {
          if (!unique.some((existing) => existing.id === variant.id)) {
            unique.push(variant);
          }
          return unique;
        }, [] as any[]);
    }

    if (selectedColor) {
      return variants.filter((v: any) => normalize(v.color) === selectedColor);
    }

    return [];
  }, [variants, selectedSizes, selectedColor]);

  const selectedVariantIds = useMemo(
    () => selectedVariants.map((v: any) => v.id),
    [selectedVariants]
  );

  const getQuantityForVariant = (variantId: string) => Math.max(1, quantityByVariantId[variantId] ?? 1);

  const setQuantityForVariant = (variantId: string, quantity: number) => {
    setQuantityByVariantId((current) => ({
      ...current,
      [variantId]: Math.max(1, quantity),
    }));
  };

  useEffect(() => {
    if (!selectedVariants.length) return;
    setQuantityByVariantId((current) => {
      const next: Record<string, number> = {};
      selectedVariants.forEach((variant: any) => {
        const existing = current[variant.id] ?? 1;
        const capped = Math.min(Math.max(1, existing), variant.inventory?.quantity ?? existing);
        next[variant.id] = capped;
      });
      return next;
    });
  }, [selectedVariants]);

  const colors = useMemo<string[]>(() => {
    return Array.from(
      new Set(
        variants
          .filter((v: any) => {
            if (selectedSizes.length === 0) return true;
            return splitSizes(v.size).some((size) => selectedSizes.includes(size));
          })
          .map((v: any) => normalize(v.color))
          .filter((color: string) => color.length > 0)
      )
    ) as string[];
  }, [variants, selectedSizes]);

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

  const getStockForSize = (size: string) => {
    const variantsWithSize = variants.filter((v: any) => splitSizes(v.size).includes(size));
    if (!variantsWithSize.length) return 0;

    if (selectedColor) {
      const variant = variantsWithSize.find((v: any) => normalize(v.color) === selectedColor);
      return variant ? variant.inventory?.quantity ?? 0 : 0;
    }

    return Math.max(...variantsWithSize.map((v: any) => v.inventory?.quantity ?? 0));
  };

  const getStockForColor = (color: string) => {
    const variantsWithColor = variants.filter((v: any) => normalize(v.color) === color);
    if (!variantsWithColor.length) return 0;

    if (selectedSizes.length > 0) {
      const matching = variantsWithColor.filter((v: any) => splitSizes(v.size).some((size) => selectedSizes.includes(size)));
      if (!matching.length) return 0;
      return matching.reduce((acc: number, v: any) => acc + (v.inventory?.quantity ?? 0), 0);
    }

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
    if (!selectedSizes.length && uniqueSizes.length === 1) {
      setSelectedSizes([uniqueSizes[0]]);
    }
  }, [uniqueSizes, selectedSizes.length]);

  useEffect(() => {
    if (!selectedSizes.length && sameProductCartItems.length === 1) {
      const cartSize = sameProductCartItems[0].size;
      if (cartSize) {
        setSelectedSizes([cartSize]);
      }
    }
  }, [sameProductCartItems, selectedSizes.length]);

  useEffect(() => {
    if (!selectedColor && sameProductCartItems.length === 1) {
      const cartColor = sameProductCartItems[0].color;
      if (cartColor) {
        setSelectedColor(cartColor);
      }
    }
  }, [sameProductCartItems, selectedColor]);

  useEffect(() => {
    if (selectedColor && selectedSizes.length > 0) {
      const validSizes = sizes;
      const filteredSizes = selectedSizes.filter((size) => validSizes.includes(size));
      if (filteredSizes.length !== selectedSizes.length) {
        setSelectedSizes(filteredSizes);
      }
    }
  }, [selectedColor, selectedSizes, sizes]);

  useEffect(() => {
    if (!selectedColor && selectedSizes.length > 0 && colors.length === 1) {
      setSelectedColor(colors[0]);
    }
  }, [colors, selectedColor, selectedSizes.length]);

  useEffect(() => {
    if (!selectedSizes.length && selectedColor && sizes.length === 1) {
      setSelectedSizes([sizes[0]]);
    }
  }, [sizes, selectedColor, selectedSizes.length]);

  const selectedVariant = useMemo(() => {
    if (selectedVariants.length > 0) {
      return selectedVariants.find((v: any) => (v.inventory?.quantity ?? 0) > 0) || selectedVariants[0];
    }

    if (selectedColor) {
      return (
        variants.find((v: any) => normalize(v.color) === selectedColor && (v.inventory?.quantity ?? 0) > 0) ??
        variants.find((v: any) => normalize(v.color) === selectedColor) ??
        null
      );
    }

    if (selectedSizes.length > 0) {
      return (
        variants.find((v: any) => splitSizes(v.size).some((size) => selectedSizes.includes(size)) && (v.inventory?.quantity ?? 0) > 0) ??
        variants.find((v: any) => splitSizes(v.size).some((size) => selectedSizes.includes(size))) ??
        null
      );
    }

    return variants.find((v: any) => (v.inventory?.quantity || 0) > 0) || variants[0] || null;
  }, [variants, selectedColor, selectedSizes, selectedVariants]);

  const selectedVariantQuantity = selectedVariants.length > 1
    ? selectedVariants.reduce((acc: number, v: any) => acc + (v.inventory?.quantity || 0), 0)
    : selectedVariant
      ? Number(selectedVariant.inventory?.quantity ?? 0)
      : totalStock;

  const maxAvailableForSingleVariant = selectedVariants.length === 1
    ? Math.max(0, selectedVariantQuantity)
    : 0;

  const totalSelectedStock = selectedVariants.length > 0
    ? selectedVariants.reduce((acc: number, v: any) => acc + (v.inventory?.quantity || 0), 0)
    : totalStock;

  const existingCartItems = useMemo(
    () => (selectedVariantIds.length > 0 ? items.filter((it: any) => selectedVariantIds.includes(it.variantId)) : []),
    [items, selectedVariantIds]
  );

  const toggleSelectedSize = (size: string) => {
    setSelectedSizes((current) =>
      current.includes(size) ? current.filter((value) => value !== size) : [...current, size]
    );
  };

  const activeVariantId = selectedVariants.length === 1
    ? selectedVariants[0]?.id
    : selectedVariant?.id ?? null;

  const activeVariantQuantity = activeVariantId ? getQuantityForVariant(activeVariantId) : 1;
  const activeVariantStock = activeVariantId
    ? Math.max(0, selectedVariants.length === 1 ? selectedVariants[0]?.inventory?.quantity ?? 0 : selectedVariant?.inventory?.quantity ?? 0)
    : 0;

  const decreaseQuantityForVariant = (variantId: string) => {
    const current = getQuantityForVariant(variantId);
    const next = Math.max(1, current - 1);
    setQuantityForVariant(variantId, next);
    if (selectedVariants.length === 1 && existingCartItems.length === 1) {
      updateQuantity(variantId, next);
    }
  };

  const increaseQuantityForVariant = (variantId: string) => {
    const current = getQuantityForVariant(variantId);
    const variant = selectedVariants.find((v: any) => v.id === variantId);
    const maxQty = Math.max(0, variant?.inventory?.quantity ?? 0);
    const next = Math.min(current + 1, maxQty);
    setQuantityForVariant(variantId, next);
    if (selectedVariants.length === 1 && existingCartItems.length === 1) {
      updateQuantity(variantId, next);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error(`"${product.name}" is completely out of stock!`, {
        duration: 5000,
      });
      return;
    }
    if (sizes.length > 0 && selectedSizes.length === 0) {
      toast.error("Please select at least one size to continue.");
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      toast.error("Please select a color to continue.");
      return;
    }

    const targetVariants = selectedVariants.length > 0
      ? selectedVariants
      : selectedVariant
        ? [selectedVariant]
        : [];

    if (!targetVariants.length) {
      toast.error("Unable to determine a valid product variant. Please choose another option.");
      return;
    }

    const hasOutOfStock = targetVariants.some((variant: any) => {
      const desiredQty = getQuantityForVariant(variant.id);
      return desiredQty > (variant.inventory?.quantity ?? 0);
    });

    if (hasOutOfStock) {
      toast.error(`One or more selected options do not have enough stock.`);
      return;
    }

    targetVariants.forEach((variant: any) => {
      const desiredQty = getQuantityForVariant(variant.id);
      addItem({
        id: product.id,
        variantId: variant.id,
        name: product.name,
        price: Number(variant.price ?? product.basePrice) || 0,
        quantity: desiredQty,
        image: product.images?.[0],
        size: splitSizes(variant.size)[0] || undefined,
        color: normalize(variant.color) || selectedColor || undefined,
        availableStock: variant.inventory?.quantity ?? 0,
      });
    });

    if (targetVariants.length === 1) {
      toast.success(`${product.name} added to your bag.`);
    } else {
      toast.success(`${product.name} added to your bag for ${targetVariants.length} sizes.`);
    }
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
                const isSelected = selectedSizes.includes(size);
                return (
                  <div key={size} className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSelectedSize(size)}
                      disabled={isOutOfStockVariant}
                      className={cn(
                        "h-11 sm:h-10 min-w-[3rem] px-4 rounded-lg sm:rounded-xl border-2 font-black text-xs sm:text-xs transition-all active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed",
                        isSelected
                          ? "border-brand-navy bg-brand-navy/5 text-brand-navy shadow-lg shadow-brand-navy/10"
                          : "border-border/50 hover:border-brand-navy/50 glass-card"
                      )}
                      aria-pressed={isSelected}
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
      {selectedSizes.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {selectedVariants.length > 1 ? (
              <div className="space-y-3">
                {selectedVariants.map((variant: any) => {
                  const sizeLabel = splitSizes(variant.size).find((size) => selectedSizes.includes(size)) ?? splitSizes(variant.size)[0] ?? "N/A";
                  const variantQty = getQuantityForVariant(variant.id);
                  const stock = Math.max(0, variant.inventory?.quantity ?? 0);
                  return (
                    <div key={variant.id} className="glass-card rounded-xl sm:rounded-2xl p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-muted-foreground/70">
                            {sizeLabel}{selectedColor ? "" : ` / ${normalize(variant.color)}`}
                          </div>
                          <div className="text-[11px] font-black uppercase tracking-[0.18em]">
                            {stock} {stock === 1 ? "item" : "items"} available
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-11 sm:size-10 rounded-lg sm:rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors touch-manipulation"
                            onClick={() => decreaseQuantityForVariant(variant.id)}
                            disabled={variantQty <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="size-4 sm:size-5" />
                          </Button>
                          <span className="w-9 text-center font-black text-lg sm:text-base tracking-tighter">{variantQty}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn("size-11 sm:size-10 rounded-lg sm:rounded-xl transition-colors touch-manipulation", variantQty >= stock || stock <= 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-white dark:hover:bg-zinc-800")}
                            onClick={() => increaseQuantityForVariant(variant.id)}
                            disabled={variantQty >= stock || stock <= 0}
                            aria-label="Increase quantity"
                          >
                            <Plus className="size-4 sm:size-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 glass-card rounded-xl sm:rounded-2xl p-1 sm:p-2 min-h-[3.5rem] sm:min-h-[3.75rem]">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 sm:size-10 rounded-lg sm:rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors touch-manipulation"
                  onClick={() => activeVariantId && decreaseQuantityForVariant(activeVariantId)}
                  disabled={!activeVariantId || activeVariantQuantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-4 sm:size-5" />
                </Button>
                <span className="flex-1 text-center font-black text-lg sm:text-base tracking-tighter">{activeVariantQuantity}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn("size-11 sm:size-10 rounded-lg sm:rounded-xl transition-colors touch-manipulation", activeVariantQuantity >= activeVariantStock || activeVariantStock <= 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-white dark:hover:bg-zinc-800")}
                  onClick={() => activeVariantId && increaseQuantityForVariant(activeVariantId)}
                  disabled={!activeVariantId || activeVariantQuantity >= activeVariantStock || activeVariantStock <= 0}
                  aria-label="Increase quantity"
                >
                  <Plus className="size-4 sm:size-5" />
                </Button>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                <Zap className="size-3.5 sm:size-4 fill-emerald-500" />
                {selectedVariants.length > 1 ? (
                  <span className="text-emerald-600">{totalSelectedStock} item{totalSelectedStock === 1 ? "" : "s"} available across selected options</span>
                ) : selectedVariant ? (
                  activeVariantStock <= 0 ? (
                    <span className="text-rose-600">Selected option out of stock</span>
                  ) : (
                    <span className="text-emerald-600">Limited stock — {activeVariantStock} left for selected option</span>
                  )
                ) : (
                  <span className="text-emerald-600">{totalStock} item{totalStock === 1 ? "" : "s"} available</span>
                )}
              </div>
              {selectedVariants.length === 1 && existingCartItems.length === 1 && (
                <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-brand-navy">
                  In cart: {existingCartItems[0].quantity}
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
              {isOutOfStock ? "OUT OF STOCK" : existingCartItems.length === 1 ? "UPDATE CART" : "ADD TO COLLECTION"}
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
      )}
    </div>
  );
}

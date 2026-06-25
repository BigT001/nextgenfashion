"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { ShoppingCart, Share2, Minus, Plus, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/modules/cart/store/cart.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductActionsProps {
  product: any;
}

// ─── helpers ────────────────────────────────────────────────────────────────
const normalize = (v?: string) => v?.toString().trim() ?? "";

const splitSizes = (raw?: string): string[] => {
  if (!raw) return [];
  return raw
    .toString()
    .split(/[,\/|]+/)
    .map((s) => normalize(s))
    .filter(Boolean);
};

const isValidCssColor = (c: string) => {
  if (!c || typeof window === "undefined") return false;
  return CSS.supports("color", c.trim());
};

// Well-known color name → CSS mapping for common fashion colors
const COLOR_MAP: Record<string, string> = {
  "brown": "#795548",
  "green moss": "#6B7B3A",
  "moss": "#6B7B3A",
  "olive": "#808000",
  "navy": "#0B1E3F",
  "black": "#212121",
  "white": "#FAFAFA",
  "grey": "#9E9E9E",
  "gray": "#9E9E9E",
  "red": "#D32F2F",
  "blue": "#1565C0",
  "pink": "#E91E63",
  "purple": "#7B1FA2",
  "yellow": "#F9A825",
  "orange": "#E65100",
  "cream": "#FFFDD0",
  "beige": "#F5F5DC",
  "tan": "#D2B48C",
  "maroon": "#800000",
  "teal": "#00695C",
  "khaki": "#C3B091",
};

function resolveColor(name: string): string | null {
  const lower = name.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  // try partial match
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  if (isValidCssColor(name)) return name;
  return null;
}

// ─── component ──────────────────────────────────────────────────────────────
export function ProductActions({ product }: ProductActionsProps) {
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const items = useCartStore((s) => s.items);

  const variants: any[] = product.variants ?? [];

  // All unique colors
  const uniqueColors = useMemo<string[]>(
    () =>
      Array.from(
        new Set(
          variants
            .map((v) => normalize(v.color))
            .filter((c) => c.length > 0)
        )
      ),
    [variants]
  );

  // All unique sizes (global, shown when no color is selected yet)
  const allSizes = useMemo<string[]>(() => {
    const all = variants.flatMap((v) => splitSizes(v.size));
    return Array.from(
      new Set(
        all.filter(
          (s) => s.length > 0 && !/^\s*(os|one[\s-]*size|onesize)\s*$/i.test(s)
        )
      )
    );
  }, [variants]);

  const hasColors = uniqueColors.length > 0;
  const hasSizes = allSizes.length > 0;

  /**
   * Core state: selectedSizesByColor
   * { [colorName]: string[] }   — for a product WITH colors
   * { "__no_color__": string[] } — for a product WITHOUT colors
   */
  const NO_COLOR_KEY = "__no_color__";
  const [selectedSizesByColor, setSelectedSizesByColor] = useState<
    Record<string, string[]>
  >({});

  // Which color tab is currently being viewed/edited (UI focus, not selection)
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Per-variant quantity map: { variantId: number }
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});

  // ── derived: initialize activeTab when colors load ──────────────────────
  useEffect(() => {
    if (hasColors && activeTab === null && uniqueColors.length > 0) {
      setActiveTab(uniqueColors[0]);
    }
  }, [hasColors, uniqueColors, activeTab]);

  // ── Sizes available for the currently active tab ─────────────────────────
  const sizesForTab = useMemo<string[]>(() => {
    if (!hasColors) return allSizes;
    if (!activeTab) return allSizes;
    return Array.from(
      new Set(
        variants
          .filter((v) => normalize(v.color) === activeTab)
          .flatMap((v) => splitSizes(v.size))
          .filter((s) => s.length > 0)
      )
    );
  }, [hasColors, activeTab, variants, allSizes]);

  // ── selected sizes for current tab ───────────────────────────────────────
  const tabKey = hasColors ? (activeTab ?? "") : NO_COLOR_KEY;
  const selectedSizesForTab: string[] = selectedSizesByColor[tabKey] ?? [];

  const toggleSizeForTab = (size: string) => {
    setSelectedSizesByColor((prev) => {
      const current = prev[tabKey] ?? [];
      const next = current.includes(size)
        ? current.filter((s) => s !== size)
        : [...current, size];
      return { ...prev, [tabKey]: next };
    });
  };

  // ── compute all selected variants (across ALL colors) ────────────────────
  const selectedVariants = useMemo(() => {
    const result: any[] = [];
    const seen = new Set<string>();

    const pushVariant = (v: any) => {
      if (!seen.has(v.id)) {
        seen.add(v.id);
        result.push(v);
      }
    };

    if (hasColors && !hasSizes) {
      // If product has colors but no sizes (One Size), select based on active color tab
      if (activeTab) {
        const v =
          variants.find(
            (vv) =>
              normalize(vv.color) === activeTab &&
              (vv.inventory?.quantity ?? 0) > 0
          ) ??
          variants.find((vv) => normalize(vv.color) === activeTab);
        if (v) pushVariant(v);
      }
    } else if (hasColors) {
      for (const [color, sizes] of Object.entries(selectedSizesByColor)) {
        if (!sizes || sizes.length === 0) continue;
        for (const size of sizes) {
          // find best matching variant: in-stock first, then any
          const v =
            variants.find(
              (vv) =>
                normalize(vv.color) === color &&
                splitSizes(vv.size).includes(size) &&
                (vv.inventory?.quantity ?? 0) > 0
            ) ??
            variants.find(
              (vv) =>
                normalize(vv.color) === color &&
                splitSizes(vv.size).includes(size)
            );
          if (v) pushVariant(v);
        }
      }
    } else {
      const sizes = selectedSizesByColor[NO_COLOR_KEY] ?? [];
      for (const size of sizes) {
        const v =
          variants.find(
            (vv) =>
              splitSizes(vv.size).includes(size) &&
              (vv.inventory?.quantity ?? 0) > 0
          ) ??
          variants.find((vv) => splitSizes(vv.size).includes(size));
        if (v) pushVariant(v);
      }
    }

    return result;
  }, [hasColors, hasSizes, activeTab, selectedSizesByColor, variants]);

  // sync qty map when selected variants change
  useEffect(() => {
    setQtyMap((prev) => {
      const next: Record<string, number> = {};
      selectedVariants.forEach((v) => {
        const max = Math.max(0, v.inventory?.quantity ?? 0);
        const prev_ = prev[v.id] ?? 1;
        next[v.id] = Math.max(1, Math.min(prev_, max || 1));
      });
      return next;
    });
  }, [selectedVariants]);

  // ── stock helpers ─────────────────────────────────────────────────────────
  const getStockForColor = useCallback(
    (color: string) =>
      variants
        .filter((v) => normalize(v.color) === color)
        .reduce((acc, v) => acc + (v.inventory?.quantity ?? 0), 0),
    [variants]
  );

  const getStockForSize = useCallback(
    (size: string, color?: string | null) => {
      const pool = color
        ? variants.filter((v) => normalize(v.color) === color)
        : variants;
      const matching = pool.filter((v) => splitSizes(v.size).includes(size));
      if (!matching.length) return 0;
      return matching.reduce(
        (acc, v) => acc + (v.inventory?.quantity ?? 0),
        0
      );
    },
    [variants]
  );

  const totalStock = variants.reduce(
    (acc, v) => acc + (v.inventory?.quantity || 0),
    0
  );
  const isOutOfStock = totalStock <= 0;

  const totalSelectedStock = selectedVariants.reduce(
    (acc, v) => acc + (v.inventory?.quantity || 0),
    0
  );

  // ── how many colors have sizes selected ──────────────────────────────────
  const colorsWithSelections = Object.entries(selectedSizesByColor).filter(
    ([, sizes]) => sizes && sizes.length > 0
  );

  // ── existing cart items for selected variants ─────────────────────────────
  const existingCartItems = useMemo(() => {
    const selectedIds = new Set(selectedVariants.map((v) => v.id));
    return items.filter((it: any) => selectedIds.has(it.variantId));
  }, [items, selectedVariants]);

  // ── add to cart ───────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error(`"${product.name}" is completely out of stock!`);
      return;
    }
    if (hasSizes && selectedVariants.length === 0) {
      toast.error("Please select at least one size to continue.");
      return;
    }
    if (hasColors && colorsWithSelections.length === 0 && hasSizes) {
      toast.error("Please select a color and size to continue.");
      return;
    }

    const targetVariants =
      selectedVariants.length > 0
        ? selectedVariants
        : variants.filter((v) => (v.inventory?.quantity ?? 0) > 0).slice(0, 1);

    if (!targetVariants.length) {
      toast.error("Unable to determine a valid variant. Please try again.");
      return;
    }

    const overStock = targetVariants.find(
      (v) => (qtyMap[v.id] ?? 1) > (v.inventory?.quantity ?? 0)
    );
    if (overStock) {
      toast.error("One or more selected options don't have enough stock.");
      return;
    }

    targetVariants.forEach((v) => {
      const primaryCategory = product.categories?.[0]?.name || product.Category?.name || "Apparel";
      
      // Resolve weight: Product weight > Category weight fallback > Default 0.5kg
      let resolvedWeight = Number(product.weight);
      if (!resolvedWeight && product.categories && Array.isArray(product.categories)) {
        const catWeights = product.categories
          .map((c: any) => Number(c.weight))
          .filter((w: number) => !Number.isNaN(w) && w > 0);
        if (catWeights.length > 0) {
          resolvedWeight = Math.max(...catWeights);
        }
      }
      if (!resolvedWeight) {
        resolvedWeight = 0.5; // fallback default
      }

      addItem({
        id: product.id,
        variantId: v.id,
        name: product.name,
        price: Number(v.price ?? product.basePrice) || 0,
        quantity: qtyMap[v.id] ?? 1,
        image: product.images?.[0],
        size: splitSizes(v.size)[0] || undefined,
        color: normalize(v.color) || undefined,
        availableStock: v.inventory?.quantity ?? 0,
        category: primaryCategory,
        weight: resolvedWeight,
      });
    });

    if (targetVariants.length === 1) {
      toast.success(`${product.name} added to your bag! 🎉`);
    } else {
      toast.success(
        `${product.name} added to your bag — ${targetVariants.length} variants! 🎉`
      );
    }
  };

  // ── share ─────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      const url =
        typeof window !== "undefined"
          ? window.location.href
          : `/products/${product.id}`;
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard.");
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.name === "NotAllowedError") return;
      toast.error("Could not share the product.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7">

      {/* ── COLOR TABS ─────────────────────────────────────────────────── */}
      {hasColors && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
              Select Color
            </h3>
            {colorsWithSelections.length > 0 && (
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                {colorsWithSelections.length} color{colorsWithSelections.length > 1 ? "s" : ""} selected
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {uniqueColors.map((color) => {
              const css = resolveColor(color);
              const stock = getStockForColor(color);
              const outOfStock = stock <= 0;
              const isActive = activeTab === color;
              const sizesChosen = (selectedSizesByColor[color] ?? []).length;
              const isChosen = sizesChosen > 0;

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setActiveTab(color)}
                  disabled={outOfStock}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-2xl border-2 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] transition-all duration-200 touch-manipulation",
                    outOfStock && "opacity-40 cursor-not-allowed",
                    isActive
                      ? "border-brand-navy bg-brand-navy text-white shadow-lg shadow-brand-navy/30 scale-[1.02]"
                      : isChosen
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-border/40 bg-white/90 text-zinc-700 hover:border-brand-navy/60 hover:bg-zinc-50"
                  )}
                >
                  {/* Color swatch */}
                  <span
                    className={cn(
                      "relative h-4 w-4 flex-shrink-0 rounded-full border-2 transition-all",
                      isActive ? "border-white/50" : "border-zinc-200"
                    )}
                    style={{ backgroundColor: css ?? color ?? "transparent" }}
                  >
                    {isChosen && !isActive && (
                      <Check className="absolute inset-0 m-auto size-2.5 text-white" strokeWidth={3} />
                    )}
                  </span>

                  {color}

                  {/* badge: how many sizes selected */}
                  {isChosen && (
                    <span
                      className={cn(
                        "ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black leading-none",
                        isActive
                          ? "bg-white text-brand-navy"
                          : "bg-emerald-500 text-white"
                      )}
                    >
                      {sizesChosen}
                    </span>
                  )}

                  {/* stock label */}
                  {!outOfStock && !isChosen && (
                    <span
                      className={cn(
                        "text-[8px] font-black uppercase tracking-widest",
                        isActive ? "text-white/70" : "text-zinc-400"
                      )}
                    >
                      {stock} item{stock !== 1 ? "s" : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active-color label */}
          {activeTab && (
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                Selecting sizes for:
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-brand-navy/5 border border-brand-navy/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-brand-navy">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: resolveColor(activeTab) ?? activeTab }}
                />
                {activeTab}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── SIZE PICKER ────────────────────────────────────────────────── */}
      {(hasSizes || sizesForTab.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
              {hasColors && activeTab
                ? `Sizes — ${activeTab}`
                : "Select Size"}
            </h3>
            {selectedSizesForTab.length > 0 && (
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                {selectedSizesForTab.length} selected
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {sizesForTab.map((size) => {
              const stock = getStockForSize(size, hasColors ? activeTab : null);
              const outOfStock = stock <= 0;
              const isSelected = selectedSizesForTab.includes(size);

              return (
                <div key={size} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleSizeForTab(size)}
                    disabled={outOfStock}
                    aria-pressed={isSelected}
                    className={cn(
                      "relative h-11 min-w-[3rem] px-4 rounded-xl border-2 font-black text-xs transition-all duration-200 active:scale-95 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed",
                      isSelected
                        ? "border-brand-navy bg-brand-navy text-white shadow-lg shadow-brand-navy/25"
                        : "border-border/50 bg-white/90 text-zinc-700 hover:border-brand-navy/50 hover:bg-zinc-50"
                    )}
                  >
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                        <Check className="size-2" strokeWidth={3.5} color="white" />
                      </span>
                    )}
                    {size}
                  </button>
                  <span
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      outOfStock ? "text-rose-500" : isSelected ? "text-emerald-600" : "text-zinc-400"
                    )}
                  >
                    {outOfStock ? "sold out" : `${stock} left`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SELECTION SUMMARY ──────────────────────────────────────────── */}
      {selectedVariants.length > 0 && (
        <div className="rounded-2xl border border-border/30 bg-zinc-50/80 p-4 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-3">
            Your Selection
          </p>
          <div className="flex flex-col gap-2">
            {selectedVariants.map((v) => {
              const size =
                splitSizes(v.size).find((s) =>
                  (selectedSizesByColor[normalize(v.color)] ??
                    selectedSizesByColor[NO_COLOR_KEY] ??
                    []).includes(s)
                ) ??
                splitSizes(v.size)[0] ??
                "N/A";
              const color = normalize(v.color);
              const css = color ? resolveColor(color) : null;
              const stock = Math.max(0, v.inventory?.quantity ?? 0);
              const qty = qtyMap[v.id] ?? 1;

              const showColor = color.length > 0;
              const showSize = hasSizes && size && size !== "OS";
              const label = showColor && showSize 
                ? `${color} / Size ${size}` 
                : showColor 
                ? color 
                : `Size ${size}`;

              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-xl bg-white border border-border/30 px-3 py-2.5 shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {css && (
                      <span
                        className="h-4 w-4 flex-shrink-0 rounded-full border border-zinc-200"
                        style={{ backgroundColor: css }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-widest text-zinc-900 truncate">
                        {label}
                      </p>
                      <p className="text-xs font-black text-brand-navy mt-0.5">
                        ₦{Number(v.price ?? product.basePrice).toLocaleString()}
                      </p>
                      <p
                        className={cn(
                          "text-[9px] font-black uppercase tracking-widest mt-1",
                          stock <= 0
                            ? "text-rose-500"
                            : stock <= 3
                            ? "text-amber-500"
                            : "text-emerald-600"
                        )}
                      >
                        {stock <= 0
                          ? "Out of stock"
                          : `${stock} available`}
                      </p>
                    </div>
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setQtyMap((p) => ({
                          ...p,
                          [v.id]: Math.max(1, qty - 1),
                        }))
                      }
                      disabled={qty <= 1}
                      className="h-7 w-7 rounded-lg border border-border/50 bg-white flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-black text-zinc-900">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQtyMap((p) => ({
                          ...p,
                          [v.id]: Math.min(stock || 1, qty + 1),
                        }))
                      }
                      disabled={qty >= stock || stock <= 0}
                      className="h-7 w-7 rounded-lg border border-border/50 bg-white flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* total stock info */}
          <div className="flex items-center gap-2 pt-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
            <Zap className="size-3.5 fill-emerald-500" />
            {totalSelectedStock} item{totalSelectedStock !== 1 ? "s" : ""} available across your selection
          </div>
        </div>
      )}

      {/* ── ADD TO CART + SHARE ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5">
        <Button
          type="button"
          size="lg"
          onClick={handleAddToCart}
          className={cn(
            "w-full min-h-[3.5rem] rounded-2xl px-5 text-sm font-black tracking-widest transition-all touch-manipulation group",
            isOutOfStock
              ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/20 cursor-not-allowed"
              : "bg-brand-navy hover:bg-brand-navy/90 text-white shadow-xl shadow-brand-navy/20 active:scale-95"
          )}
          disabled={isOutOfStock}
        >
          <ShoppingCart className="mr-3 size-5 group-hover:scale-110 transition-transform" />
          {isOutOfStock
            ? "OUT OF STOCK"
            : existingCartItems.length > 0
            ? "UPDATE CART"
            : "ADD TO COLLECTION"}
        </Button>

        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={handleShare}
          className="w-full min-h-[3rem] rounded-2xl border-2 border-border/50 hover:text-brand-silver hover:border-brand-silver/50 transition-all glass-card touch-manipulation text-sm font-black tracking-widest"
        >
          <Share2 className="mr-3 size-4" />
          SHARE
        </Button>
      </div>
    </div>
  );
}

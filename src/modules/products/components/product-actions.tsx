"use client";

import { useState } from "react";
import { ShoppingCart, Heart, Share2, Check, Minus, Plus, Zap } from "lucide-react";
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
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const sizes = Array.from(new Set(product.variants.map((v: any) => v.size))).filter(Boolean);
  const colors = Array.from(new Set(product.variants.map((v: any) => v.color))).filter(Boolean);

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size to continue.");
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      toast.error("Please select a color to continue.");
      return;
    }

    // Find the specific variant
    const variant = product.variants.find((v: any) => 
        (sizes.length === 0 || v.size === selectedSize) && 
        (colors.length === 0 || v.color === selectedColor)
    );

    addItem({
      id: product.id,
      variantId: variant?.id || product.id,
      name: product.name,
      price: Number(variant?.price || product.basePrice),
      quantity: quantity,
      image: product.images?.[0],
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    });

    toast.success(`${product.name} added to your bag.`);
  };

  return (
    <div className="space-y-12">
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
                    "h-14 min-w-[4rem] px-5 rounded-2xl border-2 font-black text-sm transition-all active:scale-95",
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
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">Select Edition</h3>
            <div className="flex flex-wrap gap-4">
              {colors.map((color: any) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "group flex items-center gap-3 h-14 px-6 rounded-2xl border-2 transition-all active:scale-95",
                    selectedColor === color 
                      ? "border-brand-navy bg-brand-navy/5" 
                      : "border-border/50 hover:border-brand-navy/50 glass-card"
                  )}
                >
                  <div className="size-5 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: color?.toLowerCase() }} />
                  <span className={cn("text-xs font-black uppercase tracking-widest", selectedColor === color ? "text-brand-navy" : "text-foreground")}>
                    {color}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quantity & Actions */}
      <div className="space-y-8">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 glass-card rounded-2xl p-2 h-16 w-44">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-12 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                    <Minus className="size-5" />
                </Button>
                <span className="flex-1 text-center font-black text-xl tracking-tighter">{quantity}</span>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-12 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                    onClick={() => setQuantity(quantity + 1)}
                >
                    <Plus className="size-5" />
                </Button>
            </div>
            <div className="flex items-center gap-2 text-xs font-black text-emerald-500 uppercase tracking-widest">
                <Zap className="size-4 fill-emerald-500" />
                Limited Stock Available
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            size="lg" 
            onClick={handleAddToCart}
            className="flex-[2] bg-brand-navy hover:bg-brand-navy/90 text-white h-20 rounded-[2rem] text-lg font-black tracking-widest shadow-2xl shadow-brand-navy/30 group active:scale-95 transition-all"
          >
            <ShoppingCart className="mr-3 size-6 group-hover:scale-110 transition-transform" />
            ADD TO COLLECTION
          </Button>
          <div className="flex flex-1 gap-3">
            <Button size="icon" variant="outline" className="h-20 flex-1 rounded-[2rem] border-2 border-border/50 hover:text-brand-navy hover:border-brand-navy/50 transition-all glass-card">
              <Heart className="size-7" />
            </Button>
            <Button size="icon" variant="outline" className="h-20 flex-1 rounded-[2rem] border-2 border-border/50 hover:text-brand-silver hover:border-brand-silver/50 transition-all glass-card">
              <Share2 className="size-7" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, Zap, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { useCartStore } from "../store/cart.store";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function CartDrawer({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal, getItemCount } = useCartStore();
  const subtotal = getTotal();

  const handleCheckout = () => {
    onOpenChange(false);
    router.push("/checkout");
  };

  const itemCount = getItemCount();

  const getColorChipStyles = (color?: string) => {
    const normalized = String(color || "").trim().toLowerCase();
    const palette: Record<string, { bg: string; text: string }> = {
      white: { bg: "bg-slate-100 text-slate-900", text: "text-slate-900" },
      yellow: { bg: "bg-amber-100 text-amber-700", text: "text-amber-700" },
      pink: { bg: "bg-fuchsia-100 text-fuchsia-700", text: "text-fuchsia-700" },
      purple: { bg: "bg-violet-100 text-violet-700", text: "text-violet-700" },
      red: { bg: "bg-rose-100 text-rose-700", text: "text-rose-700" },
      blue: { bg: "bg-sky-100 text-sky-700", text: "text-sky-700" },
      green: { bg: "bg-emerald-100 text-emerald-700", text: "text-emerald-700" },
      black: { bg: "bg-slate-900 text-white", text: "text-white" },
      gray: { bg: "bg-slate-200 text-slate-900", text: "text-slate-900" },
      brown: { bg: "bg-amber-200 text-amber-900", text: "text-amber-900" },
      orange: { bg: "bg-orange-100 text-orange-700", text: "text-orange-700" },
    };

    const match = Object.entries(palette).find(([key]) => normalized.includes(key));
    if (match) {
      return match[1];
    }

    return { bg: "bg-slate-100 text-slate-900", text: "text-slate-900" };
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-screen h-screen p-0 border-none bg-white dark:bg-zinc-950 shadow-none rounded-none flex flex-col">
        <SheetHeader className="sticky top-0 z-40 bg-gradient-to-b from-white via-white to-white/95 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950/95 px-4 py-3 border-b border-border/10 shadow-sm">
          <div className="flex items-center justify-between w-full gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="size-9 bg-gradient-to-br from-brand-navy to-brand-navy/80 rounded-xl flex items-center justify-center text-white shadow-md shadow-brand-navy/10 flex-shrink-0">
                <ShoppingBag className="size-4" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <SheetTitle className="text-lg font-black tracking-tighter text-foreground">Your Bag</SheetTitle>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}</span>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="size-8 rounded-lg bg-muted/50 hover:bg-muted/80 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <X className="size-4" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-28 overscroll-contain">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 py-12 text-center space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-brand-mesh opacity-3 -z-10" />
              <div className="size-28 bg-gradient-to-br from-muted/30 to-muted/10 rounded-3xl flex items-center justify-center shadow-lg group">
                <ShoppingBag className="size-14 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="space-y-3 max-w-xs">
                <h4 className="font-black text-2xl tracking-tight text-foreground">Your bag is empty</h4>
                <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed">
                  Explore our collection and start building your style today.
                </p>
              </div>
              <Button 
                onClick={() => onOpenChange(false)}
                className="bg-brand-navy hover:bg-brand-navy/90 text-white rounded-2xl h-12 px-10 font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-navy/20 transition-all active:scale-95"
              >
                BROWSE CATALOGUE
              </Button>
            </div>
          ) : (
            <div className="px-3 py-3 space-y-2">
              {items.map((item, idx) => (
                <div 
                  key={item.variantId} 
                  className="group bg-white dark:bg-zinc-900/50 rounded-lg p-2 border border-border/20 hover:border-border/40 transition-all duration-300 hover:shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex gap-2.5">
                    {/* Product Image */}
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10 flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Zap className="size-5 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="space-y-0.5">
                        <div className="flex justify-between items-start gap-1.5">
                          <h4 className="font-black text-[13px] tracking-tight line-clamp-1 group-hover:text-brand-navy transition-colors flex-1 min-w-0">{item.name}</h4>
                          <button 
                            onClick={() => removeItem(item.variantId)}
                            className="size-5 rounded bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-rose-600 hover:text-rose-700 transition-all duration-200 flex-shrink-0"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.size && (
                            <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              {item.size}
                            </span>
                          )}
                          {item.color && (() => {
                            const styles = getColorChipStyles(item.color);
                            return (
                              <span className={cn("text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded", styles.bg, styles.text)}>
                                {item.color}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 bg-muted/40 dark:bg-zinc-800/40 rounded-md p-0.5">
                          <button 
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            className="size-5 rounded flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 transition-colors text-foreground"
                          >
                            <Minus className="size-2.5" />
                          </button>
                          <span className="text-[11px] font-black w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => {
                              const max = item.availableStock ?? Infinity;
                              if (item.quantity + 1 > max) {
                                import('sonner').then(({ toast }) => toast.error(`Only ${max} item(s) available.`));
                                return;
                              }
                              updateQuantity(item.variantId, item.quantity + 1);
                            }}
                            className={cn(
                              "size-5 rounded flex items-center justify-center transition-colors",
                              item.availableStock !== undefined && item.quantity >= item.availableStock 
                                ? "opacity-40 cursor-not-allowed" 
                                : "hover:bg-white dark:hover:bg-zinc-700 text-foreground"
                            )}
                            disabled={item.availableStock !== undefined && item.quantity >= item.availableStock}
                          >
                            <Plus className="size-2.5" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-black text-brand-navy dark:text-zinc-200">₦{((Number(item.price) || 0) * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="sticky bottom-0 z-40 bg-gradient-to-t from-white via-white to-white/95 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950/95 px-4 py-3 border-t border-border/10 shadow-2xl shadow-brand-navy/5">
            <div className="space-y-2.5">
              {/* Price Breakdown */}
              <div className="space-y-1.5 bg-muted/20 dark:bg-zinc-900/30 rounded-xl p-2.5 border border-border/20 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground/80">Subtotal</span>
                  <span className="font-black text-foreground">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                    <ShieldCheck className="size-3 text-emerald-600" />
                    Delivery
                  </span>
                  <span className="font-black text-emerald-600 uppercase text-[10px]">Free</span>
                </div>
                <Separator className="bg-border/30 my-1" />
                <div className="flex justify-between items-center">
                  <span className="font-black uppercase tracking-wider text-foreground">Total</span>
                  <span className="text-base font-black text-brand-navy dark:text-white tracking-tight">₦{subtotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button 
                onClick={handleCheckout}
                className="w-full h-10 bg-gradient-to-r from-brand-navy to-brand-navy/90 hover:from-brand-navy/90 hover:to-brand-navy text-white rounded-xl text-xs font-black tracking-widest shadow-lg shadow-brand-navy/20 group transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ShieldCheck className="size-3.5" />
                SECURE CHECKOUT
                <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs transition-colors", className)}>
            {children}
        </div>
    );
}

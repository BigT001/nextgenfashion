"use client";

import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Zap, Sparkles, ShieldCheck } from "lucide-react";
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
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function CartDrawer({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal, getItemCount } = useCartStore();
  const subtotal = getTotal();
  const freeShippingThreshold = 100000;
  const progressToFreeShipping = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = Math.max(freeShippingThreshold - subtotal, 0);

  const handleCheckout = () => {
    onOpenChange(false);
    router.push("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 glass-card border-none backdrop-blur-2xl bg-white/70 dark:bg-zinc-950/70 shadow-2xl">
        <SheetHeader className="p-8 border-b border-border/30">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-brand-navy/10 rounded-xl flex items-center justify-center text-brand-navy shadow-inner">
                <ShoppingBag className="size-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-black tracking-tighter">Your Bag</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{getItemCount()} LUXURY PIECES</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-xl hover:bg-brand-navy/5 hover:text-brand-navy">
              <X className="size-5" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        {/* Intelligence Layer: Free Shipping Tracker */}
        {items.length > 0 && (
          <div className="px-8 py-6 bg-zinc-50 dark:bg-zinc-900/30 border-b border-border/30 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              {remainingForFreeShipping > 0 ? (
                <>
                  <span className="text-muted-foreground">₦{remainingForFreeShipping.toLocaleString()} for Free Shipping</span>
                  <span className="text-brand-navy">{Math.round(progressToFreeShipping)}%</span>
                </>
              ) : (
                <span className="text-emerald-500 flex items-center gap-2">
                  <Sparkles className="size-3" /> COMPLIMENTARY SHIPPING UNLOCKED
                </span>
              )}
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-1000", remainingForFreeShipping === 0 ? "bg-emerald-500" : "bg-brand-navy")} 
                  style={{ width: `${progressToFreeShipping}%` }} 
                />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-brand-mesh opacity-5 -z-10" />
              <div className="size-24 bg-muted/50 rounded-[2rem] flex items-center justify-center shadow-inner group">
                <ShoppingBag className="size-10 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-2">
                <h4 className="font-black text-2xl tracking-tight">Your bag is empty</h4>
                <p className="text-sm font-medium text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                  Start curating your nextgen fashion collection today.
                </p>
              </div>
              <Button 
                onClick={() => onOpenChange(false)}
                className="bg-brand-navy hover:bg-brand-navy/90 text-white rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-navy/20 transition-all active:scale-95"
              >
                BROWSE CATALOGUE
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {items.map((item) => (
                <div key={item.variantId} className="p-8 flex gap-6 group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <div className="relative size-28 rounded-2xl overflow-hidden glass-card border-none shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full opacity-10">
                        <Zap className="size-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-sm tracking-tight line-clamp-2 group-hover:text-brand-navy transition-colors">{item.name}</h4>
                        <button 
                          onClick={() => removeItem(item.variantId)}
                          className="text-muted-foreground/30 hover:text-rose-500 p-1 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        {item.size && <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-border/50">SIZE: {item.size}</Badge>}
                        {item.color && <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-border/50">EDITION: {item.color}</Badge>}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-2 py-1">
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="size-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="size-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <p className="font-black text-sm tracking-tighter">₦{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="p-8 border-t border-border/30 bg-zinc-50 dark:bg-zinc-950/50 flex-col gap-6 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
            <div className="w-full space-y-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground uppercase tracking-widest">Subtotal</span>
                <span className="font-black">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground uppercase tracking-widest">Est. Logistics</span>
                <span className="text-emerald-500 font-black tracking-widest uppercase">
                    {remainingForFreeShipping === 0 ? "Complimentary" : "Calculated at checkout"}
                </span>
              </div>
              <Separator className="bg-border/30" />
              <div className="flex justify-between items-end">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Portfolio Total</span>
                <span className="text-3xl font-black text-brand-navy tracking-tighter">₦{subtotal.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="space-y-4">
                <Button 
                    onClick={handleCheckout}
                    className="w-full h-20 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-[2rem] text-lg font-black tracking-widest shadow-2xl shadow-brand-navy/30 group transition-all active:scale-[0.98]"
                >
                SECURE CHECKOUT
                <ArrowRight className="ml-3 size-6 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <div className="flex items-center justify-center gap-3 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">
                    <ShieldCheck className="size-4" />
                    Guaranteed Brand Integrity
                </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Badge({ className, children, variant }: { className?: string; children: React.ReactNode; variant?: string }) {
    return (
        <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
            {children}
        </div>
    );
}

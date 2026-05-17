"use client";

import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, Zap, ShieldCheck } from "lucide-react";
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 glass-card border-none backdrop-blur-2xl bg-white/70 dark:bg-zinc-950/70 shadow-2xl">
        <SheetHeader className="p-6 border-b border-border/20">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-brand-navy/10 rounded-xl flex items-center justify-center text-brand-navy shadow-inner">
                <ShoppingBag className="size-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-black tracking-tighter">Your Bag</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}</span>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

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
                  Start curating your nextgen kiddies collection today.
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
            <div className="divide-y divide-border/20">
              {items.map((item) => (
                <div key={item.variantId} className="p-6 flex gap-6 group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <div className="relative size-24 rounded-2xl overflow-hidden glass-card border-none shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full opacity-10">
                        <Zap className="size-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-black text-sm tracking-tight line-clamp-2 group-hover:text-brand-navy transition-colors leading-tight">{item.name}</h4>
                        <button 
                          onClick={() => removeItem(item.variantId)}
                          className="text-muted-foreground/30 hover:text-rose-500 p-1 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.size && <Badge className="text-[8px] font-black uppercase tracking-tighter border-border/50 bg-zinc-100 dark:bg-zinc-800">SIZE: {item.size}</Badge>}
                        {item.color && <Badge className="text-[8px] font-black uppercase tracking-tighter border-border/50 bg-zinc-100 dark:bg-zinc-800">EDITION: {item.color}</Badge>}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-1.5 py-0.5">
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="size-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Minus className="size-2.5" />
                        </button>
                        <span className="text-[11px] font-black w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="size-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Plus className="size-2.5" />
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
          <SheetFooter className="p-6 border-t border-border/20 bg-zinc-50/50 dark:bg-zinc-950/50 flex-col gap-4">
            <div className="w-full space-y-2">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-muted-foreground uppercase tracking-[0.1em]">Subtotal</span>
                <span className="font-black">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-muted-foreground uppercase tracking-[0.1em]">Logistics</span>
                <span className="text-zinc-400 font-black tracking-widest uppercase">Calculated at checkout</span>
              </div>
              <Separator className="bg-border/20 my-1" />
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total</span>
                <span className="text-2xl font-black text-brand-navy tracking-tighter">₦{subtotal.toLocaleString()}</span>
              </div>
            </div>
            
            <Button 
                onClick={handleCheckout}
                className="w-full h-16 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-2xl text-base font-black tracking-widest shadow-2xl shadow-brand-navy/20 group transition-all active:scale-[0.98]"
            >
              SECURE CHECKOUT
              <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </SheetFooter>
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

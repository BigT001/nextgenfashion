"use client";

import { usePOSStore } from "@/modules/pos/store/pos.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Banknote, 
  CreditCard, 
  Smartphone, 
  UserPlus, 
  Zap, 
  ShoppingCart,
  Percent,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";
import { POSCustomerSearch } from "./pos-customer-search";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface POSSummaryProps {
  onCheckout: (paymentMethod: "CASH" | "CARD" | "TRANSFER") => Promise<void>;
  isProcessing: boolean;
}

export function POSSummary({ onCheckout, isProcessing }: POSSummaryProps) {
  const { 
    cart, 
    customer, 
    subtotal, 
    taxAmount, 
    total, 
    discount, 
    discountType,
    setDiscount 
  } = usePOSStore();
  
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");

  return (
    <Card className="border-none shadow-2xl glass-card overflow-hidden flex flex-col h-full rounded-[2.5rem]">
      <CardHeader className="p-8 border-b border-border/50 bg-white/40 dark:bg-zinc-900/40">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                <ShoppingCart className="size-5 text-brand-navy" />
                Register
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Live Transaction</p>
            </div>
            <div className="size-10 rounded-2xl bg-brand-navy/5 flex items-center justify-center">
                <Hash className="size-5 text-brand-navy" />
            </div>
          </div>
          
          <POSCustomerSearch />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-8 space-y-6 overflow-y-auto scrollbar-hide">
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Item Tiers:</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-navy bg-brand-navy/5 px-3 py-1 rounded-full">Standard</span>
            </div>
            
            <div className="space-y-3">
                <div className="flex items-center justify-between group">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Global Discount:</span>
                    <div className="flex items-center gap-2">
                        <div className="flex rounded-lg overflow-hidden border border-zinc-200">
                            <button 
                                onClick={() => setDiscount(discount, "PERCENTAGE")}
                                className={cn("p-1.5", discountType === "PERCENTAGE" ? "bg-brand-navy text-white" : "bg-white text-zinc-400")}
                            >
                                <Percent className="size-3" />
                            </button>
                            <button 
                                onClick={() => setDiscount(discount, "FIXED")}
                                className={cn("p-1.5", discountType === "FIXED" ? "bg-brand-navy text-white" : "bg-white text-zinc-400")}
                            >
                                <Hash className="size-3" />
                            </button>
                        </div>
                        <Input 
                            type="number"
                            className="h-8 w-20 text-right text-xs font-bold border-zinc-200"
                            value={discount || ""}
                            placeholder="0"
                            onChange={(e) => setDiscount(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-brand-navy cursor-pointer">Edit Taxes:</span>
                    <span className="text-xs font-bold">7.5% (VAT)</span>
                </div>
            </div>
        </div>

        <div className="pt-6 border-t border-dashed border-border/50 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-muted-foreground">Sub Total:</span>
            <span className="font-black text-foreground">₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-muted-foreground">VAT (7.5%):</span>
            <span className="font-black text-foreground">₦{Math.round(taxAmount).toLocaleString()}</span>
          </div>
        </div>

        <div className="pt-6 bg-brand-navy/[0.02] p-6 rounded-3xl border border-brand-navy/10">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Final Total</span>
                    <p className="text-2xl font-black tracking-tighter text-emerald-500">₦{Math.round(total).toLocaleString()}</p>
                </div>
                <div className="space-y-1 text-right border-l border-brand-navy/10 pl-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount Due</span>
                    <p className="text-2xl font-black tracking-tighter text-rose-500">₦{Math.round(total).toLocaleString()}</p>
                </div>
            </div>
        </div>
      </CardContent>

      <CardFooter className="p-8 bg-zinc-50 dark:bg-zinc-900 flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { id: "CASH", icon: Banknote, color: "text-emerald-500", label: "Cash" },
            { id: "TRANSFER", icon: Smartphone, color: "text-blue-500", label: "Transfer" },
            { id: "CARD", icon: CreditCard, color: "text-purple-500", label: "Card" },
          ].map((method) => (
            <Button 
              key={method.id}
              variant="outline" 
              onClick={() => setPaymentMethod(method.id as any)}
              className={cn(
                "flex-col h-20 gap-2 border-2 transition-all rounded-2xl bg-white dark:bg-zinc-950 shadow-sm",
                paymentMethod === method.id 
                  ? "border-brand-navy bg-brand-navy/5 text-brand-navy shadow-lg shadow-brand-navy/10" 
                  : "hover:border-brand-navy/50 hover:bg-brand-navy/[0.02] border-border/50"
              )}
            >
              <method.icon className={cn("h-6 w-6", method.color)} />
              <span className="text-[9px] font-black uppercase tracking-widest">{method.label}</span>
            </Button>
          ))}
        </div>

        <Button 
          className="w-full h-20 text-xl font-black rounded-3xl bg-brand-navy hover:bg-brand-navy/90 text-white shadow-2xl shadow-brand-navy/40 active:scale-[0.98] transition-all group overflow-hidden relative"
          disabled={cart.length === 0 || isProcessing}
          onClick={() => onCheckout(paymentMethod)}
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          {isProcessing ? (
            <LoadingSpinner size="sm" variant="white" />
          ) : (
            <div className="flex items-center justify-center gap-3 relative z-10">
              <Zap className="size-6 fill-white animate-pulse" />
              COMPLETE TRANSACTION
            </div>
          )}
        </Button>
        
        <div className="pt-2">
            <Button variant="ghost" className="w-full h-8 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 hover:text-brand-navy hover:bg-transparent">
                Keyboard Shortcuts Help
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

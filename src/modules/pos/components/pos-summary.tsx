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
  Hash,
  PauseCircle,
  XCircle,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { POSCustomerSearch } from "./pos-customer-search";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
    setDiscount,
    clearCart,
    suspendSale
  } = usePOSStore();
  
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleCancel = () => {
    if (cart.length === 0) return;
    if (confirm("Are you sure you want to cancel this sale? All items will be removed.")) {
        clearCart();
        toast.success("Sale cancelled");
    }
  };

  const handleSuspend = () => {
    if (cart.length === 0) return;
    suspendSale();
    toast.success("Sale suspended successfully");
  };

  const handleCompleteClick = () => {
    if (cart.length === 0) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmPayment = async () => {
    setIsConfirmOpen(false);
    await onCheckout(paymentMethod);
  };

  return (
    <>
      <Card className="border-none shadow-2xl glass-card overflow-hidden flex flex-col h-fit rounded-[2.5rem]">
        <CardHeader className="p-8 border-b border-border/50 bg-white/40 dark:bg-zinc-900/40">
          <div className="space-y-6">
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-zinc-200">
                      <MoreHorizontal className="size-4" />
                  </Button>
                  <Button 
                      variant="outline" 
                      className="h-10 px-4 rounded-xl gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 font-bold text-xs"
                      onClick={handleSuspend}
                  >
                      <PauseCircle className="size-4" />
                      Suspend Sale
                  </Button>
                  <Button 
                      variant="outline" 
                      className="h-10 px-4 rounded-xl gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs"
                      onClick={handleCancel}
                  >
                      <XCircle className="size-4" />
                      Cancel Sale
                  </Button>
              </div>
            </div>
            
            <POSCustomerSearch />
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
          <div className="pt-6 bg-white/50 p-6 rounded-[2rem] border border-zinc-100">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <span className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Total</span>
                      <p className="text-3xl font-black tracking-tighter text-emerald-500">₦{Math.round(total).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1 text-right border-l border-zinc-200 pl-4">
                      <span className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Amount Due</span>
                      <p className="text-3xl font-black tracking-tighter text-orange-500">₦{Math.round(total).toLocaleString()}</p>
                  </div>
              </div>
          </div>

          <div className="space-y-4">
              <div className="flex items-center gap-3">
                  <div className="flex gap-2 w-full">
                      {["CASH", "TRANSFER", "POS"].map((method) => (
                          <Button 
                              key={method}
                              variant={paymentMethod === (method === "POS" ? "CARD" : method) ? "default" : "outline"}
                              size="sm"
                              className={cn(
                                  "flex-1 h-9 rounded-xl font-bold text-[10px] uppercase tracking-widest",
                                  paymentMethod === (method === "POS" ? "CARD" : method) ? "bg-blue-500 text-white border-none shadow-md shadow-blue-500/20" : "border-zinc-200"
                              )}
                              onClick={() => setPaymentMethod(method === "POS" ? "CARD" : method as any)}
                          >
                              {method}
                          </Button>
                      ))}
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                  <Button 
                      className="h-14 w-full rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 animate-pulse"
                      disabled={cart.length === 0 || isProcessing}
                      onClick={handleCompleteClick}
                  >
                      {isProcessing ? <LoadingSpinner size="sm" variant="white" /> : "Complete Sale"}
                  </Button>
              </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="border-none shadow-2xl bg-white dark:bg-zinc-950 rounded-[2.5rem] p-8 max-w-md">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Zap className="size-6 text-brand-navy" />
              Confirm POS Acquisition
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            {/* Items Summary list */}
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Items</span>
              {cart.map((item) => (
                <div key={item.variantId} className="flex justify-between items-center text-sm font-bold">
                  <div className="max-w-[220px]">
                    <p className="truncate text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                      {item.quantity} x ₦{item.price.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-foreground font-black">
                    ₦{(item.quantity * item.price).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="bg-zinc-100" />

            {/* Logistics & Payment Summary */}
            <div className="space-y-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                <span className="text-muted-foreground">Payment Mode</span>
                <Badge className="bg-blue-500/10 text-blue-600 border-none font-black text-[10px] tracking-widest px-3 py-1 uppercase rounded-full">
                  {paymentMethod}
                </Badge>
              </div>

              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                <span className="text-muted-foreground">Purchase Type</span>
                <Badge className="bg-amber-500/10 text-amber-600 border-none font-black text-[10px] tracking-widest px-3 py-1 uppercase rounded-full">
                  OFFLINE
                </Badge>
              </div>
              
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                <span className="text-muted-foreground">Client Signature</span>
                <span className="text-foreground font-black">
                  {customer?.name || "OFFLINE"}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Cash Tendered</span>
                <span className="text-xl font-black tracking-tight text-emerald-500">
                  ₦{Math.round(total).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Button 
              variant="outline" 
              className="h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border-zinc-200"
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20"
              onClick={handleConfirmPayment}
            >
              Confirm Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

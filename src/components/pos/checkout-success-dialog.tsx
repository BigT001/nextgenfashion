"use client";

import { useEffect, useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingBag, Printer, Mail, ArrowRight, Zap, Receipt, Smartphone, Banknote, CreditCard } from "lucide-react";
import confetti from "canvas-confetti";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BarcodeVisualizer } from "@/modules/products/components/barcode-visualizer";

interface CheckoutSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    orderNumber: string;
    totalAmount: number;
    itemCount: number;
    paymentMethod: string;
  } | null;
}

export function CheckoutSuccessDialog({
  isOpen,
  onClose,
  orderData
}: CheckoutSuccessDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      // Trigger celebratory confetti with brand colors
      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 35, spread: 360, ticks: 80, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 60 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#FF007A', '#00F0FF', '#FFFFFF'] });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#FF007A', '#00F0FF', '#FFFFFF'] });
      }, 250);
      
      setShowReceipt(false);
    }
  }, [isOpen]);

  if (!mounted || !orderData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass-card border-none p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 rounded-[3rem]">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
            {/* Left: Celebratory Success View */}
            <div className="bg-brand-mesh p-10 flex flex-col items-center justify-center text-center relative border-r border-white/10">
                <div className="absolute inset-0 bg-brand-navy/5 animate-pulse" />
                <div className="size-24 bg-white shadow-2xl rounded-3xl flex items-center justify-center mb-8 relative z-10 animate-bounce">
                    <CheckCircle2 className="size-12 text-emerald-500" />
                </div>
                <div className="relative z-10 space-y-4">
                    <h2 className="text-4xl font-black text-white tracking-tight leading-tight">Revenue <br />Secured</h2>
                    <Badge className="bg-white/10 text-white border-none font-black text-[10px] px-4 py-1 uppercase tracking-widest">
                        NEXTGEN FASHION OS
                    </Badge>
                </div>
            </div>

            {/* Right: Operational Breakdown & Receipt */}
            <div className="p-10 space-y-8 flex flex-col justify-center bg-white dark:bg-zinc-950">
                {!showReceipt ? (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center group">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Signature</span>
                                <span className="font-black text-sm tracking-tight text-brand-navy">{orderData.orderNumber}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payment</span>
                                <div className="flex items-center gap-2">
                                    {orderData.paymentMethod === "CASH" ? <Banknote className="size-4 text-emerald-500" /> : orderData.paymentMethod === "CARD" ? <CreditCard className="size-4 text-purple-500" /> : <Smartphone className="size-4 text-blue-500" />}
                                    <span className="font-bold text-xs uppercase tracking-widest">{orderData.paymentMethod}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Units</span>
                                <span className="font-black text-sm tracking-tight">{orderData.itemCount} PIECES</span>
                            </div>
                            
                            <Separator className="bg-border/30" />
                            
                            <div className="flex justify-between items-end pt-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Settled Total</span>
                                <span className="text-4xl font-black text-foreground tracking-tighter">
                                    ₦{orderData.totalAmount.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <Button 
                                onClick={() => setShowReceipt(true)}
                                variant="outline" 
                                className="h-16 gap-3 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-dashed hover:border-brand-navy/50 hover:bg-brand-navy/5 hover:text-brand-navy transition-all"
                            >
                                <Receipt className="size-5" />
                                VIEW THERMAL RECEIPT
                            </Button>
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-border/50 hover:bg-zinc-50 transition-all">
                                    <Mail className="size-4 mr-2" />
                                    DISPATCH EMAIL
                                </Button>
                                <Button variant="outline" className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-border/50 hover:bg-zinc-50 transition-all">
                                    <Printer className="size-4 mr-2" />
                                    AUTO PRINT
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-left-4 duration-500 space-y-6">
                        {/* Thermal Receipt Component */}
                        <div className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-3xl border-2 border-dashed border-border/50 font-mono text-[10px] uppercase tracking-tighter leading-relaxed">
                            <div className="text-center space-y-2 mb-6">
                                <p className="font-black text-sm tracking-[0.2em]">NEXTGEN FASHION</p>
                                <p>Operational Outlet 01</p>
                                <p className="opacity-50">Lagos, Nigeria</p>
                            </div>
                            <Separator className="my-4 border-zinc-200 dark:border-zinc-800" />
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span>ORDER ID:</span>
                                    <span className="font-black">{orderData.orderNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>TIMESTAMP:</span>
                                    <span className="font-black">{new Date().toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>OPERATOR:</span>
                                    <span className="font-black">ADMINISTRATOR</span>
                                </div>
                            </div>
                            <Separator className="my-4 border-zinc-200 dark:border-zinc-800 border-dashed" />
                            <div className="space-y-2">
                                <div className="flex justify-between font-black text-xs">
                                    <span>TOTAL SETTLED</span>
                                    <span>₦{orderData.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between opacity-60">
                                    <span>PAYMENT TYPE</span>
                                    <span>{orderData.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between opacity-60">
                                    <span>VAT INCL (7.5%)</span>
                                    <span>₦{(orderData.totalAmount * 0.075).toLocaleString()}</span>
                                </div>
                            </div>
                            <Separator className="my-6 border-zinc-200 dark:border-zinc-800 border-dashed" />
                            <div className="flex flex-col items-center gap-4">
                                <div className="opacity-80 scale-75 origin-center">
                                    <BarcodeVisualizer variantId={orderData.orderNumber} sku={orderData.orderNumber} />
                                </div>
                                <p className="font-black tracking-widest text-[8px] opacity-40">*** TRANSACTION VERIFIED ***</p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            onClick={() => setShowReceipt(false)}
                            className="w-full h-12 font-black text-[10px] uppercase tracking-widest hover:text-brand-navy"
                        >
                            <ArrowRight className="size-4 mr-2 rotate-180" />
                            BACK TO OVERVIEW
                        </Button>
                    </div>
                )}
            </div>
        </div>

        <DialogFooter className="p-8 bg-zinc-50 dark:bg-zinc-950 border-t border-border/30">
          <Button 
            onClick={onClose}
            className="w-full h-20 bg-brand-navy hover:bg-brand-navy/90 text-white font-black rounded-[2rem] shadow-2xl shadow-brand-navy/30 group transition-all active:scale-[0.98] text-lg tracking-widest"
          >
            INITIATE NEW SALE
            <Zap className="ml-3 size-6 fill-white group-hover:scale-110 transition-transform" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]", className)}>
      {children}
    </span>
  );
}

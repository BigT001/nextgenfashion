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
import { CheckCircle2, ShoppingBag, Printer, Mail, ArrowRight, Zap, Receipt, Smartphone, Banknote, CreditCard, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BarcodeVisualizer } from "@/modules/products/components/barcode-visualizer";
import { toast } from "sonner";
import { dispatchReceiptEmailAction } from "@/modules/pos/actions/sale.actions";

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
  const [isDispatching, setIsDispatching] = useState(false);

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

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Receipt - ${orderData.orderNumber}</title>
          <style>
            body {
              font-family: monospace;
              font-size: 12px;
              padding: 20px;
              width: 300px;
              margin: 0 auto;
              text-transform: uppercase;
              line-height: 1.5;
            }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .my-4 { margin: 15px 0; border-top: 1px dashed #000; }
            .flex { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="text-center bold" style="font-size: 16px; letter-spacing: 2px;">NEXTGEN KIDDIES</div>
          <div class="text-center">Operational Outlet 01</div>
          <div class="text-center" style="opacity: 0.7;">Lagos, Nigeria</div>
          <div class="my-4"></div>
          <div class="flex"><span>ORDER ID:</span><span class="bold">${orderData.orderNumber}</span></div>
          <div class="flex"><span>TIMESTAMP:</span><span class="bold">${new Date().toLocaleDateString()}</span></div>
          <div class="flex"><span>OPERATOR:</span><span class="bold">ADMINISTRATOR</span></div>
          <div class="my-4"></div>
          <div class="flex bold" style="font-size: 14px;"><span>TOTAL SETTLED</span><span>₦${orderData.totalAmount.toLocaleString()}</span></div>
          <div class="flex"><span>PAYMENT TYPE</span><span>${orderData.paymentMethod}</span></div>
          <div class="flex"><span>PURCHASE TYPE</span><span>OFFLINE</span></div>
          <div class="my-4"></div>
          <div class="text-center bold" style="font-size: 10px; margin-top: 20px;">*** TRANSACTION VERIFIED ***</div>
          <div class="text-center" style="font-size: 9px; opacity: 0.5; margin-top: 5px;">THANK YOU FOR YOUR PATRONAGE</div>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      toast.success("Thermal receipt sent to printer spool!");
    }
  };

  const handleDispatchEmail = async () => {
    const email = prompt("Enter customer email address for digital receipt dispatch:", "");
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsDispatching(true);
    try {
      const result = await dispatchReceiptEmailAction({
        email,
        orderNumber: orderData.orderNumber,
        totalAmount: orderData.totalAmount
      });

      if (result.success) {
        if (result.isMock) {
          toast.info(`Digital receipt simulation: Dispatched to ${email}`);
        } else {
          toast.success(`Digital receipt successfully dispatched to ${email}!`);
        }
      } else {
        toast.error(result.error || "Failed to dispatch email");
      }
    } catch (e) {
      toast.error("An error occurred while dispatching email.");
    } finally {
      setIsDispatching(false);
    }
  };

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
                    <h2 className="text-4xl font-black text-blue-600 tracking-tight leading-tight">Transaction <br />Completed</h2>
                    <Badge className="bg-white/10 text-white border-none font-black text-[10px] px-4 py-1 uppercase tracking-widest">
                        NEXTGEN KIDDIES OS
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
                                <Button 
                                  variant="outline" 
                                  onClick={handleDispatchEmail}
                                  disabled={isDispatching}
                                  className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-border/50 hover:bg-zinc-50 transition-all"
                                >
                                    {isDispatching ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Mail className="size-4 mr-2" />}
                                    DISPATCH EMAIL
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={handlePrint}
                                  className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-border/50 hover:bg-zinc-50 transition-all"
                                >
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
                                <p className="font-black text-sm tracking-[0.2em]">NEXTGEN KIDDIES</p>
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
                                    <span>PURCHASE TYPE</span>
                                    <span>OFFLINE</span>
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

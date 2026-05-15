"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/modules/cart/store/cart.store";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
    CreditCard, 
    Truck, 
    ArrowLeft, 
    Zap, 
    ShieldCheck, 
    ShoppingCart, 
    Lock,
    Smartphone,
    Banknote,
    User,
    ChevronRight,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createOrderAction } from "@/modules/orders/actions/order.actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type CheckoutStep = "IDENTITY" | "LOGISTICS" | "PAYMENT";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("IDENTITY");
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "TRANSFER" | "CASH">("CARD");

  // Financial Orchestration
  const subtotal = getTotal();
  const taxRate = 0.075; // 7.5% VAT
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;

  useEffect(() => {
    setMounted(true);
    if (mounted && items.length === 0) {
      router.push("/shop");
    }
    if (mounted && status === "unauthenticated") {
        router.push("/auth/login?callbackUrl=/checkout");
    }
  }, [items, router, mounted, status]);

  if (!mounted || items.length === 0 || status !== "authenticated") return (
      <div className="h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
      </div>
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step !== "PAYMENT") {
        const nextStep = step === "IDENTITY" ? "LOGISTICS" : "PAYMENT";
        setStep(nextStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const shippingInfo = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
    };

    const result = await createOrderAction({
      items: items.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: grandTotal,
      shippingInfo,
      paymentMethod,
    });

    if (result.success) {
      toast.success("Order received. Your luxury collection is being prepared.");
      clearCart();
      router.push("/checkout/success");
    } else {
      toast.error(result.error || "Transaction failed. Please verify your details.");
      setLoading(false);
    }
  };

  const steps: { id: CheckoutStep; label: string; icon: any }[] = [
    { id: "IDENTITY", label: "IDENTITY", icon: User },
    { id: "LOGISTICS", label: "LOGISTICS", icon: Truck },
    { id: "PAYMENT", label: "SETTLE", icon: CreditCard },
  ];

  return (
    <div className="relative min-h-screen bg-zinc-50 selection:bg-brand-navy/30 pb-32">
      <div className="absolute top-0 left-0 w-full h-[600px] bg-brand-mesh opacity-10" />
      
      <div className="container mx-auto px-6 relative z-10 pt-20">
        <div className="max-w-6xl mx-auto">
          {/* Executive Progress Orchestrator */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8 animate-slow-fade">
            <div className="flex items-center gap-6">
                <Link href="/shop" className="size-12 rounded-2xl glass-card flex items-center justify-center hover:bg-brand-navy hover:text-white transition-all shadow-sm group">
                    <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter">Secure Checkout</h1>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">REVENUE INTEGRITY GUARANTEED</p>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white/50 backdrop-blur-xl p-2 rounded-3xl border border-white/50 shadow-sm">
                {steps.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-4">
                        <button 
                            onClick={() => {
                                const currentIndex = steps.findIndex(st => st.id === step);
                                if (i < currentIndex) setStep(s.id);
                            }}
                            disabled={steps.findIndex(st => st.id === step) < i}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                                step === s.id ? "bg-brand-navy text-white shadow-xl shadow-brand-navy/20" : "text-muted-foreground/40"
                            )}
                        >
                            <s.icon className="size-4" />
                            <span className="hidden sm:inline">{s.label}</span>
                        </button>
                        {i < steps.length - 1 && <ChevronRight className="size-4 text-muted-foreground/20" />}
                    </div>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Left: Transaction Details */}
            <form id="checkout-form" onSubmit={handleSubmit} className="lg:col-span-7 space-y-12">
              
              {/* Step 1: Identity */}
              {step === "IDENTITY" && (
                <div className="glass-card p-12 rounded-[3rem] border-none shadow-2xl animate-in slide-in-from-bottom-8 duration-500 space-y-10">
                    <div className="flex items-center gap-5">
                        <div className="size-16 bg-brand-navy/10 rounded-2xl flex items-center justify-center text-brand-navy shadow-inner">
                            <User className="size-8" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black tracking-tight">Patron Identity</h2>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">PERSONAL INTEL FOR FULFILLMENT</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3 md:col-span-2">
                            <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Full Legal Identity</Label>
                            <Input 
                                id="fullName" 
                                name="fullName" 
                                defaultValue={session?.user?.name || ""}
                                placeholder="ENTER FULL NAME" 
                                required 
                                className="h-20 rounded-3xl glass-card border-none bg-zinc-50/50 focus-visible:ring-brand-navy font-bold text-lg px-8" 
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Digital Contact (Email)</Label>
                            <Input 
                                id="email" 
                                name="email" 
                                type="email" 
                                defaultValue={session?.user?.email || ""}
                                readOnly
                                placeholder="NAME@DOMAIN.COM" 
                                required 
                                className="h-20 rounded-3xl glass-card border-none bg-zinc-200/50 cursor-not-allowed font-bold text-lg px-8" 
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Secure Communications (Phone)</Label>
                            <Input id="phone" name="phone" type="tel" placeholder="+234 ..." required className="h-20 rounded-3xl glass-card border-none bg-zinc-50/50 focus-visible:ring-brand-navy font-bold text-lg px-8" />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-20 bg-zinc-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 group">
                        PROCEED TO LOGISTICS
                        <ArrowLeft className="ml-3 size-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
              )}

              {/* Step 2: Logistics */}
              {step === "LOGISTICS" && (
                <div className="glass-card p-12 rounded-[3rem] border-none shadow-2xl animate-in slide-in-from-bottom-8 duration-500 space-y-10">
                    <div className="flex items-center gap-5">
                        <div className="size-16 bg-brand-silver/10 rounded-2xl flex items-center justify-center text-brand-silver shadow-inner">
                            <Truck className="size-8" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black tracking-tight">Delivery Logistics</h2>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">GLOBAL EXPRESS FULFILLMENT</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3 md:col-span-2">
                            <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Fulfillment Address (Physical)</Label>
                            <Input id="address" name="address" placeholder="DESTINATION STREET & HOUSE" required className="h-20 rounded-3xl glass-card border-none bg-zinc-50/50 focus-visible:ring-brand-navy font-bold text-lg px-8" />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Logistics Hub (City)</Label>
                            <Input id="city" name="city" placeholder="LAGOS, ABUJA, ETC." required className="h-20 rounded-3xl glass-card border-none bg-zinc-50/50 focus-visible:ring-brand-navy font-bold text-lg px-8" />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="zip" className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Postcode (Optional)</Label>
                            <Input id="zip" name="zip" placeholder="000000" className="h-20 rounded-3xl glass-card border-none bg-zinc-50/50 focus-visible:ring-brand-navy font-bold text-lg px-8" />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button type="button" onClick={() => setStep("IDENTITY")} variant="outline" className="h-20 px-8 rounded-[2rem] border-none glass-card font-black text-[10px] uppercase tracking-widest group">
                            <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
                        </Button>
                        <Button type="submit" className="flex-1 h-20 bg-zinc-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 group">
                            PROCEED TO SETTLEMENT
                            <ArrowLeft className="ml-3 size-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {step === "PAYMENT" && (
                <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="glass-card p-12 rounded-[3rem] border-none shadow-2xl space-y-12">
                        <div className="flex items-center gap-5">
                            <div className="size-16 bg-brand-navy/10 rounded-2xl flex items-center justify-center text-brand-navy shadow-inner">
                                <CreditCard className="size-8" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black tracking-tight">Settlement</h2>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">SECURE FINANCIAL ORCHESTRATION</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { id: "CARD", label: "DEBIT CARD", icon: CreditCard, color: "text-purple-500" },
                                { id: "TRANSFER", label: "BANK TRANS", icon: Smartphone, color: "text-blue-500" },
                                { id: "CASH", label: "CASH", icon: Banknote, color: "text-emerald-500" }
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setPaymentMethod(method.id as any)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-10 rounded-[2.5rem] border-2 transition-all gap-6 group relative overflow-hidden",
                                        paymentMethod === method.id 
                                        ? "border-brand-navy bg-brand-navy/5 text-brand-navy shadow-2xl shadow-brand-navy/10 scale-105" 
                                        : "border-border/30 hover:border-brand-navy/30 hover:bg-zinc-50"
                                    )}
                                >
                                    {paymentMethod === method.id && <div className="absolute top-4 right-4 animate-in zoom-in"><Sparkles className="size-4" /></div>}
                                    <method.icon className={cn("size-10 group-hover:scale-110 transition-transform", paymentMethod === method.id ? "text-brand-navy" : "text-zinc-400")} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">{method.label}</span>
                                </button>
                            ))}
                        </div>
                        
                        <div className="bg-zinc-950 text-white rounded-3xl p-8 flex gap-6 shadow-2xl overflow-hidden relative">
                            <div className="absolute inset-0 bg-brand-mesh opacity-10" />
                            <ShieldCheck className="size-8 text-brand-navy flex-shrink-0 relative z-10 animate-pulse" />
                            <div className="relative z-10 space-y-1">
                                <h4 className="text-sm font-black uppercase tracking-widest">Financial Integrity Verified</h4>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                                    Your data is secured with industrial-grade 256-bit encryption.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button type="button" onClick={() => setStep("LOGISTICS")} variant="outline" className="h-20 px-8 rounded-[2rem] border-none glass-card font-black text-[10px] uppercase tracking-widest group">
                            <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 h-20 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-brand-navy/30 transition-all active:scale-95 group disabled:opacity-50"
                        >
                            {loading ? (
                                <LoadingSpinner size="sm" variant="white" />
                            ) : (
                                <>
                                    <Lock className="mr-3 size-5" />
                                    AUTHORISE TRANSACTION
                                </>
                            )}
                        </Button>
                    </div>
                </div>
              )}
            </form>

            {/* Right: Revenue Summary */}
            <div className="lg:col-span-5 lg:sticky lg:top-32 animate-slow-fade">
              <div className="glass-card p-12 rounded-[3.5rem] border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] space-y-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-mesh opacity-5 pointer-events-none" />
                <div className="flex items-center gap-4">
                    <div className="size-10 bg-brand-navy/10 rounded-xl flex items-center justify-center text-brand-navy">
                        <ShoppingCart className="size-5" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Order Portfolio</h2>
                </div>
                
                <div className="space-y-8 max-h-[350px] overflow-y-auto pr-4 scrollbar-hide">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-6 group">
                      <div className="size-24 rounded-3xl bg-zinc-50 border-none relative overflow-hidden flex-shrink-0 glass-card">
                        {item.image && <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="text-sm font-black tracking-tight line-clamp-1 group-hover:text-brand-navy transition-colors">{item.name}</h4>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-border/50">QTY: {item.quantity}</Badge>
                            {item.size && <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-border/50">SIZE: {item.size}</Badge>}
                        </div>
                        <p className="text-sm font-black tracking-tighter">₦{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-6 border-t border-border/30">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-black">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground">VAT (7.5%)</span>
                    <span className="font-black">₦{Math.round(taxAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground">Logistics</span>
                    <span className="text-emerald-500 font-black tracking-[0.2em]">COMPLIMENTARY</span>
                  </div>
                  <div className="pt-8 mt-4 border-t border-border/30">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Portfolio Total</span>
                      <span className="text-4xl font-black tracking-tighter text-brand-navy">₦{Math.round(grandTotal).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 opacity-40">
                    <ShieldCheck className="size-4" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em]">NextGen Integrity Standard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

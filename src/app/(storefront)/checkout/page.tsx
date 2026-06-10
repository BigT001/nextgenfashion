"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/modules/cart/store/cart.store";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Truck,
    ArrowLeft,
    ShieldCheck,
    ShoppingCart,
    User,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createOrderAction } from "@/modules/orders/actions/order.actions";
import { validateCartItemsAction } from "./validate-cart-action";
import { getCustomerDetailAction } from "@/modules/customers/actions/customer.actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";

type CheckoutStep = "IDENTITY" | "LOGISTICS";

type CheckoutPaymentMethod = "CARD" | "TRANSFER" | "CASH" | "POS";
type SaleStatusType = import("@prisma/client").SaleStatus;

const detectFlutterwavePaymentMethod = (response: any): CheckoutPaymentMethod => {
  const normalizeValue = (value: unknown) => (typeof value === "string" ? value.toLowerCase().trim() : "");
  const transferRegex = /\b(bank|transfer|banktransfer|ussd|account|account_bank|account_number|bank_account|bank_account)\b/;
  const cardRegex = /\b(card|visa|mastercard|debit|credit|chip|auth_model|payment_card)\b/;
  const posRegex = /\b(pos|point\s*of\s*sale)\b/;
  const cashRegex = /\b(cash|cash_on_delivery|cod)\b/;

  const collectValues = (payload: any, result: string[] = []): string[] => {
    if (payload == null) return result;
    if (typeof payload === "string") {
      result.push(normalizeValue(payload));
      return result;
    }
    if (typeof payload === "number" || typeof payload === "boolean") {
      result.push(String(payload).toLowerCase());
      return result;
    }
    if (Array.isArray(payload)) {
      for (const item of payload) collectValues(item, result);
      return result;
    }
    if (typeof payload === "object") {
      for (const [key, value] of Object.entries(payload)) {
        result.push(normalizeValue(key));
        collectValues(value, result);
      }
      return result;
    }
    return result;
  };

  const values = collectValues(response).filter(Boolean);
  const combined = values.join(" ");

  if (transferRegex.test(combined)) return "TRANSFER";
  if (posRegex.test(combined)) return "POS";
  if (cashRegex.test(combined)) return "CASH";
  if (cardRegex.test(combined)) return "CARD";

  if (String(response?.payment_options || "").toLowerCase().includes("bank")) return "TRANSFER";
  return "CARD";
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, getTotal, clearCart, removeItem } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("IDENTITY");
  const paymentMethod: "CARD" | "TRANSFER" | "CASH" = "CARD";
  const [txRef] = useState(() => `NG-${Date.now().toString(36).toUpperCase()}`);
  const [isNavigatingToSuccess, setIsNavigatingToSuccess] = useState(false);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    address: "",
    city: "",
    zip: "",
  });
  const [formErrors, setFormErrors] = useState<{ fullName?: string; email?: string; phone?: string }>({});

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const populateUserDetails = (profile: any | null, user: any | null, current: typeof shippingInfo) => ({
    fullName: profile?.name || user?.name || current.fullName,
    email: profile?.email || user?.email || current.email,
    phone: profile?.phone || current.phone,
    address: profile?.address || current.address,
    city: current.city,
    zip: current.zip,
  });

  const validateIdentityStep = () => {
    const errors: typeof formErrors = {};

    if (!shippingInfo.fullName.trim()) {
      errors.fullName = "Full name is required.";
    }

    if (!shippingInfo.email.trim()) {
      errors.email = "Email is required.";
    } else if (!validateEmail(shippingInfo.email)) {
      errors.email = "Enter a valid email address.";
    }

    if (!shippingInfo.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!/^\d+$/.test(shippingInfo.phone)) {
      errors.phone = "Phone must contain only numbers.";
    } else if (shippingInfo.phone.length > 11) {
      errors.phone = "Phone number cannot exceed 11 digits.";
    } else if (shippingInfo.phone.length < 7) {
      errors.phone = "Phone number must have at least 7 digits.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Financial Orchestration
  const subtotal = getTotal();
  const taxAmount = 0; // VAT disabled
  const grandTotal = subtotal;

  const customerId = (session?.user as any)?.customerId;

  useEffect(() => {
    if (items.length === 0 && !isNavigatingToSuccess) {
      router.push("/shop");
    }
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/checkout");
    }
  }, [items, router, status, isNavigatingToSuccess]);

  useEffect(() => {
    if (!customerId || status !== "authenticated") return;

    setIsProfileLoading(true);
    getCustomerDetailAction(customerId)
      .then((result) => {
        if (result.success) {
          setCustomerProfile(result.data);
        }
      })
      .catch((error) => console.error("Failed to load customer profile:", error))
      .finally(() => setIsProfileLoading(false));
  }, [customerId, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setShippingInfo((current) => populateUserDetails(customerProfile, session?.user as any, current));
  }, [customerProfile, session?.user, status]);

  const fwConfig = useMemo(
    () => ({
      public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || "",
      tx_ref: txRef,
      amount: grandTotal,
      currency: "NGN",
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: shippingInfo.email,
        phone_number: shippingInfo.phone,
        name: shippingInfo.fullName,
      },
      customizations: {
        title: "NextGen Fashion",
        description: "Payment for luxury collection",
        logo: "https://nextgenfashion.vercel.app/logo.png",
      },
    }),
    [grandTotal, shippingInfo.email, shippingInfo.phone, shippingInfo.fullName, txRef]
  );

  const handleFlutterPayment = useFlutterwave(fwConfig);

  if (items.length === 0 || status !== "authenticated") return (
      <div className="h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
      </div>
  );

  const validateCartBeforeCheckout = async () => {
    const payloadItems = items.map((item) => ({
      productId: item.id,
      variantId: item.variantId,
    }));

    const validation = await validateCartItemsAction(payloadItems);
    if (!validation.success) {
      console.warn("[checkout] invalid cart items detected", validation.invalidItems);
      validation.invalidItems?.forEach((item) => removeItem(item.variantId));
      if (items.length === validation.invalidItems?.length) {
        toast.error("Your cart contained only unavailable items. It has been cleared.");
        router.push("/shop");
        return false;
      }
      toast.error("Some unavailable items were removed from your cart. Please review the remaining items.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === "IDENTITY") {
      if (!validateIdentityStep()) {
        return;
      }
      setStep("LOGISTICS");
      return;
    }

    setLoading(true);
    const isValidCart = await validateCartBeforeCheckout();
    if (!isValidCart) {
      setLoading(false);
      return;
    }

    if (paymentMethod === "CARD" || paymentMethod === "TRANSFER") {
      handleFlutterPayment({
        callback: async (response) => {
          const rawResponse = response as any;
          const paymentStatus = String(
            rawResponse.status || rawResponse.payment_status || rawResponse?.data?.status || ""
          ).toLowerCase();
          console.debug("Flutterwave callback response:", rawResponse);

          const isPaymentSuccessful = ["successful", "success", "completed", "approved"].includes(paymentStatus)
            || rawResponse?.success === true
            || rawResponse?.status === true
            || rawResponse?.data?.status === "successful";

          if (isPaymentSuccessful) {
            const paymentRef = String(
              rawResponse.transaction_id ||
              rawResponse.tx_ref ||
              rawResponse.id ||
              rawResponse?.data?.tx_ref ||
              rawResponse?.data?.transaction_id ||
              ""
            );
            const detectedPaymentMethod = detectFlutterwavePaymentMethod(rawResponse);
            console.debug("Detected payment method from Flutterwave response:", detectedPaymentMethod);
            const orderItems = items.map((item) => ({
              productId: item.id,
              variantId: item.variantId,
              quantity: item.quantity,
              price: Number(item.price) || 0,
            }));
            console.log("[checkout] sending order payload", {
              items: orderItems,
              totalAmount: grandTotal,
              paymentMethod,
              customerId: (session?.user as any)?.customerId,
            });
            console.log("[checkout] raw items", JSON.stringify(items.map(item => ({
              id: item.id,
              productId: item.id,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              name: item.name,
            })), null, 2));
            const result = await createOrderAction({
              items: orderItems,
              totalAmount: grandTotal,
              shippingInfo,
              paymentMethod: detectedPaymentMethod,
              paymentRef: paymentRef || undefined,
              paymentProviderData: rawResponse,
              status: "COMPLETED" as SaleStatusType,
              customerId: (session?.user as any)?.customerId,
            });
            console.debug("[checkout] createOrderAction result", result);

            if (result.success) {
              const orderData = result as { success: true; data: { orderNumber: string } };
              toast.success("Purchase successful! Check your email for your order confirmation and delivery details.");
              setIsNavigatingToSuccess(true);
              clearCart();
              router.push(`/checkout/success?orderNumber=${encodeURIComponent(orderData.data.orderNumber)}&totalAmount=${Math.round(grandTotal)}`);
            } else {
              const errorResult = result as { success: false; error: string | null };
              console.error("Order creation failed after successful payment:", errorResult.error);
              toast.error(errorResult.error || "Payment succeeded but order creation failed. Please contact support.");
            }
          } else if (paymentStatus === "pending") {
            toast.warning("Payment is pending. Please wait a moment and check your bank.");
          } else {
            console.error("Flutterwave payment callback did not return success:", rawResponse);
            toast.error("Payment was not successful. Please try again.");
          }
          closePaymentModal();
          setLoading(false);
        },
        onClose: () => {
          setLoading(false);
          toast.error("Payment cancelled. You can try again.");
        },
      });
      return;
    }

    const orderItems = items.map((item) => ({
      productId: item.id,
      variantId: item.variantId,
      quantity: item.quantity,
      price: Number(item.price) || 0,
    }));
    console.log("[checkout] sending order payload", {
      items: orderItems,
      totalAmount: grandTotal,
      paymentMethod,
      customerId: (session?.user as any)?.customerId,
    });
    const result = await createOrderAction({
      items: orderItems,
      totalAmount: grandTotal,
      shippingInfo,
      paymentMethod,
      status: "PENDING" as SaleStatusType,
      customerId: (session?.user as any)?.customerId,
    });

    if (result.success) {
      const orderData = result as { success: true; data: { orderNumber: string } };
      toast.success("Purchase successful! Check your email for your order confirmation and delivery details.");
      setIsNavigatingToSuccess(true);
      clearCart();
      router.push(`/checkout/success?orderNumber=${encodeURIComponent(orderData.data.orderNumber)}&totalAmount=${Math.round(grandTotal)}`);
    } else {
      const errorResult = result as { success: false; error: string | null };
      toast.error(errorResult.error || "Transaction failed. Please verify your details.");
      setLoading(false);
    }
  };

  const steps: { id: CheckoutStep; label: string; icon: LucideIcon }[] = [
    { id: "IDENTITY", label: "PROFILE", icon: User },
    { id: "LOGISTICS", label: "DELIVERY", icon: Truck },
  ];

  return (
    <div className="relative min-h-screen bg-zinc-50 selection:bg-brand-navy/30 pb-32">
      <div className="absolute top-0 left-0 w-full h-[600px] bg-brand-mesh opacity-10" />
      
      <div className="container mx-auto px-0 sm:px-6 relative z-10 pt-10 sm:pt-20">
        <div className="max-w-6xl mx-auto">
          {/* Executive Progress Orchestrator */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6 animate-slow-fade">
            <div className="flex items-center gap-4">
                <Link href="/shop" className="size-12 rounded-2xl glass-card flex items-center justify-center hover:bg-brand-navy hover:text-white transition-all shadow-sm group">
                    <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div className="space-y-1">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">Secure Checkout</h1>
                </div>
            </div>

            {/* Top progress removed - moved into Patron Account card for easier navigation */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Left: Transaction Details */}
            <form id="checkout-form" onSubmit={handleSubmit} className="lg:col-span-7 space-y-10">
              
              {/* Persistent step tabs for consistent navigation */}
              <div className="mb-6 overflow-x-auto">
                <div className="inline-flex min-w-full items-center gap-3 rounded-full bg-zinc-100/90 p-1.5 shadow-sm border border-zinc-200">
                  {steps.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        if (s.id === "LOGISTICS" && step === "IDENTITY" && !validateIdentityStep()) return;
                        setStep(s.id);
                      }}
                      className={cn(
                        "flex min-w-[150px] flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-[11px] font-black uppercase tracking-[0.28em] transition-all whitespace-nowrap",
                        step === s.id
                          ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/10"
                          : "bg-white text-zinc-600 border border-transparent hover:border-brand-navy/80 hover:bg-white/90"
                      )}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-navy shadow-sm">
                        <s.icon className="size-4" />
                      </span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 1: Identity */}
              {step === "IDENTITY" && (
                <div className="glass-card p-6 sm:p-10 rounded-[2.5rem] border-none shadow-2xl animate-in slide-in-from-bottom-8 duration-500 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="relative size-12 rounded-3xl overflow-hidden bg-brand-navy/10 shadow-inner">
                          {customerProfile?.image || session?.user?.image ? (
                            <Image src={customerProfile?.image || session?.user?.image || ""} alt="Profile" fill className="object-cover" />
                          ) : (
                            <div className="size-12 flex items-center justify-center text-brand-navy bg-zinc-100">
                              <User className="size-5" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Profile details</p>
                            <h2 className="text-2xl font-black tracking-tight">Your account</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-3 md:col-span-2">
                            <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Full Legal Name</Label>
                            <Input 
                                id="fullName" 
                                name="fullName" 
                                value={shippingInfo.fullName}
                                onChange={(e) => {
                                  setShippingInfo({ ...shippingInfo, fullName: e.target.value });
                                  if (formErrors.fullName) setFormErrors((current) => ({ ...current, fullName: undefined }));
                                }}
                                placeholder="Enter full name" 
                                required 
                                className="h-16 sm:h-20 rounded-3xl glass-card border-none bg-zinc-50/50 focus-visible:ring-brand-navy font-bold text-lg px-6" 
                            />
                            {formErrors.fullName && <p className="text-xs text-rose-600 mt-1 ml-2">{formErrors.fullName}</p>}
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Digital Contact (Email)</Label>
                            <Input 
                                id="email" 
                                name="email" 
                                type="email" 
                                inputMode="email"
                                autoComplete="email"
                                value={shippingInfo.email}
                                onChange={(e) => {
                                  setShippingInfo({ ...shippingInfo, email: e.target.value });
                                  if (formErrors.email) setFormErrors((current) => ({ ...current, email: undefined }));
                                }}
                                placeholder="name@domain.com" 
                                required 
                                className="h-16 sm:h-20 rounded-3xl glass-card border-none bg-zinc-50/50 focus-visible:ring-brand-navy font-bold text-lg px-6" 
                            />
                            {formErrors.email && <p className="text-xs text-rose-600 mt-1 ml-2">{formErrors.email}</p>}
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Secure Communications (Phone)</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={11}
                                value={shippingInfo.phone}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                                  setShippingInfo({ ...shippingInfo, phone: digits });
                                  if (formErrors.phone) setFormErrors((current) => ({ ...current, phone: undefined }));
                                }}
                                placeholder="08012345678"
                                required
                                className="h-16 sm:h-20 rounded-3xl glass-card border-none bg-zinc-50/50 focus-visible:ring-brand-navy font-bold text-lg px-6" 
                            />
                            {formErrors.phone && <p className="text-xs text-rose-600 mt-1 ml-2">{formErrors.phone}</p>}
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-20 bg-zinc-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 group">
                        PROCEED TO DELIVERY
                        <ArrowLeft className="ml-3 size-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
              )}

              {/* Step 2: Logistics */}
              {step === "LOGISTICS" && (
                <div className="glass-card p-6 sm:p-10 rounded-[2.5rem] border-none shadow-2xl animate-in slide-in-from-bottom-8 duration-500 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-brand-silver/10 rounded-3xl flex items-center justify-center text-brand-silver shadow-inner">
                            <Truck className="size-5" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Delivery</p>
                            <h2 className="text-2xl font-black tracking-tight">Shipping details</h2>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3 md:col-span-2">
                            <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Fulfillment Address (Physical)</Label>
                            <Input id="address" name="address" value={shippingInfo.address} onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })} placeholder="DESTINATION STREET & HOUSE" required className="h-20 rounded-3xl glass-card border-none bg-zinc-50/50 focus-visible:ring-brand-navy font-bold text-lg px-8" />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Delivery Hub (City)</Label>
                            <Input id="city" name="city" value={shippingInfo.city} onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })} placeholder="LAGOS, ABUJA, ETC." required className="h-20 rounded-3xl glass-card border-none bg-zinc-50/50 focus-visible:ring-brand-navy font-bold text-lg px-8" />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="zip" className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-60">Postcode (Optional)</Label>
                            <Input id="zip" name="zip" value={shippingInfo.zip} onChange={(e) => setShippingInfo({ ...shippingInfo, zip: e.target.value })} placeholder="000000" className="h-20 rounded-3xl glass-card border-none bg-zinc-50/50 focus-visible:ring-brand-navy font-bold text-lg px-8" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Button type="submit" disabled={loading} className="w-full h-24 bg-zinc-950 text-white rounded-[2rem] font-black text-base uppercase tracking-[0.35em] shadow-[0_20px_40px_-20px_rgba(15,23,42,0.5)] transition-all active:scale-[0.98] group disabled:opacity-60">
                            {loading ? (
                                "PROCESSING PAYMENT..."
                            ) : (
                                <>
                                    AUTHORISE PAYMENT
                                    <ArrowLeft className="ml-3 size-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
              )}
            </form>

            {/* Right: Revenue Summary */}
            <div className="order-first lg:order-none lg:col-span-5 lg:sticky lg:top-32 animate-slow-fade">
              <div className="glass-card p-8 sm:p-12 rounded-[3.5rem] border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] space-y-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-mesh opacity-5 pointer-events-none" />
                <div className="flex items-center gap-4">
                    <div className="size-10 bg-brand-navy/10 rounded-xl flex items-center justify-center text-brand-navy">
                        <ShoppingCart className="size-5" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Orders</h2>
                </div>
                
                <div className="space-y-8 max-h-[350px] overflow-y-auto pr-0 sm:pr-4 scrollbar-hide">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-4 group">
                      <div className="size-24 rounded-3xl bg-zinc-50 border-none relative overflow-hidden flex-shrink-0 glass-card">
                        {item.image && <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />}
                      </div>
                              <div className="flex-1 space-y-2">
                          <h4 className="text-sm font-black tracking-tight line-clamp-1 group-hover:text-brand-navy transition-colors">{item.name}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-border/50">QTY: {item.quantity}</Badge>
                            {item.size && <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-border/50">SIZE: {item.size}</Badge>}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">₦{(Number(item.price) || 0).toLocaleString()} each</p>
                            <p className="text-sm font-black tracking-tighter">₦{((Number(item.price) || 0) * item.quantity).toLocaleString()}</p>
                          </div>
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
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-muted-foreground/60 font-black tracking-[0.2em]">—</span>
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

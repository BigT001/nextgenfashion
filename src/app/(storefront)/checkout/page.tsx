"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/modules/cart/store/cart.store";
import { useSession } from "next-auth/react";
import { trackPixelEvent } from "@/lib/meta-pixel";
import { logger } from "@/lib/logger";
import { useCartSync } from "@/modules/cart/hooks/use-cart-sync";
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
    ChevronDown,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createOrderAction } from "@/modules/orders/actions/order.actions";
import { validateCartItemsAction } from "./validate-cart-action";
import { getCustomerDetailAction } from "@/modules/customers/actions/customer.actions";
import {
  getProvincesAction,
  getCitiesAction,
  getAreasAction,
  getShippingFeeAction,
} from "@/modules/delivery/actions/actions";
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
  
  useCartSync();

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
    provinceCode: "",
    provinceName: "",
    cityCode: "",
    cityName: "",
    districtCode: "",
    districtName: "",
    deliveryFee: 3500,
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
    provinceCode: current.provinceCode || "",
    provinceName: current.provinceName || "",
    cityCode: current.cityCode || "",
    cityName: current.cityName || "",
    districtCode: current.districtCode || "",
    districtName: current.districtName || "",
    deliveryFee: current.deliveryFee || 3500,
  });

  const [provinces, setProvinces] = useState<{ code: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ code: string; name: string }[]>([]);
  const [areas, setAreas] = useState<{ code: string; name: string }[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedArea, setSelectedArea] = useState("");

  const [shippingFee, setShippingFee] = useState(3500);
  const [isFeeLoading, setIsFeeLoading] = useState(false);

  const totalWeight = useMemo(() => {
    return items.reduce((sum, item) => {
      const itemWeight = Number(item.weight) || 0.5;
      return sum + itemWeight * item.quantity;
    }, 0);
  }, [items]);

  useEffect(() => {
    async function loadProvinces() {
      const res = await getProvincesAction();
      if (res.success && res.data) {
        setProvinces(res.data);
      } else {
        toast.error("Failed to load provinces.");
      }
    }
    loadProvinces();
  }, []);

  // ── track InitiateCheckout on checkout mount ─────────────────────────────
  useEffect(() => {
    if (items.length > 0) {
      trackPixelEvent("InitiateCheckout", {
        content_ids: items.map(item => item.id),
        content_type: "product",
        value: getTotal(),
        currency: "NGN",
        num_items: items.reduce((acc, item) => acc + item.quantity, 0),
      });
    }
  }, [items, getTotal]);

  const handleProvinceChange = async (provCode: string) => {
    setSelectedProvince(provCode);
    setSelectedCity("");
    setSelectedArea("");
    setCities([]);
    setAreas([]);
    setShippingFee(3500);
    setShippingInfo(prev => ({
      ...prev,
      provinceCode: provCode,
      provinceName: provinces.find(p => p.code === provCode)?.name || "",
      cityCode: "",
      cityName: "",
      districtCode: "",
      districtName: "",
      deliveryFee: 3500,
    }));
    
    if (!provCode) return;
    const res = await getCitiesAction(provCode);
    if (res.success && res.data) {
      setCities(res.data);
    }
  };

  const handleCityChange = async (cityCode: string) => {
    setSelectedCity(cityCode);
    setSelectedArea("");
    setAreas([]);
    setShippingFee(3500);
    setShippingInfo(prev => ({
      ...prev,
      cityCode: cityCode,
      cityName: cities.find(c => c.code === cityCode)?.name || "",
      districtCode: "",
      districtName: "",
      deliveryFee: 3500,
    }));

    if (!cityCode || !selectedProvince) return;
    const res = await getAreasAction(selectedProvince, cityCode);
    if (res.success && res.data) {
      setAreas(res.data);
    }
  };

  const handleAreaChange = (areaCode: string) => {
    setSelectedArea(areaCode);
    setShippingInfo(prev => ({
      ...prev,
      districtCode: areaCode,
      districtName: areas.find(a => a.code === areaCode)?.name || "",
    }));
  };

  useEffect(() => {
    if (!selectedProvince || !selectedCity || !selectedArea) {
      setShippingFee(3500);
      return;
    }

    async function calculateFee() {
      setIsFeeLoading(true);
      try {
        const res = await getShippingFeeAction({
          receiverProvinceCode: selectedProvince,
          receiverCityCode: selectedCity,
          receiverAreaCode: selectedArea,
          weight: totalWeight,
        });
        if (res.success && res.fee !== undefined) {
          setShippingFee(res.fee);
          const provName = provinces.find(p => p.code === selectedProvince)?.name || "";
          const cityName = cities.find(c => c.code === selectedCity)?.name || "";
          const districtName = areas.find(a => a.code === selectedArea)?.name || "";
          
          setShippingInfo(prev => ({
            ...prev,
            provinceCode: selectedProvince,
            provinceName: provName,
            cityCode: selectedCity,
            cityName: cityName,
            districtCode: selectedArea,
            districtName: districtName,
            deliveryFee: res.fee,
            city: cityName, // fallback for legacy views
          }));
        }
      } catch (err) {
        console.error("Fee calculation error:", err);
      } finally {
        setIsFeeLoading(false);
      }
    }

    calculateFee();
  }, [selectedProvince, selectedCity, selectedArea, totalWeight, provinces, cities, areas]);

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
  const grandTotal = subtotal + shippingFee;

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

    if (!selectedProvince || !selectedCity || !selectedArea) {
      toast.error("Please select your State, City, and Area to calculate shipping fee.");
      return;
    }

    setLoading(true);
    const isValidCart = await validateCartBeforeCheckout();
    if (!isValidCart) {
      setLoading(false);
      return;
    }

    if (paymentMethod === "CARD" || paymentMethod === "TRANSFER") {
      logger.info(`Flutterwave Payment Initiated: ${shippingInfo.fullName} (Total: ₦${grandTotal.toLocaleString()})`, {
        buyer: {
          name: shippingInfo.fullName,
          email: shippingInfo.email,
          phone: shippingInfo.phone,
          address: `${shippingInfo.address}, ${shippingInfo.districtName}, ${shippingInfo.cityName}, ${shippingInfo.provinceName}`
        },
        amount: grandTotal,
        txRef
      });

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

            logger.info(`Flutterwave Payment Success: ${shippingInfo.fullName} (Total: ₦${grandTotal.toLocaleString()})`, {
              buyer: {
                name: shippingInfo.fullName,
                email: shippingInfo.email,
                phone: shippingInfo.phone,
              },
              amount: grandTotal,
              paymentRef,
              rawResponse
            });

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
              status: "PAID" as SaleStatusType,
              customerId: (session?.user as any)?.customerId,
            });
            console.debug("[checkout] createOrderAction result", result);

            if (result.success) {
              const orderData = result as { success: true; data: { orderNumber: string } };
              toast.success("Purchase successful! Check your email for your order confirmation and delivery details.");
              setIsNavigatingToSuccess(true);
              router.push(`/checkout/success?orderNumber=${encodeURIComponent(orderData.data.orderNumber)}&totalAmount=${Math.round(grandTotal)}`);
            } else {
              const errorResult = result as { success: false; error: string | null };
              logger.error(`Order Creation Failed After Successful Flutterwave Payment: ${shippingInfo.fullName}`, errorResult.error, {
                buyerName: shippingInfo.fullName,
                amount: grandTotal,
                paymentRef
              });
              console.error("Order creation failed after successful payment:", errorResult.error);
              toast.error(errorResult.error || "Payment succeeded but order creation failed. Please contact support.");
            }
          } else if (paymentStatus === "pending") {
            logger.warn(`Flutterwave Payment Pending: ${shippingInfo.fullName} (Total: ₦${grandTotal.toLocaleString()})`, {
              buyerName: shippingInfo.fullName,
              amount: grandTotal,
              rawResponse
            });
            toast.warning("Payment is pending. Please wait a moment and check your bank.");
          } else {
            logger.error(`Flutterwave Payment Failed: ${shippingInfo.fullName} (Total: ₦${grandTotal.toLocaleString()})`, rawResponse, {
              buyerName: shippingInfo.fullName,
              amount: grandTotal
            });
            console.error("Flutterwave payment callback did not return success:", rawResponse);
            toast.error("Payment was not successful. Please try again.");
          }
          closePaymentModal();
          setLoading(false);
        },
        onClose: () => {
          logger.warn(`Flutterwave Payment Cancelled: ${shippingInfo.fullName} (Total: ₦${grandTotal.toLocaleString()})`, {
            buyer: {
              name: shippingInfo.fullName,
              email: shippingInfo.email,
              phone: shippingInfo.phone,
            },
            amount: grandTotal,
            txRef
          });
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
                <div className="glass-card p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-xl animate-in slide-in-from-bottom-8 duration-500 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="relative size-10 rounded-2xl overflow-hidden bg-brand-navy/10 shadow-inner">
                          {customerProfile?.image || session?.user?.image ? (
                            <Image src={customerProfile?.image || session?.user?.image || ""} alt="Profile" fill className="object-cover" />
                          ) : (
                            <div className="size-10 flex items-center justify-center text-brand-navy bg-zinc-100">
                              <User className="size-4" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground font-black">Profile details</p>
                            <h2 className="text-xl font-black tracking-tight">Your account</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="fullName" className="text-[9px] font-black uppercase tracking-[0.15em] ml-1 opacity-60">Full Legal Name</Label>
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
                                className="h-12 rounded-xl glass-card border border-zinc-200/50 dark:border-zinc-800 focus-visible:ring-brand-navy font-semibold text-sm px-5" 
                            />
                            {formErrors.fullName && <p className="text-[10px] text-rose-600 mt-1 ml-1">{formErrors.fullName}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-[0.15em] ml-1 opacity-60">Digital Contact (Email)</Label>
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
                                className="h-12 rounded-xl glass-card border border-zinc-200/50 dark:border-zinc-800 focus-visible:ring-brand-navy font-semibold text-sm px-5" 
                            />
                            {formErrors.email && <p className="text-[10px] text-rose-600 mt-1 ml-1">{formErrors.email}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-[9px] font-black uppercase tracking-[0.15em] ml-1 opacity-60">Secure Communications (Phone)</Label>
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
                                className="h-12 rounded-xl glass-card border border-zinc-200/50 dark:border-zinc-800 focus-visible:ring-brand-navy font-semibold text-sm px-5" 
                            />
                            {formErrors.phone && <p className="text-[10px] text-rose-600 mt-1 ml-1">{formErrors.phone}</p>}
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-14 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-md transition-all active:scale-[0.98] group mt-2">
                        PROCEED TO DELIVERY
                        <ArrowLeft className="ml-3 size-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
              )}

              {/* Step 2: Logistics */}
              {step === "LOGISTICS" && (
                <div className="glass-card p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-xl animate-in slide-in-from-bottom-8 duration-500 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-brand-silver/10 rounded-2xl flex items-center justify-center text-brand-silver shadow-inner">
                            <Truck className="size-4" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground font-black">Delivery</p>
                            <h2 className="text-xl font-black tracking-tight">Shipping details</h2>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address" className="text-[9px] font-black uppercase tracking-[0.15em] ml-1 opacity-60">Fulfillment Address (Physical)</Label>
                            <Input id="address" name="address" value={shippingInfo.address} onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })} placeholder="DESTINATION STREET & HOUSE" required className="h-12 rounded-xl glass-card border border-zinc-200/50 dark:border-zinc-800 focus-visible:ring-brand-navy font-semibold text-sm px-5" />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="province" className="text-[9px] font-black uppercase tracking-[0.15em] ml-1 opacity-60">State / Region</Label>
                            <div className="relative">
                                <select
                                    id="province"
                                    name="province"
                                    value={selectedProvince}
                                    onChange={(e) => handleProvinceChange(e.target.value)}
                                    required
                                    className="h-12 w-full rounded-xl glass-card border border-zinc-200/50 dark:border-zinc-800 focus:ring-2 focus:ring-brand-navy focus-visible:ring-brand-navy font-semibold text-sm px-5 appearance-none cursor-pointer outline-none transition-all pr-10 text-zinc-800 dark:text-zinc-200 bg-transparent"
                                >
                                    <option value="" disabled className="text-zinc-400 bg-white dark:bg-zinc-900">Select State</option>
                                    {provinces.map((p) => (
                                        <option key={p.code} value={p.code} className="text-zinc-900 bg-white dark:bg-zinc-900 dark:text-zinc-100">
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                    <ChevronDown className="size-4" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city" className="text-[9px] font-black uppercase tracking-[0.15em] ml-1 opacity-60">LGA / City</Label>
                            <div className="relative">
                                <select
                                    id="city"
                                    name="city"
                                    value={selectedCity}
                                    onChange={(e) => handleCityChange(e.target.value)}
                                    required
                                    disabled={!selectedProvince}
                                    className="h-12 w-full rounded-xl glass-card border border-zinc-200/50 dark:border-zinc-800 focus:ring-2 focus:ring-brand-navy focus-visible:ring-brand-navy font-semibold text-sm px-5 appearance-none cursor-pointer outline-none transition-all pr-10 disabled:opacity-50 text-zinc-800 dark:text-zinc-200 bg-transparent"
                                >
                                    <option value="" disabled className="text-zinc-400 bg-white dark:bg-zinc-900">
                                        {selectedProvince ? "Select LGA / City" : "Select State First"}
                                    </option>
                                    {cities.map((c) => (
                                        <option key={c.code} value={c.code} className="text-zinc-900 bg-white dark:bg-zinc-900 dark:text-zinc-100">
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                    <ChevronDown className="size-4" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="area" className="text-[9px] font-black uppercase tracking-[0.15em] ml-1 opacity-60">Area / District</Label>
                            <div className="relative">
                                <select
                                    id="area"
                                    name="area"
                                    value={selectedArea}
                                    onChange={(e) => handleAreaChange(e.target.value)}
                                    required
                                    disabled={!selectedCity}
                                    className="h-12 w-full rounded-xl glass-card border border-zinc-200/50 dark:border-zinc-800 focus:ring-2 focus:ring-brand-navy focus-visible:ring-brand-navy font-semibold text-sm px-5 appearance-none cursor-pointer outline-none transition-all pr-10 disabled:opacity-50 text-zinc-800 dark:text-zinc-200 bg-transparent"
                                >
                                    <option value="" disabled className="text-zinc-400 bg-white dark:bg-zinc-900">
                                        {selectedCity ? "Select Area / District" : "Select City First"}
                                    </option>
                                    {areas.map((a) => (
                                        <option key={a.code} value={a.code} className="text-zinc-900 bg-white dark:bg-zinc-900 dark:text-zinc-100">
                                            {a.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                    <ChevronDown className="size-4" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="zip" className="text-[9px] font-black uppercase tracking-[0.15em] ml-1 opacity-60">Postcode (Optional)</Label>
                            <Input id="zip" name="zip" value={shippingInfo.zip} onChange={(e) => setShippingInfo({ ...shippingInfo, zip: e.target.value })} placeholder="000000" className="h-12 rounded-xl glass-card border border-zinc-200/50 dark:border-zinc-800 focus-visible:ring-brand-navy font-semibold text-sm px-5" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Mobile-only shipping cost summary at the base of the form */}
                        <div className="md:hidden space-y-3 bg-zinc-50/70 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 text-xs my-1">
                            <div className="flex justify-between items-center font-bold">
                                <span className="text-zinc-500 uppercase tracking-widest text-[9px]">Items Subtotal</span>
                                <span className="font-black text-zinc-800 dark:text-zinc-200">₦{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center font-bold">
                                <span className="text-zinc-500 uppercase tracking-widest text-[9px]">Delivery Fee</span>
                                <span className="font-black text-zinc-800 dark:text-zinc-200">
                                    {isFeeLoading ? (
                                        <span className="animate-pulse">CALCULATING...</span>
                                    ) : shippingFee > 0 ? (
                                        `₦${shippingFee.toLocaleString()}`
                                    ) : (
                                        "₦3,500"
                                    )}
                                </span>
                            </div>
                            <div className="h-px bg-zinc-200/50 dark:bg-zinc-800 w-full" />
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Payable Total</span>
                                <span className="text-xl font-black tracking-tighter text-brand-navy dark:text-white">₦{Math.round(grandTotal).toLocaleString()}</span>
                            </div>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full h-14 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-md transition-all active:scale-[0.98] group disabled:opacity-60">
                            {loading ? (
                                "PROCESSING PAYMENT..."
                            ) : (
                                <>
                                    AUTHORISE PAYMENT
                                    <ArrowLeft className="ml-3 size-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
              )}
            </form>
             <div className="order-first lg:order-none lg:col-span-5 lg:sticky lg:top-32 animate-slow-fade">
              <div className="p-4 lg:p-12 rounded-[1.5rem] lg:rounded-[3.5rem] lg:glass-card border-none lg:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] space-y-6 lg:space-y-10 relative overflow-visible lg:overflow-hidden lg:bg-white/45">
                <div className="absolute inset-0 bg-brand-mesh opacity-5 pointer-events-none hidden lg:block" />
                <div className="flex items-center gap-3 lg:gap-4">
                    <div className="size-8 lg:size-10 bg-brand-navy/10 rounded-lg lg:rounded-xl flex items-center justify-center text-brand-navy">
                        <ShoppingCart className="size-4 lg:size-5" />
                    </div>
                    <h2 className="text-lg lg:text-2xl font-black tracking-tight">Orders</h2>
                </div>
                
                <div className="space-y-5 lg:space-y-8 max-h-[350px] overflow-y-auto pr-0 sm:pr-4 scrollbar-hide">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-3 lg:gap-4 group items-center">
                      <div className="size-16 lg:size-24 rounded-2xl lg:rounded-3xl border border-zinc-100 dark:border-zinc-800 lg:border-none relative overflow-hidden flex-shrink-0 lg:glass-card lg:bg-zinc-50">
                        {item.image && <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />}
                      </div>
                      <div className="flex-1 space-y-1 lg:space-y-2">
                        <h4 className="text-xs lg:text-sm font-black tracking-tight line-clamp-1 group-hover:text-brand-navy transition-colors">{item.name}</h4>
                        <div className="flex gap-1.5 lg:gap-2">
                          <Badge variant="outline" className="text-[8px] lg:text-[9px] font-black uppercase tracking-tighter border-border/50 px-1.5 py-0">QTY: {item.quantity}</Badge>
                          {item.size && <Badge variant="outline" className="text-[8px] lg:text-[9px] font-black uppercase tracking-tighter border-border/50 px-1.5 py-0">SIZE: {item.size}</Badge>}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">₦{(Number(item.price) || 0).toLocaleString()} each</p>
                          <p className="text-xs lg:text-sm font-black tracking-tighter text-zinc-800 dark:text-zinc-200">₦{((Number(item.price) || 0) * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 lg:space-y-4 p-5 lg:p-0 rounded-2xl lg:rounded-none border border-zinc-100 dark:border-zinc-800 lg:border-none bg-zinc-50/50 dark:bg-zinc-900/30 lg:bg-transparent">
                  <div className="flex justify-between text-[10px] lg:text-xs font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-black text-zinc-800 dark:text-zinc-200">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] lg:text-xs font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-black text-zinc-800 dark:text-zinc-200">
                      {isFeeLoading ? (
                        <span className="animate-pulse">CALCULATING...</span>
                      ) : shippingFee > 0 ? (
                        `₦${shippingFee.toLocaleString()}`
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                  <div className="pt-4 lg:pt-8 mt-2 lg:mt-4 border-t border-zinc-200/50 dark:border-zinc-800 lg:border-border/30">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.25em] lg:tracking-[0.3em] text-muted-foreground/60">Portfolio Total</span>
                      <span className="text-2xl lg:text-4xl font-black tracking-tighter text-brand-navy dark:text-white">₦{Math.round(grandTotal).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 lg:gap-4 opacity-40 py-2 lg:py-0">
                    <ShieldCheck className="size-3.5 lg:size-4" />
                    <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.3em] lg:tracking-[0.4em]">NextGen Integrity Standard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

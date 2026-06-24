"use client";

import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, 
  User, 
  Settings, 
  LogOut, 
  Package, 
  ChevronRight, 
  Clock, 
  Zap,
  ShieldCheck,
  MapPin,
  Camera,
  CreditCard,
  Truck,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { getOrderTrackingAction } from "@/modules/delivery/actions/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getPatronOrdersAction } from "@/modules/orders/actions/order.actions";
import { OrderReceipt } from "@/modules/orders/components/order-receipt";
import { updatePatronDetailsAction, getCustomerDetailAction } from "@/modules/customers/actions/customer.actions";
import { PatronSettingsModal } from "@/modules/customers/components/patron-settings-modal";
import { cn, getSignOutRedirectUrl } from "@/lib/utils";
import NextImage from "next/image";
import { toast } from "sonner";

interface AccountClientProps {
  initialPatronData: any;
  initialOrders: any[];
}

export default function AccountClient({ initialPatronData, initialOrders }: AccountClientProps) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [patronData, setPatronData] = useState<any>(initialPatronData);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [orderTracking, setOrderTracking] = useState<Record<string, { loading: boolean; data: any | null }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/account");
    }

    if (status === "authenticated" && (session?.user as any)?.customerId) {
      if (!initialPatronData) {
        loadInitialData();
      }
    } else if (status === "authenticated" && !(session?.user as any)?.customerId) {
        setIsLoading(false);
    }
  }, [status, session, router, initialPatronData]);

  const loadInitialData = async () => {
    // If we already have patronData loaded (perhaps from initialPatronData or previous loads), use its true ID.
    // Otherwise fallback to session.
    let customerId = patronData?.id || (session?.user as any)?.customerId;
    
    // Safety check - we can also get the ID from email on the backend, but let's try this first
    try {
      const [patronResult, ordersResult] = await Promise.all([
        getCustomerDetailAction(customerId),
        getPatronOrdersAction(customerId)
      ]);

      if (patronResult.success) setPatronData(patronResult.data);
      if (ordersResult.success) setOrders(ordersResult.data || []);
    } catch (error) {
      console.error("Initial data load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatronData = async () => {
    const customerId = patronData?.id || (session?.user as any)?.customerId;
    const result = await getCustomerDetailAction(customerId);
    if (result.success) setPatronData(result.data);
  };

  const loadOrders = async () => {
    const customerId = patronData?.id || (session?.user as any)?.customerId;
    const result = await getPatronOrdersAction(customerId);
    if (result.success) setOrders(result.data || []);
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Compression failed"));
            },
            "image/jpeg",
            0.75
          );
        };
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    
    try {
        // Compress image on client-side before upload
        const compressedBlob = await compressImage(file);
        
        const formData = new FormData();
        formData.append("file", compressedBlob, "profile_image.jpg");
        formData.append("folder", "profiles");

        const response = await fetch("/api/customers/upload-image", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || "Upload failed");
        }

        toast.success("Profile image optimized and updated.");
        await update(); // Update session
        loadPatronData();
    } catch (error: any) {
        toast.error(error?.message || "An unexpected error occurred during optimization.");
    } finally {
        setUploadingImage(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Synchronizing Identity...</p>
      </div>
    );
  }

  if (!(session?.user as any)?.customerId && status === "authenticated") {
      return (
          <div className="min-h-[80vh] flex flex-col items-center justify-center container mx-auto px-6 text-center">
              <div className="size-20 bg-brand-navy/10 rounded-[2rem] flex items-center justify-center text-brand-navy mb-8">
                  <ShieldCheck className="size-10" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter mb-4">Welcome, {session?.user?.name || "Staff"}</h1>
              <p className="text-muted-foreground max-w-md mx-auto font-medium mb-10">
                  Please note that all activities on this account are monitored and stored.
              </p>
              <Button onClick={() => router.push("/dashboard")} className="h-16 px-10 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl">
                  GO TO DASHBOARD
              </Button>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-zinc-50 pt-4 sm:pt-8 md:pt-12 pb-32 sm:pb-40 relative">
      <div className="absolute top-0 left-0 w-full h-[300px] sm:h-[400px] bg-brand-mesh opacity-5 pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10">
          
          {/* Refined Profile Header - TikTok Style Centered Layout (Transparent background, no card) */}
          <div className="flex flex-col items-center text-center space-y-4 py-4 sm:py-6">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-100 shadow-xl overflow-hidden ring-4 ring-white/90">
              {patronData?.image || session?.user?.image ? (
                <NextImage src={patronData?.image || session?.user?.image} alt="Profile" fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-brand-navy">
                  <User className="size-10 sm:size-12" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-brand-navy text-white flex items-center justify-center shadow-2xl border-4 border-white hover:scale-105 transition-transform"
              >
                <Camera className="size-3.5 sm:size-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-zinc-950 leading-tight">
                {session?.user?.name || "Customer"}
              </h1>
            </div>

            <div className="flex items-center justify-center gap-3 w-full max-w-sm">
              <Button
                onClick={() => setIsSettingsOpen(true)}
                variant="outline"
                className="flex-1 h-12 sm:h-14 rounded-2xl border border-zinc-200 bg-white text-zinc-950 font-black tracking-widest text-[10px] sm:text-xs uppercase shadow-sm hover:border-brand-navy hover:bg-brand-navy/5 flex items-center justify-center gap-1.5"
              >
                <Settings className="size-4" />
                Settings
              </Button>
              <Button
                onClick={() => signOut({ callbackUrl: getSignOutRedirectUrl("/") })}
                className="flex-1 h-12 sm:h-14 rounded-2xl bg-zinc-950 text-white font-black tracking-widest text-[10px] sm:text-xs uppercase shadow-xl shadow-zinc-950/10 hover:bg-zinc-800 flex items-center justify-center gap-1.5"
              >
                <LogOut className="size-4" />
                Log out
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
            {/* Left: Order History */}
            <div className="lg:col-span-8 space-y-6 sm:space-y-8">
              <div className="space-y-0.5">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">Orders</h2>
                  <p className="text-[8px] sm:text-[9px] text-muted-foreground font-black uppercase tracking-widest">Your order history in one place</p>
              </div>

              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="glass-card p-8 sm:p-12 md:p-16 text-center rounded-2xl sm:rounded-[2.5rem] border-none shadow-sm bg-white/50">
                    <ShoppingBag className="size-10 sm:size-12 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-base sm:text-lg font-bold text-foreground/50 italic mb-6">No orders recorded yet.</p>
                    <Button onClick={() => router.push("/shop")} className="h-11 sm:h-12 md:h-14 px-6 sm:px-10 bg-brand-navy text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-xl shadow-brand-navy/20">
                        START YOUR COLLECTION
                    </Button>
                  </div>
                ) : (
                  orders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const orderItems = order.items ?? order.SaleItem ?? [];
                    const itemCount = orderItems.length;
                    return (
                      <div key={order.id} className="glass-card overflow-hidden rounded-2xl sm:rounded-[2rem] border-none shadow-sm group hover:shadow-xl hover:shadow-brand-navy/5 transition-all duration-500 bg-white">
                        <div className="p-4 sm:p-5 md:p-6 space-y-4">
                          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] items-start">
                            <div className="min-w-0 space-y-2">
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground opacity-70">ORDER ID</p>
                                <h3 className="text-lg sm:text-xl font-black tracking-tight break-words">{order.orderNumber}</h3>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] leading-none text-muted-foreground">
                                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-start gap-3 sm:items-end">
                              <Badge className={cn(
                                  "font-black text-[9px] px-3 py-1 uppercase tracking-[0.3em] border-none shadow-sm",
                                  (order.status === "COMPLETED" || order.status === "PAID") ? "bg-emerald-500/10 text-emerald-600" :
                                  order.status === "PENDING" ? "bg-amber-500/10 text-amber-600" :
                                  order.status === "PROCESSING" ? "bg-blue-500/10 text-blue-600" :
                                  order.status === "SHIPPED" ? "bg-violet-500/10 text-violet-600" :
                                  "bg-rose-500/10 text-rose-600"
                              )}>
                                {order.status}
                              </Badge>
                              <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">ORDER VALUE</p>
                                <p className="text-lg font-black tracking-tight">₦{Number(order.totalAmount).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="rounded-3xl bg-zinc-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground inline-flex items-center justify-center">
                              {itemCount} {itemCount === 1 ? "item" : "items"}
                            </div>
                            <Button
                              onClick={() => {
                                const newId = isExpanded ? null : order.id;
                                setExpandedOrderId(newId);
                                // Fetch live tracking when expanding
                                if (newId && !orderTracking[newId]) {
                                  setOrderTracking(prev => ({ ...prev, [newId]: { loading: true, data: null } }));
                                  getOrderTrackingAction(newId).then(res => {
                                    setOrderTracking(prev => ({ 
                                      ...prev, 
                                      [newId]: { loading: false, data: res.success ? res.data : null } 
                                    }));
                                  });
                                }
                              }}
                              variant="outline"
                              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-brand-navy/10 bg-white px-4 text-[10px] font-black uppercase tracking-[0.3em] text-brand-navy hover:bg-brand-navy/5"
                            >
                              {isExpanded ? "Hide details" : "View order"}
                              <ChevronRight className={cn("size-3 transition-transform", isExpanded && "rotate-90")} />
                            </Button>
                          </div>
                        </div>


                        {isExpanded && (
                          <div className="border-t border-border/10 bg-zinc-50/70 p-3 sm:p-4 md:p-5">
                            
                            {/* Live Shipment Tracking */}
                            {(() => {
                              const tracking = orderTracking[order.id];
                              return (
                                <div className="mb-4 rounded-2xl bg-white border border-brand-navy/10 shadow-sm overflow-hidden">
                                  {/* Header */}
                                  <div className="flex items-center gap-3 p-4 border-b border-zinc-100">
                                    <div className="h-9 w-9 rounded-xl bg-brand-navy/10 flex items-center justify-center">
                                      <Truck className="size-4 text-brand-navy" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-navy">Shipment Tracking</p>
                                      {order.waybillNumber ? (
                                        <p className="text-xs font-bold text-muted-foreground mt-0.5">{order.waybillNumber}</p>
                                      ) : (
                                        <p className="text-xs font-bold text-muted-foreground mt-0.5">Awaiting Waybill</p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                                      <p className="text-xs font-black text-brand-navy mt-0.5">
                                        {tracking?.data?.status || order.deliveryStatus || "Processing Shipment"}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Timeline */}
                                  {tracking?.loading ? (
                                    <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                                      <Loader2 className="size-4 animate-spin" />
                                      <span className="text-[11px] font-black uppercase tracking-widest">Fetching live updates…</span>
                                    </div>
                                  ) : tracking?.data?.events?.length > 0 ? (
                                    <div className="p-4 space-y-0">
                                      {tracking.data.events.map((event: any, i: number) => (
                                        <div key={i} className="relative flex gap-3 pb-5 last:pb-0">
                                          {/* vertical line */}
                                          {i < tracking.data.events.length - 1 && (
                                            <div className="absolute left-[13px] top-6 bottom-0 w-px bg-zinc-200" />
                                          )}
                                          <div className={cn(
                                            "relative z-10 flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center",
                                            i === 0 ? "bg-brand-navy" : "bg-zinc-200"
                                          )}>
                                            {i === 0 
                                              ? <Truck className="size-3.5 text-white" />
                                              : <CheckCircle2 className="size-3.5 text-zinc-400" />
                                            }
                                          </div>
                                          <div className="pt-0.5 min-w-0">
                                            <p className={cn("text-xs font-black leading-snug", i === 0 ? "text-brand-navy" : "text-foreground")}>
                                              {event.status}
                                            </p>
                                            {event.location && (
                                              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{event.location}</p>
                                            )}
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{event.time}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : order.waybillNumber ? (
                                    <div className="py-6 text-center">
                                      <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest">No scan events yet</p>
                                      <p className="text-[10px] text-muted-foreground mt-1">Your shipment has been booked. Check back soon!</p>
                                    </div>
                                  ) : (
                                    <div className="py-6 text-center">
                                      <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest">Preparing your shipment</p>
                                      <p className="text-[10px] text-muted-foreground mt-1">You'll receive a waybill number once your order is dispatched.</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            <div className="space-y-3">
                              {(order.items ?? order.SaleItem ?? []).map((item: any, idx: number) => {
                                const variant = item.variant ?? item.ProductVariant ?? {};
                                const product = variant.product ?? variant.Product ?? {};
                                return (
                                  <div key={idx} className="flex flex-col gap-3 rounded-[1.75rem] border border-border/10 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-start gap-3 md:gap-4 md:flex-1">
                                      <div className="relative w-20 h-20 rounded-[1.5rem] overflow-hidden bg-zinc-100 flex-shrink-0 shadow-sm">
                                        {product.images?.[0] ? (
                                          <NextImage src={product.images[0]} alt={product.name || variant.sku || "Product image"} fill className="object-cover" />
                                        ) : (
                                          <div className="flex h-full items-center justify-center opacity-20"><Package className="size-6" /></div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-black text-foreground tracking-tight leading-tight line-clamp-2">{product.name || variant.sku || "Unnamed product"}</p>
                                        {product.description ? (
                                          <p className="mt-1 text-[11px] leading-snug text-muted-foreground line-clamp-2">{product.description}</p>
                                        ) : null}
                                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">SKU: {variant.sku || "N/A"}</span>
                                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">Size: {variant.size || "—"}</span>
                                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">Color: {variant.color || "—"}</span>
                                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">Qty: {item.quantity || 1}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid gap-2 w-full md:w-auto text-right">
                                      <div className="rounded-[1.5rem] bg-zinc-100 p-3">
                                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Unit Price</p>
                                        <p className="mt-1 font-black text-foreground">₦{Number(item.price).toLocaleString()}</p>
                                      </div>
                                      <div className="rounded-[1.5rem] bg-emerald-100 p-3">
                                        <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-700">Total</p>
                                        <p className="mt-1 font-black text-emerald-900">₦{(Number(item.price) * (item.quantity || 1)).toLocaleString()}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Cost Breakdown */}
                            <div className="mt-4 flex justify-end">
                              <div className="w-full max-w-sm rounded-[1.5rem] bg-white p-5 border border-border/10 shadow-sm space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-bold text-muted-foreground">Items Subtotal</span>
                                  <span className="font-black">
                                    ₦{((order.items ?? order.SaleItem ?? []).reduce((acc: number, item: any) => acc + (Number(item.price) * (item.quantity || 1)), 0)).toLocaleString()}
                                  </span>
                                </div>
                                {(order.deliveryFee != null && Number(order.deliveryFee) > 0) && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-muted-foreground">Logistics / Delivery Fee</span>
                                    <span className="font-black">₦{Number(order.deliveryFee).toLocaleString()}</span>
                                  </div>
                                )}
                                <div className="pt-3 border-t border-border/10 flex items-center justify-between">
                                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-navy">Total Paid</span>
                                  <span className="text-xl font-black text-brand-navy">₦{Number(order.totalAmount).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Metrics - Mobile Responsive */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
                <div className="glass-card p-4 sm:p-5 rounded-[2rem] border-none shadow-xl space-y-5 relative overflow-hidden bg-white lg:sticky lg:top-[120px]">
                    <div className="absolute inset-0 bg-brand-mesh opacity-5 pointer-events-none" />
                    
                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-brand-navy/10 flex items-center justify-center text-brand-navy">
                                <MapPin className="size-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-muted-foreground">Active Address</p>
                              <p className="text-sm font-black tracking-tight text-foreground">Delivery destination</p>
                            </div>
                        </div>
                        <p className="text-[11px] leading-6 text-muted-foreground italic bg-zinc-50 p-3 rounded-2xl border border-border/10 break-words">
                            {patronData?.address || "No active address recorded."}
                        </p>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <OrderReceipt 
        orderId={selectedOrderId} 
        onClose={() => setSelectedOrderId(null)} 
      />

      {session?.user && patronData && (
          <PatronSettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            patron={{
                id: patronData.id,
                name: patronData.name || "",
                email: patronData.email || "",
                phone: patronData.phone || "",
                address: patronData.address || ""
            }}
            onUpdate={async () => {
                await update(); // Refresh session
                loadInitialData();
            }}
          />
      )}
    </div>
  );
}

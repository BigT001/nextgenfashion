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
  CreditCard
} from "lucide-react";
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
    const customerId = (session?.user as any).customerId;
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
    const result = await getCustomerDetailAction((session?.user as any).customerId);
    if (result.success) setPatronData(result.data);
  };

  const loadOrders = async () => {
    const result = await getPatronOrdersAction((session?.user as any).customerId);
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
          
          {/* Refined Profile Header - Mobile Optimized */}
          <div className="bg-white/95 border border-zinc-200 rounded-2xl sm:rounded-[2.5rem] shadow-[0_30px_80px_-38px_rgba(15,23,42,0.35)] p-4 sm:p-6 backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:gap-0">
              {/* Profile Info Section - Horizontal Layout */}
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Avatar */}
                <div className="relative shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="size-20 sm:size-24 bg-slate-50 rounded-2xl sm:rounded-[2.5rem] shadow-xl flex items-center justify-center text-brand-navy ring-4 ring-white/80 overflow-hidden">
                    {patronData?.image || session?.user?.image ? (
                      <NextImage src={patronData?.image || session?.user?.image} alt="Profile" fill className="object-cover" />
                    ) : (
                      <User className="size-8 sm:size-10" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 size-7 sm:size-9 bg-brand-navy text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white hover:scale-110 active:scale-95 transition-all"
                  >
                    <Camera className="size-3 sm:size-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                {/* Name and Description */}
                <div className="space-y-1 flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-none">{session?.user?.name || "Customer"}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Welcome back! Manage your profile and orders.</p>
                </div>
              </div>

              {/* Button Section - Always Horizontal */}
              <div className="flex flex-row flex-nowrap items-center gap-2 sm:gap-3 justify-end">
                <Button
                  onClick={() => setIsSettingsOpen(true)}
                  variant="outline"
                  className="flex-1 min-w-[135px] h-11 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all hover:bg-zinc-50 active:scale-95"
                >
                  <Settings className="mr-2 size-3 sm:size-4" />
                  SETTINGS
                </Button>
                <Button
                  onClick={() => signOut({ callbackUrl: getSignOutRedirectUrl("/") })}
                  className="flex-1 min-w-[135px] h-11 sm:h-12 px-4 sm:px-6 bg-zinc-950 text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-xl shadow-zinc-950/20 active:scale-95 transition-all"
                >
                  <LogOut className="mr-2 size-3 sm:size-4" />
                  LOG OUT
                </Button>
              </div>
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
                    return (
                      <div key={order.id} className="glass-card overflow-hidden rounded-2xl sm:rounded-[2rem] border-none shadow-sm group hover:shadow-xl hover:shadow-brand-navy/5 transition-all duration-500 bg-white">
                        <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-4">
                          {/* Top Row: Order ID + Status/Amount */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-2">
                              <div>
                                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">ORDER ID</p>
                                <h3 className="text-base sm:text-lg font-black tracking-tighter break-words">{order.orderNumber}</h3>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[8px] sm:text-[10px] text-muted-foreground">
                                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                  <span className="h-1 w-1 rounded-full bg-border" />
                                  <span>{order.paymentMethod || "CARD"}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={cn(
                                  "font-black text-[8px] sm:text-[9px] px-2 py-0.5 uppercase tracking-widest border-none shadow-sm",
                                  order.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600" :
                                  order.status === "PENDING" ? "bg-amber-500/10 text-amber-600" :
                                  order.status === "PROCESSING" ? "bg-blue-500/10 text-blue-600" :
                                  order.status === "SHIPPED" ? "bg-violet-500/10 text-violet-600" :
                                  "bg-rose-500/10 text-rose-600"
                              )}>
                                  {order.status}
                              </Badge>
                              <div className="space-y-0.5 text-right">
                                  <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">ORDER VALUE</p>
                                  <p className="text-base sm:text-lg font-black tracking-tighter">₦{Number(order.totalAmount).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Row: Items Count + View Details */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.28em] font-black text-muted-foreground">
                              {order.items?.length || 0} items
                            </div>
                            <Button
                              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                              variant="link"
                              className="p-0 h-auto text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-brand-navy hover:no-underline flex items-center gap-1"
                            >
                              {isExpanded ? "HIDE" : "VIEW"}
                              <ChevronRight className={cn("size-3 transition-transform", isExpanded && "rotate-90")} />
                            </Button>
                          </div>
                        </div>


                        {isExpanded && (
                          <div className="border-t border-border/10 bg-zinc-50/70 p-4 sm:p-6 md:p-8">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                              {order.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex flex-col items-center gap-2 sm:gap-3">
                                  <div className="w-full aspect-square rounded-lg sm:rounded-2xl bg-white border border-border/10 relative overflow-hidden shadow-sm flex items-center justify-center">
                                    {item.variant?.product?.images?.[0] ? (
                                      <NextImage src={item.variant.product.images[0]} alt="" fill className="object-cover" />
                                    ) : (
                                      <div className="flex items-center justify-center h-full opacity-10"><Package className="size-4 sm:size-6" /></div>
                                    )}
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[7px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Qty</p>
                                    <p className="text-sm sm:text-lg font-black tracking-tighter">{item.quantity || 1}</p>
                                  </div>
                                </div>
                              ))}
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
            <div className="lg:col-span-4 space-y-6 sm:space-y-8">
                <div className="glass-card p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border-none shadow-2xl space-y-6 sm:space-y-8 relative overflow-hidden bg-white lg:sticky lg:top-[120px]">
                    <div className="absolute inset-0 bg-brand-mesh opacity-5 pointer-events-none" />
                    
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="size-8 bg-brand-navy/10 rounded-lg flex items-center justify-center text-brand-navy">
                                <MapPin className="size-4" />
                            </div>
                            <h3 className="font-black text-base tracking-tight">Active Address</h3>
                        </div>
                        <p className="text-[10px] sm:text-[11px] font-bold leading-relaxed text-muted-foreground italic bg-zinc-50 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-border/10 break-words">
                            {patronData?.address || "No active address recorded."}
                        </p>
                    </div>

                    <div className="space-y-4 relative z-10">
                         <div className="flex items-center gap-3">
                            <div className="size-8 bg-brand-navy/10 rounded-lg flex items-center justify-center text-brand-navy">
                                <CreditCard className="size-4" />
                            </div>
                            <h3 className="font-black text-base tracking-tight">Fulfillment Pulse</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-zinc-50 p-4 sm:p-5 rounded-xl sm:rounded-[1.5rem] space-y-0.5 border border-border/10 text-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Orders</p>
                                <p className="text-base sm:text-lg font-black tracking-tighter">{orders.length}</p>
                            </div>
                            <div className="bg-zinc-50 p-4 sm:p-5 rounded-xl sm:rounded-[1.5rem] space-y-0.5 border border-border/10 text-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Investment</p>
                                <p className="text-base sm:text-lg font-black tracking-tighter">₦{orders.reduce((acc, o) => acc + Number(o.totalAmount), 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-2 text-[7px] sm:text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
                        <ShieldCheck className="size-3" />
                        SECURED ECOSYSTEM
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

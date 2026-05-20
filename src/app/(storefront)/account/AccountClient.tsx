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
import { uploadMediaAction } from "@/modules/media/actions/media.actions";
import { PatronSettingsModal } from "@/modules/customers/components/patron-settings-modal";
import { cn } from "@/lib/utils";
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

        const result = await uploadMediaAction(formData);
        
        if (result.success && result.data?.url) {
            const updateResult = await updatePatronDetailsAction({
                customerId: (session?.user as any).customerId,
                imageUrl: result.data.url
            });

            if (updateResult.success) {
                toast.success("Profile image optimized and updated.");
                await update(); // Update session
                loadPatronData();
            } else {
                toast.error(updateResult.error || "Failed to link image.");
            }
        } else {
            toast.error(result.error || "Failed to upload image.");
        }
    } catch (error) {
        toast.error("An unexpected error occurred during optimization.");
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
    <div className="min-h-screen bg-zinc-50 pt-20 pb-40 relative">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-brand-mesh opacity-5 pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Refined Profile Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-10">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="size-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-brand-navy ring-4 ring-white/50 overflow-hidden">
                    {patronData?.image || session?.user?.image ? (
                        <NextImage src={patronData?.image || session?.user?.image} alt="Profile" fill className="object-cover" />
                    ) : (
                        <User className="size-10" />
                    )}
                    {uploadingImage && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <LoadingSpinner size="sm" variant="white" />
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 size-8 bg-brand-navy text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                >
                    <Camera className="size-4" />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tighter leading-none">{session?.user?.name || "Customer"}</h1>
                <div className="flex items-center gap-3">
                    <Badge className="bg-brand-navy/10 text-brand-navy border-none font-black text-[9px] px-2 py-0.5 uppercase tracking-widest">
                        VIP PATRON
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">{session?.user?.email}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
                <Button 
                    onClick={() => setIsSettingsOpen(true)}
                    variant="outline" 
                    className="h-12 px-6 glass-card border-none rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-white active:scale-95"
                >
                    <Settings className="mr-2 size-4" />
                    ACCOUNT SETTINGS
                </Button>
                <Button 
                    onClick={() => signOut({ callbackUrl: "/" })} 
                    className="h-12 px-6 bg-zinc-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-zinc-950/20 active:scale-95 transition-all"
                >
                    <LogOut className="mr-2 size-4" />
                    SIGN OUT
                </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: Order History */}
            <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h2 className="text-2xl font-black tracking-tight">Order Portfolio</h2>
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">TRANSACTIONAL LEDGER</p>
                </div>
                <Button variant="ghost" className="text-brand-navy font-black text-[9px] uppercase tracking-widest gap-2">
                    <Clock className="size-4" />
                    FILTER RECENT
                </Button>
              </div>

              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="glass-card p-16 text-center rounded-[2.5rem] border-none shadow-sm bg-white/50">
                    <ShoppingBag className="size-12 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-lg font-bold text-foreground/50 italic mb-6">No orders recorded yet.</p>
                    <Button onClick={() => router.push("/shop")} className="h-14 px-10 bg-brand-navy text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-navy/20">
                        START YOUR COLLECTION
                    </Button>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="glass-card overflow-hidden rounded-[2rem] border-none shadow-sm group hover:shadow-xl hover:shadow-brand-navy/5 transition-all duration-500 bg-white">
                      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="size-14 bg-zinc-50 rounded-xl flex items-center justify-center text-brand-navy group-hover:rotate-12 transition-transform shadow-inner border border-border/10">
                                <Zap className="size-6" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">ACQUISITION ID</p>
                                <h3 className="text-lg font-black tracking-tighter">{order.orderNumber}</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-bold text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    <span className="size-1 rounded-full bg-border" />
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{order.items?.length || 0} ITEMS</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="text-right space-y-0.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">REVENUE TOTAL</p>
                                <p className="text-lg font-black tracking-tighter">₦{Number(order.totalAmount).toLocaleString()}</p>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1.5">
                                <Badge className={cn(
                                    "font-black text-[9px] px-2 py-0.5 uppercase tracking-widest border-none shadow-sm",
                                    order.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600" :
                                    order.status === "PENDING" ? "bg-amber-500/10 text-amber-600" :
                                    order.status === "PROCESSING" ? "bg-blue-500/10 text-blue-600" :
                                    order.status === "SHIPPED" ? "bg-violet-500/10 text-violet-600" :
                                    "bg-rose-500/10 text-rose-600"
                                )}>
                                    {order.status}
                                </Badge>
                                <Button 
                                    onClick={() => setSelectedOrderId(order.id)}
                                    variant="link" 
                                    className="p-0 h-auto text-[9px] font-black uppercase tracking-widest text-brand-navy hover:no-underline flex items-center gap-1.5"
                                >
                                    RECEIPT <ChevronRight className="size-3" />
                                </Button>
                            </div>
                        </div>
                      </div>

                      {/* Visual Logistics Journey Progress Timeline */}
                      {!order.userId && !order.orderNumber.includes("POS") && order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
                        <div className="px-6 md:px-8 pb-8 pt-4 border-t border-border/10 bg-zinc-50/20">
                          <div className="space-y-6 max-w-2xl mx-auto">
                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                              <span>LOGISTICS SIGNATURE PIPELINE</span>
                              <span className="text-brand-navy dark:text-brand-silver">
                                {order.status === "PENDING" && "Phase 1: Validating Fashion Signature"}
                                {order.status === "PROCESSING" && "Phase 2: Handcrafting & Preparing"}
                                {order.status === "SHIPPED" && "Phase 3: Package Dispatched / In Transit"}
                                {order.status === "COMPLETED" && "Phase 4: Acquisition Delivered Successfully"}
                              </span>
                            </div>
                            
                            <div className="relative pt-2">
                              {/* Background Bar */}
                              <div className="absolute top-[17px] left-4 right-4 h-1 bg-zinc-200 rounded-full" />
                              
                              {/* Active Progress Sheen */}
                              <div 
                                className="absolute top-[17px] left-4 h-1 bg-brand-navy transition-all duration-1000 ease-out rounded-full" 
                                style={{ 
                                  width: 
                                    order.status === "PENDING" ? "0%" : 
                                    order.status === "PROCESSING" ? "33%" : 
                                    order.status === "SHIPPED" ? "66%" : 
                                    order.status === "COMPLETED" ? "100%" : "0%" 
                                }}
                              />
                              
                              {/* Milestones grid */}
                              <div className="grid grid-cols-4 relative z-10">
                                <div className="flex flex-col items-center gap-2">
                                  <div className={cn(
                                    "size-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-500 shadow-sm",
                                    ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED"].includes(order.status)
                                      ? "bg-brand-navy border-brand-navy text-white scale-110"
                                      : "bg-white border-zinc-200 text-zinc-400"
                                  )}>
                                    1
                                  </div>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-wider transition-colors",
                                    ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED"].includes(order.status) ? "text-brand-navy" : "text-zinc-400"
                                  )}>Placed</span>
                                </div>

                                <div className="flex flex-col items-center gap-2">
                                  <div className={cn(
                                    "size-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-500 shadow-sm",
                                    ["PROCESSING", "SHIPPED", "COMPLETED"].includes(order.status)
                                      ? "bg-brand-navy border-brand-navy text-white scale-110"
                                      : "bg-white border-zinc-200 text-zinc-400"
                                  )}>
                                    2
                                  </div>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-wider transition-colors",
                                    ["PROCESSING", "SHIPPED", "COMPLETED"].includes(order.status) ? "text-brand-navy" : "text-zinc-400"
                                  )}>Preparing</span>
                                </div>

                                <div className="flex flex-col items-center gap-2">
                                  <div className={cn(
                                    "size-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-500 shadow-sm",
                                    ["SHIPPED", "COMPLETED"].includes(order.status)
                                      ? "bg-brand-navy border-brand-navy text-white scale-110"
                                      : "bg-white border-zinc-200 text-zinc-400"
                                  )}>
                                    3
                                  </div>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-wider transition-colors",
                                    ["SHIPPED", "COMPLETED"].includes(order.status) ? "text-brand-navy" : "text-zinc-400"
                                  )}>Shipped</span>
                                </div>

                                <div className="flex flex-col items-center gap-2">
                                  <div className={cn(
                                    "size-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-500 shadow-sm",
                                    ["COMPLETED"].includes(order.status)
                                      ? "bg-brand-navy border-brand-navy text-white scale-110"
                                      : "bg-white border-zinc-200 text-zinc-400"
                                  )}>
                                    4
                                  </div>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-wider transition-colors",
                                    ["COMPLETED"].includes(order.status) ? "text-brand-navy" : "text-zinc-400"
                                  )}>Delivered</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-zinc-50/50 p-3 px-6 border-t border-border/30 flex gap-3 overflow-x-auto scrollbar-hide">
                          {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="size-10 rounded-lg bg-white border border-border/10 relative overflow-hidden flex-shrink-0 shadow-sm">
                                  {item.variant?.product?.images?.[0] ? (
                                      <NextImage src={item.variant.product.images[0]} alt="" fill className="object-cover" />
                                  ) : (
                                      <div className="flex items-center justify-center h-full opacity-10"><Package className="size-3" /></div>
                                  )}
                              </div>
                          ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Metrics */}
            <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-[120px]">
                <div className="glass-card p-8 rounded-[2.5rem] border-none shadow-2xl space-y-8 relative overflow-hidden bg-white">
                    <div className="absolute inset-0 bg-brand-mesh opacity-5 pointer-events-none" />
                    
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="size-8 bg-brand-navy/10 rounded-lg flex items-center justify-center text-brand-navy">
                                <MapPin className="size-4" />
                            </div>
                            <h3 className="font-black text-base tracking-tight">Active Address</h3>
                        </div>
                        <p className="text-[11px] font-bold leading-relaxed text-muted-foreground italic bg-zinc-50 p-5 rounded-2xl border border-border/10">
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
                            <div className="bg-zinc-50 p-5 rounded-[1.5rem] space-y-0.5 border border-border/10 text-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Orders</p>
                                <p className="text-lg font-black tracking-tighter">{orders.length}</p>
                            </div>
                            <div className="bg-zinc-50 p-5 rounded-[1.5rem] space-y-0.5 border border-border/10 text-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Investment</p>
                                <p className="text-lg font-black tracking-tighter">₦{orders.reduce((acc, o) => acc + Number(o.totalAmount), 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-2 text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
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

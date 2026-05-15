"use client";

import { useEffect, useState } from "react";
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
  CheckCircle2, 
  XCircle,
  Zap,
  ShieldCheck,
  Search,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getPatronOrdersAction } from "@/modules/orders/actions/order.actions";
import { OrderReceipt } from "@/modules/orders/components/order-receipt";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/account");
    }

    if (status === "authenticated" && (session?.user as any)?.customerId) {
      loadOrders();
    } else if (status === "authenticated" && !(session?.user as any)?.customerId) {
        // Staff/Admin logged in, redirect or show message
        setIsLoading(false);
    }
  }, [status, session, router]);

  const loadOrders = async () => {
    setIsLoading(true);
    const result = await getPatronOrdersAction((session?.user as any).customerId);
    if (result.success) {
      setOrders(result.data || []);
    }
    setIsLoading(false);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Authenticating Patron Identity...</p>
      </div>
    );
  }

  if (!(session?.user as any)?.customerId && status === "authenticated") {
      return (
          <div className="min-h-[80vh] flex flex-col items-center justify-center container mx-auto px-6 text-center">
              <div className="size-20 bg-brand-navy/10 rounded-[2rem] flex items-center justify-center text-brand-navy mb-8">
                  <ShieldCheck className="size-10" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter mb-4">Staff Intelligence detected</h1>
              <p className="text-muted-foreground max-w-md mx-auto font-medium mb-10">
                  You are currently logged in with executive credentials. Please access the Management Command Center for order auditing.
              </p>
              <Button onClick={() => router.push("/dashboard")} className="h-16 px-10 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl">
                  GO TO COMMAND CENTER
              </Button>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-zinc-50 pt-32 pb-40 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-brand-mesh opacity-5 pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto space-y-16">
          
          {/* Executive Profile Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-8">
              <div className="size-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center text-brand-navy ring-8 ring-white/50">
                <User className="size-12" />
              </div>
              <div className="space-y-1">
                <h1 className="text-5xl font-black tracking-tighter leading-tight">{session?.user?.name || "Patron"}</h1>
                <div className="flex items-center gap-4">
                    <Badge className="bg-brand-navy/10 text-brand-navy border-none font-black text-[10px] px-3 uppercase tracking-widest">
                        VIP PATRON
                    </Badge>
                    <span className="text-xs text-muted-foreground font-black uppercase tracking-widest opacity-40">{session?.user?.email}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
                <Button variant="outline" className="h-14 px-8 glass-card border-none rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-white active:scale-95">
                    <Settings className="mr-2 size-4" />
                    SECURITY SETTINGS
                </Button>
                <Button onClick={() => signOut()} className="h-14 px-8 bg-zinc-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-zinc-950/20 active:scale-95 transition-all">
                    <LogOut className="mr-2 size-4" />
                    SIGN OUT
                </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Left: Order Acquisitions */}
            <div className="lg:col-span-8 space-y-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight">Acquisition History</h2>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">GLOBAL LOGISTICS LEDGER</p>
                </div>
                <Button variant="ghost" className="text-brand-navy font-black text-[10px] uppercase tracking-widest gap-2">
                    <Clock className="size-4" />
                    FILTER RECENT
                </Button>
              </div>

              <div className="space-y-6">
                {orders.length === 0 ? (
                  <div className="glass-card p-20 text-center rounded-[3rem] border-none shadow-sm">
                    <ShoppingBag className="size-16 mx-auto text-muted-foreground/20 mb-6" />
                    <p className="text-xl font-bold text-foreground/50 italic mb-6">No acquisitions recorded yet.</p>
                    <Button onClick={() => router.push("/shop")} className="h-16 px-10 bg-brand-navy text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-navy/20">
                        START YOUR COLLECTION
                    </Button>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="glass-card overflow-hidden rounded-[2.5rem] border-none shadow-sm group hover:shadow-2xl hover:shadow-brand-navy/5 transition-all duration-500">
                      <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="size-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-brand-navy group-hover:rotate-12 transition-transform shadow-inner border border-border/10">
                                <Zap className="size-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">ACQUISITION ID</p>
                                <h3 className="text-xl font-black tracking-tighter">{order.orderNumber}</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    <span className="size-1 rounded-full bg-border" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{order.items?.length || 0} ITEMS</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-10">
                            <div className="text-right space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">TOTAL VALUE</p>
                                <p className="text-xl font-black tracking-tighter">₦{Number(order.totalAmount).toLocaleString()}</p>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                                <Badge className={cn(
                                    "font-black text-[10px] px-3 uppercase tracking-widest border-none py-1 shadow-sm",
                                    order.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600" :
                                    order.status === "PENDING" ? "bg-amber-500/10 text-amber-600" :
                                    "bg-rose-500/10 text-rose-600"
                                )}>
                                    {order.status}
                                </Badge>
                                <Button 
                                    onClick={() => setSelectedOrderId(order.id)}
                                    variant="link" 
                                    className="p-0 h-auto text-[10px] font-black uppercase tracking-widest text-brand-navy hover:no-underline flex items-center gap-2"
                                >
                                    VIEW RECEIPT <ChevronRight className="size-3" />
                                </Button>
                            </div>
                        </div>
                      </div>
                      
                      {/* Item Preview Strip */}
                      <div className="bg-zinc-50/50 p-4 px-8 border-t border-border/30 flex gap-4 overflow-x-auto scrollbar-hide">
                          {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="size-12 rounded-xl bg-white border border-border/10 relative overflow-hidden flex-shrink-0 shadow-sm">
                                  {item.variant?.product?.images?.[0] ? (
                                      <Image src={item.variant.product.images[0]} alt="" fill className="object-cover" />
                                  ) : (
                                      <div className="flex items-center justify-center h-full opacity-10"><Package className="size-4" /></div>
                                  )}
                              </div>
                          ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Patron Briefing */}
            <div className="lg:col-span-4 space-y-10 lg:sticky lg:top-32">
                <div className="glass-card p-10 rounded-[3rem] border-none shadow-2xl space-y-10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-brand-mesh opacity-5 pointer-events-none" />
                    
                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="size-10 bg-brand-navy/10 rounded-xl flex items-center justify-center text-brand-navy">
                                <MapPin className="size-5" />
                            </div>
                            <h3 className="font-black text-lg tracking-tight">Active Address</h3>
                        </div>
                        <p className="text-xs font-bold leading-relaxed text-muted-foreground italic bg-zinc-50 p-6 rounded-2xl border border-border/10">
                            {orders[0]?.customer?.address || "No active address recorded."}
                        </p>
                    </div>

                    <div className="space-y-6 relative z-10">
                         <div className="flex items-center gap-4">
                            <div className="size-10 bg-brand-navy/10 rounded-xl flex items-center justify-center text-brand-navy">
                                <ShieldCheck className="size-5" />
                            </div>
                            <h3 className="font-black text-lg tracking-tight">Acquisition Pulse</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-50 p-6 rounded-[2rem] space-y-1 border border-border/10">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Portfolio</p>
                                <p className="text-xl font-black tracking-tighter">{orders.length}</p>
                            </div>
                            <div className="bg-zinc-50 p-6 rounded-[2rem] space-y-1 border border-border/10">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Spent</p>
                                <p className="text-xl font-black tracking-tighter">₦{orders.reduce((acc, o) => acc + Number(o.totalAmount), 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-center gap-3 text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">
                        <ShieldCheck className="size-4" />
                        NextGen Privacy integrity
                    </div>
                </div>

                <div className="bg-zinc-950 rounded-[3rem] p-10 text-white space-y-6 shadow-2xl shadow-zinc-950/30">
                    <div className="flex items-center gap-4 text-brand-navy">
                        <Zap className="size-6 fill-brand-navy" />
                        <h4 className="font-black text-sm uppercase tracking-widest">Premium Service</h4>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                        As a VIP Patron, you have direct access to our priority fulfillment lines. Every order is audited for quality before dispatch.
                    </p>
                    <Button variant="outline" className="w-full h-14 bg-white/5 border-none hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all">
                        CONTACT ARCHITECTS
                    </Button>
                </div>
            </div>
          </div>
        </div>
      </div>

      <OrderReceipt 
        orderId={selectedOrderId} 
        onClose={() => setSelectedOrderId(null)} 
      />
    </div>
  );
}

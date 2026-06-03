"use client";

import { useEffect, useState } from "react";
import { 
  User, 
  History, 
  ShoppingBag, 
  Mail, 
  Phone, 
  Star,
  Zap,
  ShieldCheck,
  BarChart3,
  Package,
  TrendingUp
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCustomerDetailAction } from "../actions/customer.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface CustomerDetailModalProps {
  customerId: string | null;
  previewData?: {
    name: string;
    email: string;
    totalSpent: number;
    lastOrder: string | null;
    sales?: { id: string }[];
  } | null;
  onClose: () => void;
}

export function CustomerDetailModal({ customerId, previewData, onClose }: CustomerDetailModalProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!customerId) {
      setData(null);
      return;
    }
    // Reset to null so previous customer doesn't bleed
    setData(null);
    setIsLoading(true);

    getCustomerDetailAction(customerId).then((result) => {
      if (result.success) setData(result.data);
      setIsLoading(false);
    });
  }, [customerId]);

  // Use full data if loaded, else fall back to preview for instant display
  const displayName  = data?.name  ?? previewData?.name  ?? "";
  const displayEmail = data?.email ?? previewData?.email ?? "";
  const displayLTV   = data?.metrics?.ltv ?? previewData?.totalSpent ?? 0;
  const displayOrders= data?.metrics?.orderCount ?? previewData?.sales?.length ?? 0;
  const displayAOV   = data?.metrics?.aov ?? (displayOrders > 0 ? displayLTV / displayOrders : 0);
  const isVip = displayLTV > 100000;

  return (
    <Dialog open={!!customerId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[2rem]">
        {!displayName ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 bg-white">
            <LoadingSpinner size="lg" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading customer data...</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-full overflow-hidden">

            {/* ── LEFT: Identity & Stats ── */}
            <div className="md:w-[300px] flex-shrink-0 flex flex-col justify-between text-white overflow-y-auto"
              style={{ background: "linear-gradient(160deg, #0f2352 0%, #152d6b 50%, #1a3a8a 100%)" }}>

              {/* Top */}
              <div className="p-8 space-y-7">
                {/* Avatar */}
                <div className="size-20 bg-white/15 backdrop-blur rounded-3xl flex items-center justify-center shadow-2xl ring-4 ring-white/10">
                  <User className="size-10 text-white" />
                </div>

                {/* Name & Tier */}
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight leading-tight">{displayName}</h2>
                  <Badge className={`border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest ${isVip ? "bg-amber-400/20 text-amber-300" : "bg-white/10 text-white/80"}`}>
                    {isVip ? "⭐ VIP PATRON" : "LOYAL CUSTOMER"}
                  </Badge>
                </div>

                {/* Contact Info */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3 text-white/60">
                    <Mail className="size-4 flex-shrink-0" />
                    <span className="text-[11px] font-semibold truncate">{displayEmail}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/60">
                    <Phone className="size-4 flex-shrink-0" />
                    <span className="text-[11px] font-semibold">{data?.phone || previewData?.email ? "—" : "Not provided"}</span>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* KPI Grid */}
                <div className="space-y-5">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">LIFETIME VALUE</p>
                    <p className="text-3xl font-black tracking-tighter">₦{displayLTV.toLocaleString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-2xl p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">ORDERS</p>
                      <p className="text-2xl font-black">{displayOrders}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">AVG ORDER</p>
                      <p className="text-lg font-black">₦{Math.round(displayAOV).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom stamp */}
              <div className="px-8 pb-6 flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest">
                <ShieldCheck className="size-3" /> NextGen CRM
              </div>
            </div>

            {/* ── RIGHT: Activity Panel ── */}
            <div className="flex-1 bg-white overflow-y-auto p-8 space-y-8">

              {isLoading && (
                <div className="flex items-center gap-3 text-xs font-bold text-zinc-400 animate-pulse">
                  <LoadingSpinner size="sm" />
                  Loading full history...
                </div>
              )}

              {/* Purchase History */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0f2352]">Purchase History</h4>
                  <History className="size-4 text-[#0f2352]/30" />
                </div>

                {!data ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-16 rounded-2xl bg-zinc-100 animate-pulse" />
                    ))}
                  </div>
                ) : data.sales.length === 0 ? (
                  <div className="py-12 text-center bg-zinc-50 rounded-3xl">
                    <ShoppingBag className="size-8 mx-auto text-zinc-200 mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">No Purchases Yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.sales.map((sale: any) => (
                      <div key={sale.id} className="flex flex-col p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-all gap-3 border border-zinc-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-9 bg-[#0f2352]/10 rounded-xl flex items-center justify-center">
                              <Zap className="size-4 text-[#0f2352]" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                                {new Date(sale.createdAt).toLocaleDateString("en-NG", { day:"2-digit", month:"short", year:"numeric" })}
                                {" · "}
                                {new Date(sale.createdAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                              </span>
                              <span className="font-black text-sm text-zinc-800">{sale.orderNumber}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-sm text-zinc-900 block">₦{Number(sale.totalAmount).toLocaleString()}</span>
                            <Badge className="text-[8px] font-black border-none bg-emerald-100 text-emerald-600 px-2">
                              {sale.status}
                            </Badge>
                          </div>
                        </div>

                        {sale.items && sale.items.length > 0 && (
                          <div className="pl-3 border-l-2 border-[#0f2352]/10 space-y-1.5">
                            {sale.items.map((item: any, idx: number) => (
                              <div key={item.id || idx} className="flex justify-between items-center text-[11px]">
                                <span className="text-zinc-600 flex items-center gap-1.5">
                                  <Package className="size-3 text-zinc-300" />
                                  {item.variant?.product?.name ?? "Unknown product"}
                                  {(item.variant?.size || item.variant?.color) && (
                                    <span className="text-zinc-400">
                                      ({item.variant?.size}{item.variant?.color ? ` / ${item.variant.color}` : ""})
                                    </span>
                                  )}
                                  <span className="font-bold text-zinc-500">×{item.quantity}</span>
                                </span>
                                <span className="font-semibold text-zinc-700">₦{Number(item.price).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Frequent Products */}
              {data?.metrics?.topProducts?.length > 0 && (
                <section className="space-y-4">
                  <Separator className="bg-zinc-100" />
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Most Purchased</h4>
                    <Star className="size-4 text-orange-400/40" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {data.metrics.topProducts.map((p: any, i: number) => (
                      <div key={i} className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex flex-col gap-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-orange-400">#{i+1}</span>
                        <span className="font-bold text-xs text-orange-900 truncate">{p.name}</span>
                        <span className="text-[10px] font-black text-orange-600">{p.qty} units</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Spending Trend */}
              {data?.trend && (
                <section className="space-y-4">
                  <Separator className="bg-zinc-100" />
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Spending Trend</h4>
                    <TrendingUp className="size-4 text-zinc-300" />
                  </div>
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.trend}>
                        <defs>
                          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#0f2352" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#0f2352" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#aaa" }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #f0f0f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                          formatter={(v: any) => [`₦${Number(v).toLocaleString()}`, "Spent"]}
                        />
                        <Area type="monotone" dataKey="spent" stroke="#0f2352" strokeWidth={2.5} fillOpacity={1} fill="url(#blueGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { 
  User, 
  CreditCard, 
  History, 
  TrendingUp, 
  ShoppingBag, 
  Mail, 
  Phone, 
  MapPin, 
  Star,
  Zap,
  ArrowRight,
  ShieldCheck,
  BarChart3
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCustomerDetailAction } from "../actions/customer.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface CustomerDetailModalProps {
  customerId: string | null;
  onClose: () => void;
}

export function CustomerDetailModal({ customerId, onClose }: CustomerDetailModalProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!customerId) return;

    async function loadData() {
      setIsLoading(true);
      const result = await getCustomerDetailAction(customerId!);
      if (result.success) {
        setData(result.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [customerId]);

  return (
    <Dialog open={!!customerId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none glass-card shadow-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl rounded-[3rem]">
        {isLoading ? (
          <div className="h-[500px] flex flex-col items-center justify-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Auditing Relationship History...</p>
          </div>
        ) : data ? (
          <div className="flex flex-col md:flex-row h-full">
            {/* Left: Identity & Metrics */}
            <div className="md:w-1/3 bg-brand-mesh p-10 flex flex-col justify-between text-white border-r border-white/10">
                <div className="space-y-8 relative z-10">
                    <div className="size-24 bg-white/20 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-white/5 group overflow-hidden">
                        <User className="size-12 text-white group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black tracking-tighter leading-tight">{data.name}</h2>
                        <Badge className="bg-white/10 text-white border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest">
                            {data.metrics.ltv > 100000 ? "VIP PATRON" : "LOYAL CURATOR"}
                        </Badge>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-3 text-white/60 group">
                            <Mail className="size-4 group-hover:text-white transition-colors" />
                            <span className="text-[10px] font-bold truncate">{data.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/60 group">
                            <Phone className="size-4 group-hover:text-white transition-colors" />
                            <span className="text-[10px] font-bold">{data.phone || "UNSPECIFIED"}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 space-y-6 relative z-10">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">LIFETIME VALUE</p>
                        <p className="text-3xl font-black tracking-tighter">₦{data.metrics.ltv.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">ORDERS</p>
                            <p className="text-xl font-black tracking-tighter">{data.metrics.orderCount}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">AOV</p>
                            <p className="text-xl font-black tracking-tighter">₦{Math.round(data.metrics.aov).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: History & Actions */}
            <div className="flex-1 p-10 bg-white dark:bg-zinc-950 overflow-y-auto max-h-[80vh] scrollbar-hide">
                <div className="space-y-10">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-navy">ACQUISITION HISTORY</h4>
                            <History className="size-4 text-brand-navy/30" />
                        </div>
                        
                        <div className="space-y-3">
                            {data.sales.length === 0 ? (
                                <div className="py-12 text-center glass-card border-none bg-zinc-50 rounded-3xl">
                                    <ShoppingBag className="size-8 mx-auto text-muted-foreground/20 mb-3" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No Transactions Recorded</p>
                                </div>
                            ) : (
                                data.sales.map((sale: any) => (
                                    <div key={sale.id} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm border border-border/10 group-hover:rotate-12 transition-transform">
                                                <Zap className="size-4 text-brand-navy" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{new Date(sale.createdAt).toLocaleDateString()}</span>
                                                <span className="font-black text-sm tracking-tight">{sale.orderNumber}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <span className="font-black text-sm tracking-tight text-foreground">₦{Number(sale.totalAmount).toLocaleString()}</span>
                                            <Badge variant="outline" className="text-[8px] font-black border-none bg-emerald-500/10 text-emerald-600 px-2 tracking-widest uppercase">
                                                {sale.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <Separator className="bg-border/30" />

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-silver">PATRON TRAJECTORY</h4>
                            <BarChart3 className="size-4 text-brand-silver/30" />
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.trend}>
                                    <defs>
                                        <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="oklch(0.65 0.25 15)" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="oklch(0.65 0.25 15)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border) / 0.3)" />
                                    <XAxis 
                                        dataKey="month" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fontWeight: 700, fill: "oklch(var(--muted-foreground))" }} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: "oklch(var(--background) / 0.8)", 
                                            backdropFilter: "blur(12px)", 
                                            borderRadius: "12px", 
                                            border: "none",
                                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                                        }}
                                        labelStyle={{ fontWeight: 800, fontSize: 10, color: "oklch(var(--foreground))" }}
                                        itemStyle={{ fontWeight: 800, fontSize: 10, color: "oklch(0.65 0.25 15)" }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="spent" 
                                        stroke="oklch(0.65 0.25 15)" 
                                        strokeWidth={3} 
                                        fillOpacity={1} 
                                        fill="url(#colorSpent)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <Separator className="bg-border/30" />

                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-silver">RELATIONSHIP CONTROL</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Button className="h-16 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-navy/20 transition-all active:scale-95">
                                <Mail className="mr-2 size-4" />
                                DISPATCH BRIEFING
                            </Button>
                            <Button variant="outline" className="h-16 glass-card border-none rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">
                                <Star className="mr-2 size-4 text-amber-500" />
                                FLAG AS VIP
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] pt-4">
                        <ShieldCheck className="size-4" />
                        NextGen CRM Integrity Guaranteed
                    </div>
                </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Patron Intel Not Found.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

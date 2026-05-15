"use client";

import { useEffect, useState } from "react";
import { 
  User, 
  Mail, 
  Shield, 
  TrendingUp, 
  ShoppingBag, 
  Target, 
  Calendar,
  Lock,
  LogOut,
  Settings,
  Zap,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { getProfileDashboardAction } from "@/modules/users/actions/profile.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

export default function ProfilePage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const result = await getProfileDashboardAction();
      if (result.success) {
        setData(result.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Personal Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-slow-fade">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-gradient">Personal Intelligence</h2>
          <p className="text-muted-foreground font-medium">Manage your identity and track your impact on the fashion ecosystem.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="glass-card border-none h-12 px-6 font-black text-xs uppercase tracking-widest">
            <Settings className="mr-2 h-4 w-4" />
            CONFIG
          </Button>
          <Button 
            onClick={() => signOut()}
            variant="ghost" 
            className="text-rose-500 hover:bg-rose-500/5 h-12 px-6 font-black text-xs uppercase tracking-widest"
          >
            <LogOut className="mr-2 h-5 w-5" />
            TERMINATE SESSION
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Identity Card */}
        <div className="lg:col-span-1 space-y-10">
            <Card className="border-none shadow-2xl glass-card overflow-hidden p-10 space-y-8 rounded-[3rem]">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="size-32 rounded-[2.5rem] bg-brand-navy/10 flex items-center justify-center text-brand-navy font-black text-5xl shadow-inner relative group">
                        <div className="absolute inset-0 bg-brand-mesh opacity-10 rounded-[2.5rem] animate-pulse" />
                        {data.user.name?.charAt(0) || "U"}
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black tracking-tight">{data.user.name}</h3>
                        <Badge className={cn(
                            "border-none font-black text-[10px] px-4 py-1 uppercase tracking-widest",
                            data.user.role === "ADMIN" ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/20" : "bg-brand-silver text-white shadow-lg shadow-brand-silver/20"
                        )}>
                            {data.user.role} SIGNATURE
                        </Badge>
                    </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-border/30">
                    <div className="flex items-center gap-4 group">
                        <div className="size-10 rounded-xl bg-muted/30 flex items-center justify-center group-hover:bg-brand-navy group-hover:text-white transition-all">
                            <Mail className="size-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Digital ID</span>
                            <span className="text-sm font-bold">{data.user.email}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                        <div className="size-10 rounded-xl bg-muted/30 flex items-center justify-center group-hover:bg-brand-silver group-hover:text-white transition-all">
                            <Shield className="size-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authority Level</span>
                            <span className="text-sm font-bold">{data.user.role === "ADMIN" ? "Full Orchestration" : "Standard Operations"}</span>
                        </div>
                    </div>
                </div>

                <Button className="w-full h-14 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">
                    <Lock className="mr-3 size-4" />
                    MODIFY SECURITY KEYS
                </Button>
            </Card>

            <Card className="border-none shadow-sm glass-card p-10 rounded-[2.5rem] bg-gradient-to-br from-brand-navy/5 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 size-32 bg-brand-navy/10 rounded-full blur-3xl" />
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 text-brand-navy">
                        <Zap className="size-5 fill-current" />
                        <h4 className="text-xs font-black uppercase tracking-[0.2em]">NextGen Achievement</h4>
                    </div>
                    <p className="text-lg font-black tracking-tight leading-snug">You are in the top 5% of fashion orchestrators this month.</p>
                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs">
                        <Sparkles className="size-4" /> Keep up the momentum!
                    </div>
                </div>
            </Card>
        </div>

        {/* Right: Personal Performance */}
        <div className="lg:col-span-2 space-y-10">
            {/* Personal KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Revenue Impact"
                    value={`₦${data.stats.totalRevenue.toLocaleString()}`}
                    icon={TrendingUp}
                    description="Your total lifetime sales"
                    variant="pink"
                />
                <MetricCard
                    title="Transaction Volume"
                    value={data.stats.saleCount}
                    icon={ShoppingBag}
                    description="Total orders fulfilled"
                    variant="blue"
                />
                <MetricCard
                    title="Average Order"
                    value={`₦${Math.round(data.stats.avgSale).toLocaleString()}`}
                    icon={Target}
                    description="Your efficiency metric"
                    variant="slate"
                />
            </div>

            {/* Recent Contributions */}
            <Card className="border-none shadow-2xl glass-card rounded-[3rem] overflow-hidden">
                <CardHeader className="p-10 border-b border-border/30">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black tracking-tight">Fulfillment History</CardTitle>
                            <CardDescription className="font-bold text-xs uppercase tracking-widest">Your most recent transaction signatures.</CardDescription>
                        </div>
                        <Button variant="ghost" className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-navy/5 hover:text-brand-navy">
                            VIEW FULL LEDGER
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {data.user.sales.length === 0 ? (
                        <div className="p-20 text-center">
                            <p className="text-muted-foreground font-medium">No transaction records associated with your identity yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {data.user.sales.map((sale: any) => (
                                <div key={sale.id} className="p-8 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
                                    <div className="flex items-center gap-6">
                                        <div className="size-12 rounded-2xl bg-brand-navy/10 flex items-center justify-center text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-all duration-500 shadow-sm">
                                            <ShoppingBag className="size-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-black text-sm tracking-tight group-hover:text-brand-navy transition-colors">{sale.orderNumber}</p>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                                <Calendar className="size-3" />
                                                {new Date(sale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                <span className="opacity-30">•</span>
                                                {sale.customer?.name || "Walk-in"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-lg font-black tracking-tighter">₦{Number(sale.totalAmount).toLocaleString()}</p>
                                        <Badge className="bg-zinc-100 text-zinc-500 border-none font-black text-[9px] px-2 uppercase tracking-widest">
                                            {sale.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

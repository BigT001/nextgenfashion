"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Calendar,
  Zap
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getExecutiveDashboardAction } from "@/modules/analytics/actions/analytics.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const result = await getExecutiveDashboardAction();
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
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Aggregating Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-slow-fade">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-gradient">Executive Insights</h2>
          <p className="text-muted-foreground font-medium">Real-time business intelligence and performance analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="glass-card border-none h-12 px-6 font-bold">
            <Calendar className="mr-2 h-4 w-4" />
            Last 7 Days
          </Button>
          <Button className="bg-brand-navy hover:bg-brand-navy/90 text-white h-12 px-6 font-black rounded-xl shadow-xl shadow-brand-navy/20 transition-all active:scale-95">
            <Download className="mr-2 h-5 w-5" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`₦${data.kpis.lifetimeRevenue.toLocaleString()}`}
          icon={TrendingUp}
          trend={{ value: 12, isUp: true }}
          description="Lifetime sales volume"
          variant="pink"
        />
        <MetricCard
          title="Today's Revenue"
          value={`₦${data.kpis.todayRevenue.toLocaleString()}`}
          icon={Zap}
          trend={{ value: 5, isUp: true }}
          description="Real-time daily performance"
          variant="blue"
        />
        <MetricCard
          title="Total Orders"
          value={data.kpis.totalSales}
          icon={ShoppingCart}
          trend={{ value: 8, isUp: true }}
          description="Successful transactions"
          variant="slate"
        />
        <MetricCard
          title="Inventory Health"
          value={data.kpis.lowStockCount}
          icon={Package}
          description="Items requiring attention"
          variant={data.kpis.lowStockCount > 0 ? "pink" : "slate"}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2 glass-card border-none overflow-hidden shadow-2xl">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-2xl font-black tracking-tight">Revenue Trajectory</CardTitle>
            <CardDescription className="font-medium">Performance trend across the last 7 business days.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-10 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.25 15)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="oklch(0.65 0.25 15)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--border) / 0.3)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 700, fill: "oklch(var(--muted-foreground))" }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 700, fill: "oklch(var(--muted-foreground))" }}
                  tickFormatter={(value) => `₦${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "oklch(var(--background) / 0.8)", 
                    backdropFilter: "blur(12px)", 
                    borderRadius: "16px", 
                    border: "none",
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)"
                  }}
                  itemStyle={{ fontWeight: 800, color: "oklch(0.65 0.25 15)" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="oklch(0.65 0.25 15)" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products List */}
        <Card className="glass-card border-none shadow-2xl">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-black tracking-tight">Best Sellers</CardTitle>
            <CardDescription className="font-medium">Top performing fashion lines by volume.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="space-y-6">
              {data.topProducts.map((product: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <div className="size-12 rounded-2xl bg-brand-navy/10 flex items-center justify-center font-black text-brand-navy group-hover:scale-110 transition-transform">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate group-hover:text-brand-navy transition-colors">{product.name}</p>
                    <p className="text-xs text-muted-foreground font-medium">{product.quantity} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-foreground">₦{product.revenue.toLocaleString()}</p>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1">
                      <ArrowUpRight className="size-3" />
                      Peak
                    </p>
                  </div>
                </div>
              ))}
              {data.topProducts.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <Package className="size-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-bold italic">No sales data recorded yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


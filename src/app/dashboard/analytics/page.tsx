"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, Package, ShoppingCart, ArrowUpRight, 
  Download, Calendar, Zap, Users, CreditCard, Box, Tag, UserPlus, Clock
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getExecutiveDashboardAction } from "@/modules/analytics/actions/analytics.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSession } from "next-auth/react";
import { AlertTriangle } from "lucide-react";

const COLORS = ['#0B1E3F', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b'];

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const role = (session?.user as any)?.role;
      if (role === "STAFF") {
        setIsLoading(false);
        return;
      }

      const result = await getExecutiveDashboardAction();
      if (result.success) {
        setData(result.data);
      }
      setIsLoading(false);
    }
    if (status !== "loading") {
      loadData();
    }
  }, [session, status]);

  if (status === "loading" || isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Aggregating Intelligence...</p>
      </div>
    );
  }

  const userRole = (session?.user as any)?.role || "STAFF";
  if (userRole === "STAFF" || !data) {
    return (
      <div className="h-[75vh] flex flex-col items-center justify-center text-center p-8">
        <div className="size-16 bg-rose-500/10 rounded-[2rem] flex items-center justify-center text-rose-500 mb-6 animate-pulse">
          <AlertTriangle className="size-8" />
        </div>
        <h3 className="text-2xl font-black tracking-tight text-foreground">Access Restricted</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-2 font-medium">
          This logistical analytics suite is reserved for administrative clearance. Contact System Admin to request access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slow-fade pb-12">
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

      <Tabs defaultValue="financials" className="w-full space-y-8">
        <TabsList className="bg-transparent border-b border-border/40 w-full justify-start rounded-none p-0 h-auto space-x-6">
          <TabsTrigger 
            value="financials" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brand-navy rounded-none px-2 py-4 font-black uppercase tracking-widest text-xs"
          >
            Financial Overview
          </TabsTrigger>
          <TabsTrigger 
            value="inventory" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brand-navy rounded-none px-2 py-4 font-black uppercase tracking-widest text-xs"
          >
            Inventory Intelligence
          </TabsTrigger>
          <TabsTrigger 
            value="customers" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brand-navy rounded-none px-2 py-4 font-black uppercase tracking-widest text-xs"
          >
            Customer Insights
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FINANCIALS */}
        <TabsContent value="financials" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
              title="Average Order Value"
              value={`₦${data.kpis.totalSales > 0 ? Math.round(data.kpis.lifetimeRevenue / data.kpis.totalSales).toLocaleString() : 0}`}
              icon={CreditCard}
              description="Revenue per transaction"
              variant="slate"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

            <Card className="glass-card border-none shadow-2xl flex flex-col">
              <CardHeader className="p-8 pb-4 shrink-0">
                <CardTitle className="text-2xl font-black tracking-tight">Payment Methods</CardTitle>
                <CardDescription className="font-medium">Revenue split by transaction type.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 flex-1 min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.paymentMethods}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="revenue"
                      nameKey="method"
                    >
                      {data.paymentMethods?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => `₦${Number(value || 0).toLocaleString()}`}
                      contentStyle={{ borderRadius: "12px", border: "none", fontWeight: "bold" }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: INVENTORY */}
        <TabsContent value="inventory" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Inventory Value"
              value={`₦${(data.kpis.totalInventoryValue || 0).toLocaleString()}`}
              icon={Box}
              description="Total worth of goods in stock"
              variant="blue"
            />
            <MetricCard
              title="Total Units Left"
              value={(data.kpis.totalInventory || 0).toLocaleString()}
              icon={Package}
              description="Physical items available"
              variant="slate"
            />
            <MetricCard
              title="Low Stock Alerts"
              value={data.kpis.lowStockCount}
              icon={AlertTriangle}
              description="Items requiring restock"
              variant={data.kpis.lowStockCount > 0 ? "pink" : "slate"}
            />
            <MetricCard
              title="Active Categories"
              value={data.categoryPerformance?.length || 0}
              icon={Tag}
              description="Product classifications"
              variant="slate"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="glass-card border-none shadow-2xl">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black tracking-tight">Best Sellers</CardTitle>
                <CardDescription className="font-medium">Top performing fashion lines by volume.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-6">
                  {data.topProducts?.map((product: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <div className="size-12 rounded-2xl bg-brand-navy/10 flex items-center justify-center font-black text-brand-navy group-hover:scale-110 transition-transform shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate group-hover:text-brand-navy transition-colors">{product.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">{product.quantity} units sold</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-sm text-foreground">₦{product.revenue.toLocaleString()}</p>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1">
                          <ArrowUpRight className="size-3" />
                          Peak
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!data.topProducts || data.topProducts.length === 0) && (
                    <div className="py-12 text-center text-muted-foreground">
                      <Package className="size-12 mx-auto mb-4 opacity-20" />
                      <p className="text-sm font-bold italic">No sales data recorded yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-none shadow-2xl flex flex-col">
              <CardHeader className="p-8 pb-4 shrink-0">
                <CardTitle className="text-2xl font-black tracking-tight">Category Performance</CardTitle>
                <CardDescription className="font-medium">Revenue generated per product category.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 flex-1 min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categoryPerformance} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="oklch(var(--border) / 0.3)" />
                    <XAxis type="number" tickFormatter={(val) => `₦${val/1000}k`} />
                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12, fontWeight: 'bold'}} />
                    <Tooltip 
                      formatter={(value: any) => `₦${Number(value || 0).toLocaleString()}`}
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: "12px", border: "none", fontWeight: "bold" }}
                    />
                    <Bar dataKey="revenue" fill="#0B1E3F" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: CUSTOMERS */}
        <TabsContent value="customers" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Total Active Customers"
              value={data.kpis.activeCustomers}
              icon={Users}
              description="Registered patrons"
              variant="blue"
            />
            <MetricCard
              title="Recent Signups"
              value={data.recentSignups?.length || 0}
              icon={UserPlus}
              description="New accounts"
              variant="slate"
            />
            <MetricCard
              title="Average Customer Value"
              value={`₦${data.kpis.activeCustomers > 0 ? Math.round(data.kpis.lifetimeRevenue / data.kpis.activeCustomers).toLocaleString() : 0}`}
              icon={TrendingUp}
              description="LTV per patron"
              variant="slate"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="glass-card border-none shadow-2xl">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black tracking-tight">Recent Signups</CardTitle>
                <CardDescription className="font-medium">The newest patrons to join the network.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-6">
                  {data.recentSignups?.map((customer: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                        <Users className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{customer.name}</p>
                        <p className="text-xs text-muted-foreground font-medium truncate">{customer.email || "No email provided"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-sm text-foreground">{customer._count?.sales || 0} Orders</p>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center justify-end gap-1">
                          <Clock className="size-3" />
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!data.recentSignups || data.recentSignups.length === 0) && (
                    <div className="py-12 text-center text-muted-foreground">
                      <Users className="size-12 mx-auto mb-4 opacity-20" />
                      <p className="text-sm font-bold italic">No patrons registered yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-none shadow-2xl">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black tracking-tight">Recent Transactions</CardTitle>
                <CardDescription className="font-medium">Latest sales activity.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-6">
                  {data.recentSales?.map((sale: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <div className="size-12 rounded-2xl bg-zinc-100 flex items-center justify-center font-black text-zinc-400 shrink-0">
                        <ShoppingCart className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{sale.orderNumber}</p>
                        <p className="text-xs text-muted-foreground font-medium truncate">
                          {sale.customer?.name || sale.user?.name || "Walk-in Customer"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-sm text-foreground">₦{sale.totalAmount.toLocaleString()}</p>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                          {sale.paymentMethod}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!data.recentSales || data.recentSales.length === 0) && (
                    <div className="py-12 text-center text-muted-foreground">
                      <ShoppingCart className="size-12 mx-auto mb-4 opacity-20" />
                      <p className="text-sm font-bold italic">No recent transactions.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

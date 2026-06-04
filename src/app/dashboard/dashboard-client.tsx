"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Zap,
  TrendingDown
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface DashboardClientProps {
  initialData: {
    kpis: {
      lifetimeRevenue: number;
      todayRevenue: number;
      totalSales: number;
      lowStockCount: number;
      totalInventory: number;
      activeCustomers: number;
    };
    trend: Array<{ date: string; revenue: number }>;
    recentSales: any[];
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
    lowStockItems: any[];
  };
}

const DEFAULT_TREND = [
  { date: "Mon", revenue: 150000 },
  { date: "Tue", revenue: 280000 },
  { date: "Wed", revenue: 210000 },
  { date: "Thu", revenue: 420000 },
  { date: "Fri", revenue: 310000 },
  { date: "Sat", revenue: 580000 },
  { date: "Sun", revenue: 480000 }
];

const DEFAULT_RECENT_SALES = [
  {
    id: "def-1",
    customer: { name: "Adora Nwosu" },
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    totalAmount: 180000
  },
  {
    id: "def-2",
    customer: { name: "Chinedu Okafor" },
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    totalAmount: 145000
  },
  {
    id: "def-3",
    customer: { name: "Zara Bello" },
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    totalAmount: 270000
  },
  {
    id: "def-4",
    customer: null,
    createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    totalAmount: 75000
  },
  {
    id: "def-5",
    customer: { name: "Tunde Folawiyo" },
    createdAt: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
    totalAmount: 890000
  }
];

const DEFAULT_TOP_PRODUCTS = [
  { name: "NextGen Luxury Velvet Tuxedo", quantity: 42, revenue: 7560000 },
  { name: "Signature Cashmere Wool Sweater", quantity: 28, revenue: 4060000 },
  { name: "Premium Satin Evening Gown", quantity: 24, revenue: 6480000 },
  { name: "Oxford Button-Down Cotton Shirt", quantity: 18, revenue: 1080000 },
  { name: "Monogrammed Leather Belt", quantity: 15, revenue: 2250000 }
];

const DEFAULT_LOW_STOCK_ITEMS = [
  {
    id: "low-1",
    quantity: 1,
    variant: {
      size: "M",
      sku: "NG-TX-001",
      product: { name: "NextGen Luxury Velvet Tuxedo" }
    }
  }
];

function getInitials(name: string) {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsMounted(true);
    const error = searchParams.get("error");
    if (error === "AccessDenied") {
      toast.error("Access Denied: You do not have permission to view that page.");
    }
  }, [searchParams]);

  const user = session?.user as any;
  const userRole = user?.role || "STAFF";
  const isStaff = userRole === "STAFF";

  const kpis = initialData.kpis;
  
  // High-fidelity fallback toggle: Use mock data ONLY if enabled via env var and merchant has zero real sales.
  // This allows demo curating to look spectacular, but switches instantly to actual logistics when real sales begin!
  const showFallback = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true" && kpis.lifetimeRevenue === 0 && kpis.totalSales === 0;

  const revenueDisplay = showFallback ? 2450000 : kpis.lifetimeRevenue;
  const salesDisplay = showFallback ? 452 : kpis.totalSales;
  const inventoryDisplay = showFallback ? 402 : kpis.totalInventory;
  const customersDisplay = showFallback ? 2 : kpis.activeCustomers;
  const lowStockCountDisplay = showFallback ? 1 : kpis.lowStockCount;

  const chartData = showFallback ? DEFAULT_TREND : initialData.trend;
  const recentSalesList = showFallback ? DEFAULT_RECENT_SALES : initialData.recentSales;
  const topProductsList = showFallback ? DEFAULT_TOP_PRODUCTS : initialData.topProducts;
  const lowStockItemsList = showFallback ? DEFAULT_LOW_STOCK_ITEMS : initialData.lowStockItems;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card border-none bg-zinc-950/90 text-white p-4 rounded-[1.5rem] shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{payload[0].payload.date}</p>
          <p className="text-lg font-black text-white mt-1">₦{Number(payload[0].value).toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10 animate-slow-fade">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {isStaff ? (
            <h2 className="text-4xl font-black tracking-tight text-gradient">
              Welcome back, {user?.name || "Curator"}.
            </h2>
          ) : (
            <>
              <h2 className="text-4xl font-black tracking-tight text-gradient">
                Dashboard Overview
              </h2>
              <p className="text-muted-foreground font-medium">
                Welcome back, {user?.name || "Curator"}. Here's your global logistics intelligence signature.
              </p>
            </>
          )}
        </div>
        {isStaff && (
          <Link 
            href="/dashboard/pos" 
            className="bg-brand-navy hover:bg-brand-navy/90 text-white h-12 px-6 rounded-xl shadow-xl shadow-brand-navy/20 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <Zap className="size-4" />
            New Sale
          </Link>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className={cn(
        "grid gap-6 md:grid-cols-2",
        isStaff ? "lg:grid-cols-3" : "lg:grid-cols-4"
      )}>
        {/* Total Revenue - Hidden for Staff */}
        {!isStaff && (
          <Link href="/dashboard/analytics" className="block cursor-pointer hover:no-underline transition-all duration-300 hover:-translate-y-1">
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-950 rounded-[2rem] transition-all hover:shadow-md group h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Revenue</CardTitle>
                <div className="size-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:rotate-12 transition-transform duration-500">
                  <DollarSign className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-3xl font-black tracking-tighter text-foreground">
                  ₦{Number(revenueDisplay).toLocaleString()}
                </div>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1.5 pt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +12.5% from last month
                </p>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Total Sales / Orders */}
        <Link href="/dashboard/orders" className="block cursor-pointer hover:no-underline transition-all duration-300 hover:-translate-y-1">
          <Card className="border-none shadow-sm bg-white dark:bg-zinc-950 rounded-[2rem] transition-all hover:shadow-md group h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Sales</CardTitle>
              <div className="size-10 bg-brand-navy/10 rounded-2xl flex items-center justify-center text-brand-navy group-hover:rotate-12 transition-transform duration-500">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-black tracking-tighter text-foreground">
                +{salesDisplay}
              </div>
              <p className="text-[10px] text-brand-navy font-black uppercase tracking-widest flex items-center gap-1.5 pt-1">
                <ArrowUpRight className="h-3 w-3" />
                +18% from yesterday
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Inventory Items */}
        <Link href="/dashboard/inventory" className="block cursor-pointer hover:no-underline transition-all duration-300 hover:-translate-y-1">
          <Card className="border-none shadow-sm bg-white dark:bg-zinc-950 rounded-[2rem] transition-all hover:shadow-md group h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Inventory Items</CardTitle>
              <div className="size-10 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 group-hover:rotate-12 transition-transform duration-500">
                <Package className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-black tracking-tighter text-foreground">
                {Number(inventoryDisplay).toLocaleString()}
              </div>
              <p className={cn(
                "text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 pt-1",
                lowStockCountDisplay > 0 ? "text-rose-500 animate-pulse" : "text-muted-foreground"
              )}>
                {lowStockCountDisplay > 0 ? (
                  <>
                    <AlertTriangle className="h-3 w-3" />
                    {lowStockCountDisplay} items low in stock
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    All stock bounds optimal
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Active Customers */}
        <Link href="/dashboard/customers" className="block cursor-pointer hover:no-underline transition-all duration-300 hover:-translate-y-1">
          <Card className="border-none shadow-sm bg-white dark:bg-zinc-950 rounded-[2rem] transition-all hover:shadow-md group h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Customers</CardTitle>
              <div className="size-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:rotate-12 transition-transform duration-500">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-black tracking-tighter text-foreground">
                {Number(customersDisplay).toLocaleString()}
              </div>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest flex items-center gap-1.5 pt-1">
                <ArrowUpRight className="h-3 w-3" />
                +4.3% this week
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Intelligence Grid - Admin/Superadmin Only */}
      {!isStaff && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Recharts Revenue Area Chart */}
          <Card className="lg:col-span-4 border-none shadow-sm bg-white dark:bg-zinc-950 rounded-[2.5rem] p-6 relative overflow-hidden">
            <CardHeader className="px-2 pb-6">
              <CardTitle className="text-xl font-black tracking-tight">Revenue Overview</CardTitle>
              <CardDescription className="font-medium text-xs">Dynamic performance analytics mapping 7-day transactions.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 h-[320px]">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#a1a1aa" 
                      fontSize={10} 
                      fontWeight={900} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#a1a1aa" 
                      fontSize={9} 
                      fontWeight={900} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `₦${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e4e4e7', strokeWidth: 1 }} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#0f172a" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Visualization Wave...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hydrated Recent Sales Logs */}
          <Card className="lg:col-span-3 border-none shadow-sm bg-white dark:bg-zinc-950 rounded-[2.5rem] p-6">
            <CardHeader className="px-2 pb-3">
              <CardTitle className="text-xl font-black tracking-tight">Recent Sales</CardTitle>
              <CardDescription className="font-medium text-xs">Real-time acquisitions across POS counter and store checkout.</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {recentSalesList.length > 0 ? (
                  recentSalesList.map((sale: any) => {
                    const customerName = sale.customerLabel || sale.Customer?.name || sale.customer?.name || "Guest";
                    const initials = getInitials(customerName === "Online Order" ? "OL" : customerName === "Walk-in Customer" ? "WK" : customerName);
                    const channel = sale.channel || (sale.paymentMethod === "TRANSFER" ? "Online" : "POS");
                    const isOnline = channel === "Online";
                    
                    return (
                      <Link href={`/dashboard/orders?id=${sale.id}`} key={sale.id} className="flex items-center justify-between pb-3 border-b border-border/20 last:border-0 last:pb-0 hover:translate-x-1 transition-transform cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "size-11 rounded-2xl border border-border/10 flex items-center justify-center font-black text-xs shadow-sm uppercase shrink-0 transition-colors",
                            isOnline ? "bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-500/20" : "bg-zinc-50 dark:bg-zinc-900 text-brand-navy group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800"
                          )}>
                            {initials}
                          </div>
                          <div className="space-y-0.5 max-w-[150px]">
                            <p className="text-sm font-black tracking-tight text-foreground truncate group-hover:text-brand-navy transition-colors">{customerName}</p>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1">
                              <Clock className="size-3" />
                              {timeAgo(sale.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-black tracking-tighter text-foreground group-hover:text-brand-navy transition-colors">
                            ₦{Number(sale.totalAmount).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1.5 justify-end">
                            <Badge className={cn(
                              "border-none font-black text-[8px] tracking-widest px-2 uppercase shadow-sm",
                              isOnline ? "bg-indigo-500/10 text-indigo-600" : "bg-brand-navy/10 text-brand-navy"
                            )}>
                              {isOnline ? "ONLINE" : "POS"}
                            </Badge>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[8px] tracking-widest px-2 uppercase shadow-sm">
                              SUCCESS
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                    <ShoppingBag className="size-12 opacity-20 mb-4" />
                    <p className="text-sm font-bold italic">No transactions recorded yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Operations Grid - Staff Node View */}
      {isStaff && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Hydrated Recent Sales Logs (4/7 width) */}
          <Card className="lg:col-span-4 border-none shadow-sm bg-white dark:bg-zinc-950 rounded-[2.5rem] p-6">
            <CardHeader className="px-2 pb-3">
              <CardTitle className="text-xl font-black tracking-tight">Recent Sales logs</CardTitle>
              <CardDescription className="font-medium text-xs">Real-time acquisitions across POS counter and store checkout.</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {recentSalesList.length > 0 ? (
                  recentSalesList.map((sale: any) => {
                    const customerName = sale.customerLabel || sale.Customer?.name || sale.customer?.name || "Guest";
                    const initials = getInitials(customerName === "Online Order" ? "OL" : customerName === "Walk-in Customer" ? "WK" : customerName);
                    const channel = sale.channel || (sale.paymentMethod === "TRANSFER" ? "Online" : "POS");
                    const isOnline = channel === "Online";
                    
                    return (
                      <Link href={`/dashboard/orders?id=${sale.id}`} key={sale.id} className="flex items-center justify-between pb-3 border-b border-border/20 last:border-0 last:pb-0 hover:translate-x-1 transition-transform cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "size-11 rounded-2xl border border-border/10 flex items-center justify-center font-black text-xs shadow-sm uppercase shrink-0 transition-colors",
                            isOnline ? "bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-500/20" : "bg-zinc-50 dark:bg-zinc-900 text-brand-navy group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800"
                          )}>
                            {initials}
                          </div>
                          <div className="space-y-0.5 max-w-[150px]">
                            <p className="text-sm font-black tracking-tight text-foreground truncate group-hover:text-brand-navy transition-colors">{customerName}</p>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1">
                              <Clock className="size-3" />
                              {timeAgo(sale.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-black tracking-tighter text-foreground group-hover:text-brand-navy transition-colors">
                            ₦{Number(sale.totalAmount).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1.5 justify-end">
                            <Badge className={cn(
                              "border-none font-black text-[8px] tracking-widest px-2 uppercase shadow-sm",
                              isOnline ? "bg-indigo-500/10 text-indigo-600" : "bg-brand-navy/10 text-brand-navy"
                            )}>
                              {isOnline ? "ONLINE" : "POS"}
                            </Badge>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[8px] tracking-widest px-2 uppercase shadow-sm">
                              SUCCESS
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                    <ShoppingBag className="size-12 opacity-20 mb-4" />
                    <p className="text-sm font-bold italic">No transactions recorded yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stock Replenishment Alerts Card (3/7 width) */}
          <Card className="lg:col-span-3 border-none shadow-sm bg-white dark:bg-zinc-950 rounded-[2.5rem] p-6">
            <CardHeader className="px-2 pb-3">
              <CardTitle className="text-xl font-black tracking-tight">Stock Alerts</CardTitle>
              <CardDescription className="font-medium text-xs">Critical inventory levels running below standard warehouse bounds.</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {lowStockItemsList.length > 0 ? (
                  lowStockItemsList.map((item: any) => {
                    const productName = item.ProductVariant?.Product?.name || "Unknown Product";
                    const size = item.ProductVariant?.size ? `Size ${item.ProductVariant.size}` : "One Size";
                    const sku = item.ProductVariant?.sku || "NO-SKU";
                    
                    return (
                      <Link href={`/dashboard/products?id=${item.ProductVariant?.productId}`} key={item.id} className="flex items-center justify-between pb-3 border-b border-border/20 last:border-0 last:pb-0 hover:translate-x-1 transition-transform cursor-pointer group">
                        <div className="space-y-0.5 max-w-[170px]">
                          <p className="text-sm font-black tracking-tight text-foreground truncate group-hover:text-brand-navy transition-colors">{productName}</p>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            {size} • {sku}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge className="bg-rose-500/10 text-rose-600 border-none font-black text-[9px] tracking-widest px-2 uppercase shadow-sm group-hover:bg-rose-500/20 transition-colors">
                            {item.quantity} LEFT
                          </Badge>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="h-full py-12 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="size-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight text-foreground">All Stocks Optimal</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Zero replenish boundaries breached</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Secondary Performance & Alert Grid - Admin/Superadmin Only */}
      {!isStaff && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Top Selling Collection Card (4/7 width) */}
          <Card className="lg:col-span-4 border-none shadow-sm bg-white dark:bg-zinc-950 rounded-[2.5rem] p-6">
            <CardHeader className="px-2 pb-3">
              <CardTitle className="text-xl font-black tracking-tight">Top Performance Items</CardTitle>
              <CardDescription className="font-medium text-xs">Best selling fashion designs ranked by order volume and acquisition revenue.</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {topProductsList.length > 0 ? (
                  topProductsList.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between pb-3 border-b border-border/20 last:border-0 last:pb-0 hover:translate-x-1 transition-transform">
                      <div className="flex items-center gap-4">
                        <div className="size-8 rounded-xl bg-brand-navy/5 flex items-center justify-center font-black text-xs text-brand-navy">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-black tracking-tight text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            {item.quantity} orders fulfilled
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black tracking-tighter text-foreground">
                          ₦{Number(item.revenue).toLocaleString()}
                        </p>
                        <span className="text-[9px] text-emerald-500 font-black tracking-wider uppercase">
                          TOP PERFORMER
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                    <Package className="size-12 opacity-20 mb-4" />
                    <p className="text-sm font-bold italic">No sales data recorded yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stock Replenishment Alerts Card (3/7 width) */}
          <Card className="lg:col-span-3 border-none shadow-sm bg-white dark:bg-zinc-950 rounded-[2.5rem] p-6">
            <CardHeader className="px-2 pb-3">
              <CardTitle className="text-xl font-black tracking-tight">Stock Replenishment Alerts</CardTitle>
              <CardDescription className="font-medium text-xs">Critical inventory levels running below standard warehouse bounds.</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {lowStockItemsList.length > 0 ? (
                  lowStockItemsList.map((item: any) => {
                    const productName = item.ProductVariant?.Product?.name || "Unknown Product";
                    const size = item.ProductVariant?.size ? `Size ${item.ProductVariant.size}` : "One Size";
                    const sku = item.ProductVariant?.sku || "NO-SKU";
                    
                    return (
                      <Link href={`/dashboard/products?id=${item.ProductVariant?.productId}`} key={item.id} className="flex items-center justify-between pb-3 border-b border-border/20 last:border-0 last:pb-0 hover:translate-x-1 transition-transform cursor-pointer group">
                        <div className="space-y-0.5 max-w-[170px]">
                          <p className="text-sm font-black tracking-tight text-foreground truncate group-hover:text-brand-navy transition-colors">{productName}</p>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            {size} • {sku}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge className="bg-rose-500/10 text-rose-600 border-none font-black text-[9px] tracking-widest px-2 uppercase shadow-sm group-hover:bg-rose-500/20 transition-colors">
                            {item.quantity} LEFT
                          </Badge>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="h-full py-12 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="size-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight text-foreground">All Stocks Optimal</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Zero replenish boundaries breached</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

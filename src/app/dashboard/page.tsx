import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md bg-white dark:bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-full">
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦2,450,000</div>
            <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white dark:bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            <div className="p-2 bg-brand-navy/10 rounded-full">
              <TrendingUp className="h-4 w-4 text-brand-navy" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+452</div>
            <p className="text-xs text-brand-navy flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3" />
              +18% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white dark:bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Items</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-full">
              <Package className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,204</div>
            <p className="text-xs text-orange-500 flex items-center gap-1 mt-1">
              <AlertTriangle className="h-3 w-3" />
              12 items low in stock
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white dark:bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-blue-500 flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3" />
              +4.3% this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-md bg-white dark:bg-zinc-900">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Visualizing sales performance across all channels.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg m-4">
            <p className="text-muted-foreground italic">Chart visualization will be implemented here</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-md bg-white dark:bg-zinc-900">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest 5 transactions from POS and Online Store.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs">
                      JD
                    </div>
                    <div>
                      <p className="text-sm font-medium">Customer {i}</p>
                      <p className="text-xs text-muted-foreground">2 mins ago</p>
                    </div>
                  </div>
                  <div className="text-sm font-bold">₦{15000 * i}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

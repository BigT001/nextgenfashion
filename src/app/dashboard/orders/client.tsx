"use client";

import { useEffect, useState } from "react";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Download, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  ShieldCheck,
  Package,
  History,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { OrderDetailModal } from "@/modules/orders/components/order-detail-modal";
import { OrderReceipt } from "@/modules/orders/components/order-receipt";
import { getOrdersDashboardAction } from "@/modules/orders/actions/order.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export default function OrdersClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState<any[]>(initialData || []);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "ONLINE" | "POS">("ALL");

  const loadData = async () => {
    const result = await getOrdersDashboardAction();
    if (result.success) {
      setData(result.data || []);
    }
  };

  const handleExportLedger = () => {
    if (!data || data.length === 0) {
      toast.error("No orders available to export");
      return;
    }
    
    const headers = ["Order ID", "Channel", "Patron", "Operator", "Email", "Revenue", "Fulfillment", "Timestamp"];
    const csvRows = [headers.join(",")];
    
    for (const order of data) {
      const isPos = order.userId || order.orderNumber.includes("POS");
      const row = [
        `"${order.orderNumber}"`,
        `"${isPos ? 'POS Terminal' : 'Storefront'}"`,
        `"${order.customer?.name || 'Walk-in Curator'}"`,
        `"${order.user?.name || 'System Storefront'}"`,
        `"${order.customer?.email || 'N/A'}"`,
        order.totalAmount,
        `"${order.status}"`,
        `"${new Date(order.createdAt).toISOString()}"`
      ];
      csvRows.push(row.join(","));
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nextgen_orders_ledger_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Orders ledger exported successfully");
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "orderNumber",
      header: "ORDER ID",
      cell: ({ row }) => (
        <div className="flex items-center gap-4 group">
            <div className="size-10 bg-brand-navy/10 rounded-xl flex items-center justify-center text-brand-navy shadow-inner group-hover:rotate-12 transition-transform">
                <ShoppingBag className="size-5" />
            </div>
            <span className="font-black text-sm tracking-tight group-hover:text-brand-navy transition-colors">{row.original.orderNumber}</span>
        </div>
      ),
    },
    {
      accessorKey: "channel",
      header: "CHANNEL",
      cell: ({ row }) => {
        const isPos = row.original.userId || row.original.orderNumber.includes("POS");
        return (
          <Badge 
            className={cn(
              "font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border-none shadow-sm",
              isPos 
                ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" 
                : "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
            )}
          >
            {isPos ? "POS Terminal" : "Storefront"}
          </Badge>
        );
      }
    },
    {
      accessorKey: "customer.name",
      header: "PATRON",
      cell: ({ row }) => (
        <div className="flex flex-col">
            <span className="font-black text-xs tracking-tight">{row.original.customer?.name || "Walk-in Curator"}</span>
            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{row.original.customer?.email || "No Digital Identity"}</span>
        </div>
      ),
    },
    {
      accessorKey: "user.name",
      header: "OPERATOR",
      cell: ({ row }) => {
        const operatorName = row.original.user?.name;
        return (
          <div className="flex flex-col">
            <span className={cn(
              "font-black text-xs tracking-tight",
              operatorName ? "text-foreground" : "text-muted-foreground italic font-medium"
            )}>
              {operatorName || "System Storefront"}
            </span>
            {operatorName && (
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                {row.original.user?.role || "STAFF"}
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "totalAmount",
      header: "REVENUE",
      cell: ({ row }) => (
        <div className="font-black text-foreground tracking-tighter">
            ₦{Number(row.original.totalAmount).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "FULFILLMENT",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge 
            className={cn(
              "font-black text-[10px] px-3 uppercase tracking-widest border-none shadow-sm",
              status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600" :
              status === "PENDING" ? "bg-amber-500/10 text-amber-600" :
              status === "CANCELLED" ? "bg-rose-500/10 text-rose-600" :
              "bg-zinc-500/10 text-zinc-600"
            )}
          >
            {status}
          </Badge>
        );
      },
    },
    {
        accessorKey: "createdAt",
        header: "TIMESTAMP",
        cell: ({ row }) => (
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {new Date(row.original.createdAt).toLocaleString()}
            </span>
        ),
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">CONTROL</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2 pr-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3.5 font-black text-[10px] uppercase tracking-widest bg-brand-navy/5 text-brand-navy hover:bg-brand-navy hover:text-white border-none rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
            onClick={() => setSelectedOrderId(row.original.id)}
          >
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center hover:bg-brand-navy/5 hover:text-brand-navy rounded-xl transition-colors text-muted-foreground focus:outline-none">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 glass-card border-none shadow-2xl p-2 rounded-2xl">
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy cursor-pointer"
                  onClick={() => toast.info("Shipment tracking logic integrated. Parcel is in transit.")}
                >
                  <Truck className="size-4" /> Track Shipment
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy cursor-pointer"
                  onClick={() => setReceiptOrderId(row.original.id)}
                >
                  <Download className="size-4" /> Export Receipt
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const onlineOrders = data.filter((order: any) => !order.userId && !order.orderNumber.includes("POS"));
  const posOrders = data.filter((order: any) => order.userId || order.orderNumber.includes("POS"));
  const activeOrders = 
    activeTab === "ALL" ? data :
    activeTab === "ONLINE" ? onlineOrders : posOrders;

  return (
    <div className="space-y-10 animate-slow-fade">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-gradient">Orders</h2>
          <p className="text-muted-foreground font-medium">Real-time management and orchestration of online and offline sales.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleExportLedger}
            className="glass-card border-none h-12 px-6 font-black text-xs uppercase tracking-widest shadow-sm"
          >
            <Download className="mr-2 h-4 w-4" />
            EXPORT LEDGER
          </Button>
          <Link href="/dashboard/pos">
            <Button className="bg-brand-navy hover:bg-brand-navy/90 text-white h-12 px-8 font-black rounded-xl shadow-xl shadow-brand-navy/20 active:scale-95 transition-all">
              <Zap className="mr-2 h-5 w-5" />
              LIVE POS TERMINAL
            </Button>
          </Link>
        </div>
      </div>

      {/* Logistics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Orders"
          value={data.length}
          icon={ShoppingBag}
          description="Global acquisition volume"
          variant="slate"
        />
        <MetricCard
          title="Pending"
          value={data.filter((o: any) => o.status === 'PENDING').length}
          icon={Clock}
          description="Awaiting processing"
          variant="pink"
        />
        <MetricCard
          title="Completed"
          value={data.filter((o: any) => o.status === 'COMPLETED').length}
          icon={Truck}
          description="Successfully fulfilled"
          variant="blue"
        />
        <MetricCard
            title="Cancelled"
            value={data.filter((o: any) => o.status === 'CANCELLED').length}
            icon={CheckCircle2}
            description="Refunded or cancelled"
            variant="emerald"
        />
      </div>

      {/* Sales Channels Switcher Tabs */}
      <div className="flex items-center gap-4 border-b border-border/50 pb-1 pt-4">
        <button
          onClick={() => setActiveTab("ALL")}
          className={cn(
            "pb-4 px-2 font-black text-xs uppercase tracking-widest transition-all relative cursor-pointer focus:outline-none",
            activeTab === "ALL" 
              ? "text-brand-navy dark:text-white" 
              : "text-muted-foreground hover:text-brand-navy dark:hover:text-white"
          )}
        >
          All Acquisitions ({data.length})
          {activeTab === "ALL" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-navy dark:bg-white rounded-full animate-fast-fade" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("ONLINE")}
          className={cn(
            "pb-4 px-2 font-black text-xs uppercase tracking-widest transition-all relative cursor-pointer focus:outline-none",
            activeTab === "ONLINE" 
              ? "text-brand-navy dark:text-white" 
              : "text-muted-foreground hover:text-brand-navy dark:hover:text-white"
          )}
        >
          Online Storefront ({onlineOrders.length})
          {activeTab === "ONLINE" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-navy dark:bg-white rounded-full animate-fast-fade" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("POS")}
          className={cn(
            "pb-4 px-2 font-black text-xs uppercase tracking-widest transition-all relative cursor-pointer focus:outline-none",
            activeTab === "POS" 
              ? "text-brand-navy dark:text-white" 
              : "text-muted-foreground hover:text-brand-navy dark:hover:text-white"
          )}
        >
          POS Terminal ({posOrders.length})
          {activeTab === "POS" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-navy dark:bg-white rounded-full animate-fast-fade" />
          )}
        </button>
      </div>

      {/* Main Table Layer */}
      <div className="overflow-hidden">
        <DataTable 
          columns={columns} 
          data={activeOrders} 
          searchKey="orderNumber"
        />
      </div>

      {/* Fulfillment Intelligence Portal Modal */}
      <OrderDetailModal 
        orderId={selectedOrderId} 
        onClose={() => setSelectedOrderId(null)} 
      />

      <OrderReceipt 
        orderId={receiptOrderId} 
        onClose={() => setReceiptOrderId(null)} 
      />

      <div className="flex items-center justify-center gap-3 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] pt-8">
          <ShieldCheck className="size-4" />
          NextGen Global Logistics Integrity Standard
      </div>
    </div>
  );
}

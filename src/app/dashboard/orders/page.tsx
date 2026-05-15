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
} from "@/components/ui/dropdown-menu";
import { OrderDetailModal } from "@/modules/orders/components/order-detail-modal";
import { OrderReceipt } from "@/modules/orders/components/order-receipt";
import { getOrdersDashboardAction } from "@/modules/orders/actions/order.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export default function OrdersPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const result = await getOrdersDashboardAction();
      if (result.success) {
        setData(result.data || []);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

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
      header: () => <div className="text-right">CONTROL</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center hover:bg-brand-navy/5 hover:text-brand-navy rounded-lg transition-colors">
                <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card border-none shadow-2xl p-2 rounded-2xl">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">Logistics Actions</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => setSelectedOrderId(row.original.id)}
                className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy"
              >
                <Eye className="size-4" /> View Intelligence
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy">
                <Truck className="size-4" /> Track Shipment
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setReceiptOrderId(row.original.id)}
                className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy"
              >
                <Download className="size-4" /> Export Receipt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Auditing Global Logistics Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-slow-fade">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-gradient">Order Command</h2>
          <p className="text-muted-foreground font-medium">Global logistics auditing and high-fidelity fulfillment orchestration.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="glass-card border-none h-12 px-6 font-black text-xs uppercase tracking-widest shadow-sm">
            <Download className="mr-2 h-4 w-4" />
            EXPORT LEDGER
          </Button>
          <Button className="bg-brand-navy hover:bg-brand-navy/90 text-white h-12 px-8 font-black rounded-xl shadow-xl shadow-brand-navy/20 active:scale-95 transition-all">
            <Zap className="mr-2 h-5 w-5" />
            LIVE POS TERMINAL
          </Button>
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

      {/* Main Table Layer */}
      <div className="glass-card border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
        <DataTable 
          columns={columns} 
          data={data} 
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

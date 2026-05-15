"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  Star, 
  Mail, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Trash2,
  Zap,
  History,
  ShieldCheck,
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
import { CustomerDetailModal } from "@/modules/customers/components/customer-detail-modal";
import { getCustomerDashboardAction } from "@/modules/customers/actions/customer.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export default function CustomersPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const result = await getCustomerDashboardAction();
      if (result.success) {
        setData(result.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "PATRON IDENTITY",
      cell: ({ row }) => (
        <div className="flex items-center gap-4 group">
            <div className="size-10 bg-brand-navy/10 rounded-xl flex items-center justify-center text-brand-navy shadow-inner group-hover:rotate-12 transition-transform">
                <Users className="size-5" />
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="font-black text-sm tracking-tight group-hover:text-brand-navy transition-colors">{row.original.name}</span>
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{row.original.email}</span>
            </div>
        </div>
      ),
    },
    {
      accessorKey: "totalSpent",
      header: "LIFETIME VALUE (LTV)",
      cell: ({ row }) => (
        <div className="font-black text-foreground tracking-tighter">
            ₦{Number(row.original.totalSpent).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "orderCount",
      header: "ACQUISITIONS",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-black text-[10px] px-3 uppercase tracking-widest border-border/50 bg-muted/30">
            {row.original.orders?.length || 0} ORDERS
        </Badge>
      ),
    },
    {
        accessorKey: "lastOrder",
        header: "LAST ACTIVITY",
        cell: ({ row }) => (
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {row.original.lastOrder ? new Date(row.original.lastOrder).toLocaleDateString() : "NEVER"}
            </span>
        ),
    },
    {
      accessorKey: "status",
      header: "TIER",
      cell: ({ row }) => {
        const ltv = Number(row.original.totalSpent);
        const isVip = ltv > 100000;
        return (
          <Badge 
            className={cn(
              "font-black text-[10px] px-3 uppercase tracking-widest border-none shadow-sm",
              isVip ? "bg-amber-500/10 text-amber-600" : "bg-brand-navy/10 text-brand-navy"
            )}
          >
            {isVip ? "VIP PATRON" : "REGULAR"}
          </Badge>
        );
      },
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
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">Relationship Actions</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => setSelectedCustomerId(row.original.id)}
                className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy"
              >
                <Eye className="size-4" /> View Intelligence
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy">
                <Mail className="size-4" /> Dispatch Briefing
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy">
                <TrendingUp className="size-4" /> Set Priority
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/30" />
              <DropdownMenuItem className="rounded-xl h-10 font-bold gap-3 text-destructive focus:bg-destructive/5">
                <Trash2 className="size-4" /> Anonymize Data
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
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Auditing Patron Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-slow-fade">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-gradient">Customer Intelligence</h2>
          <p className="text-muted-foreground font-medium">Global patron auditing and executive relationship management.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="glass-card border-none h-12 px-6 font-black text-xs uppercase tracking-widest">
            <Mail className="mr-2 h-4 w-4" />
            GLOBAL BROADCAST
          </Button>
          <Button className="bg-brand-navy hover:bg-brand-navy/90 text-white h-12 px-8 font-black rounded-xl shadow-xl shadow-brand-navy/20 active:scale-95 transition-all">
            <UserPlus className="mr-2 h-5 w-5" />
            REGISTER PATRON
          </Button>
        </div>
      </div>

      {/* CRM KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Patrons"
          value={data.kpis.totalCustomers}
          icon={Users}
          description="Registered fashion curators"
          variant="slate"
        />
        <MetricCard
          title="Average LTV"
          value={`₦${Math.round(data.kpis.avgLTV).toLocaleString()}`}
          icon={TrendingUp}
          description="Mean patron value impact"
          variant="pink"
        />
        <MetricCard
            title="VIP Loyalty"
            value={data.customers.filter((c: any) => c.totalSpent > 100000).length}
            icon={Star}
            description="Patrons above 100K LTV"
            variant="blue"
        />
      </div>

      {/* Main Table Layer */}
      <div className="glass-card border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
        <DataTable 
          columns={columns} 
          data={data.customers} 
          searchKey="name"
        />
      </div>

      {/* Intelligence Portal Modal */}
      <CustomerDetailModal 
        customerId={selectedCustomerId} 
        onClose={() => setSelectedCustomerId(null)} 
      />

      <div className="flex items-center justify-center gap-3 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] pt-8">
          <ShieldCheck className="size-4" />
          Patron Privacy & GDPR Integrity Standard
      </div>
    </div>
  );
}

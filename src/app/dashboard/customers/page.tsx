"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  UserPlus, 
  Mail, 
  MoreHorizontal,
  Eye,
  Trash2,
  ShieldCheck,
  Edit2,
  Archive,
  ArchiveRestore,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomerDetailModal } from "@/modules/customers/components/customer-detail-modal";
import { RegisterCustomerDialog } from "@/modules/customers/components/register-customer-dialog";
import { EditCustomerDialog } from "@/modules/customers/components/edit-customer-dialog";
import { 
  getCustomerDashboardAction, 
  getArchivedCustomersAction, 
  archiveCustomerAction, 
  unarchiveCustomerAction 
} from "@/modules/customers/actions/customer.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export default function CustomersPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<any>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [actionLoading, setActionLoading] = useState<string | null>(null); // store customer id being acted on

  async function loadData() {
    setIsLoading(true);
    if (viewMode === 'active') {
      const result = await getCustomerDashboardAction();
      if (result.success) setData(result.data);
    } else {
      const result = await getArchivedCustomersAction();
      if (result.success) setData({ customers: result.data }); // Wrap in object to match shape
    }
    setIsLoading(false);
  }

  useEffect(() => { loadData(); }, [viewMode]);

  function openCustomer(row: any) {
    setSelectedPreview({
      name: row.name,
      email: row.email,
      totalSpent: row.totalSpent || 0, // In archived we might not have calculated totalSpent if it's raw, but getArchivedCustomers include sales, so let's rely on it or default.
      lastOrder: row.lastOrder || null,
      sales: row.sales ?? [],
    });
    setSelectedCustomerId(row.id);
  }

  function closeCustomer() {
    setSelectedCustomerId(null);
    setSelectedPreview(null);
  }

  async function handleArchive(id: string) {
    setActionLoading(id);
    await archiveCustomerAction(id);
    await loadData();
    setActionLoading(null);
  }

  async function handleRestore(id: string) {
    setActionLoading(id);
    await unarchiveCustomerAction(id);
    await loadData();
    setActionLoading(null);
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "CUSTOMER",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 group">
          <div className="size-9 bg-[#0f2352]/10 rounded-xl flex items-center justify-center text-[#0f2352] group-hover:bg-[#0f2352] group-hover:text-white transition-all">
            <Users className="size-4" />
          </div>
          <div>
            <span className="font-black text-sm block group-hover:text-[#0f2352] transition-colors">{row.original.name}</span>
            <span className="text-[10px] text-muted-foreground font-semibold">{row.original.email}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "totalSpent",
      header: "LIFETIME VALUE",
      cell: ({ row }) => {
        // Handle case where totalSpent isn't pre-calculated (like in archived raw fetch)
        const spent = row.original.totalSpent !== undefined 
          ? row.original.totalSpent 
          : row.original.sales?.reduce((sum: number, s: any) => sum + Number(s.totalAmount), 0) || 0;
        return <span className="font-black text-sm">₦{Number(spent).toLocaleString()}</span>;
      },
    },
    {
      accessorKey: "orderCount",
      header: "ORDERS",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-black text-[10px] px-3 uppercase tracking-widest border-border/50 bg-muted/30">
          {row.original.sales?.length || 0} orders
        </Badge>
      ),
    },
    {
      accessorKey: "lastOrder",
      header: "LAST PURCHASE",
      cell: ({ row }) => {
        let lastDate = row.original.lastOrder;
        if (!lastDate && row.original.sales && row.original.sales.length > 0) {
            const sorted = [...row.original.sales].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            lastDate = sorted[0].createdAt;
        }
        return (
            <span className="text-[11px] font-semibold text-muted-foreground">
            {lastDate
                ? new Date(lastDate).toLocaleDateString("en-NG", { day:"2-digit", month:"short", year:"numeric" })
                : "Never"}
            </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "TIER",
      cell: ({ row }) => {
        const ltv = row.original.totalSpent !== undefined 
          ? row.original.totalSpent 
          : row.original.sales?.reduce((sum: number, s: any) => sum + Number(s.totalAmount), 0) || 0;
        const isVip = ltv > 100000;
        return (
          <Badge className={cn(
            "font-black text-[10px] px-3 uppercase tracking-widest border-none",
            isVip ? "bg-amber-100 text-amber-700" : "bg-[#0f2352]/10 text-[#0f2352]"
          )}>
            {isVip ? "⭐ VIP" : "Regular"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">ACTION</div>,
      cell: ({ row }) => {
        const isArchivingThis = actionLoading === row.original.id;
        return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger disabled={isArchivingThis} className="h-8 w-8 p-0 inline-flex items-center justify-center hover:bg-[#0f2352]/5 hover:text-[#0f2352] rounded-lg transition-colors disabled:opacity-50">
              {isArchivingThis ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 shadow-2xl p-2 rounded-2xl border-none">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3 pb-1">Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => openCustomer(row.original)}
                  className="rounded-xl h-10 font-bold gap-3 focus:bg-[#0f2352]/5 focus:text-[#0f2352]"
                >
                  <Eye className="size-4" /> View Details
                </DropdownMenuItem>
                
                {viewMode === 'active' && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); setCustomerToEdit(row.original); }}
                    className="rounded-xl h-10 font-bold gap-3 focus:bg-[#0f2352]/5 focus:text-[#0f2352]"
                  >
                    <Edit2 className="size-4" /> Edit Customer
                  </DropdownMenuItem>
                )}
                
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-border/30" />
              <DropdownMenuGroup>
                {viewMode === 'active' ? (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(row.original.id); }} className="rounded-xl h-10 font-bold gap-3 text-orange-600 focus:bg-orange-50 focus:text-orange-700">
                      <Archive className="size-4" /> Archive Customer
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRestore(row.original.id); }} className="rounded-xl h-10 font-bold gap-3 text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700">
                      <ArchiveRestore className="size-4" /> Restore Customer
                    </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )},
    },
  ];

  if (isLoading && !data) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading Customers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slow-fade">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-gradient">Customers</h2>
          <p className="text-muted-foreground font-medium">Manage and view all customer accounts and purchase history.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'active' ? 'archived' : 'active')}
            className="h-12 px-6 font-black rounded-xl shadow-sm active:scale-95 transition-all text-xs uppercase tracking-widest"
          >
            {viewMode === 'active' ? (
                <><Archive className="mr-2 h-4 w-4" /> View Archive</>
            ) : (
                <><Users className="mr-2 h-4 w-4" /> View Active</>
            )}
          </Button>
          {viewMode === 'active' && (
              <Button
                onClick={() => setShowRegister(true)}
                className="text-white h-12 px-8 font-black rounded-xl shadow-xl active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg, #0f2352, #1a3a8a)" }}
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Register Customer
              </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="relative">
          {isLoading && data && (
             <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                 <LoadingSpinner size="lg" />
             </div>
          )}
          <DataTable
            columns={columns}
            data={data?.customers || []}
            searchKey="name"
            onRowClick={openCustomer}
          />
      </div>

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        customerId={selectedCustomerId}
        previewData={selectedPreview}
        onClose={closeCustomer}
      />

      {/* Register Customer Dialog */}
      <RegisterCustomerDialog
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={() => loadData()}
      />

      {/* Edit Customer Dialog */}
      <EditCustomerDialog
        open={!!customerToEdit}
        customer={customerToEdit}
        onClose={() => setCustomerToEdit(null)}
        onSuccess={() => loadData()}
      />

      <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest pt-4">
        <ShieldCheck className="size-3" />
        Customer data is secured and private
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Download, 
  Package, 
  AlertTriangle, 
  TrendingUp,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Zap,
  Boxes,
  Barcode,
  ImageIcon,
  Minus,
  ChevronDown,
  ChevronRight,
  Ban,
  Trash,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { ProductForm } from "@/modules/products/components/product-form";
import { BarcodeVisualizer } from "@/modules/products/components/barcode-visualizer";
import { BarcodeScanner } from "@/modules/products/components/barcode-scanner";
import { getInventoryDashboardAction } from "@/modules/inventory/actions/inventory.actions";
import { deleteProductAction, updateStockAction, toggleSuspendProductAction } from "@/modules/products/actions/product.actions";
import { InventoryHistoryViewer } from "@/modules/inventory/components/inventory-history-viewer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export default function InventoryClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState<any>(initialData);
  const [stockUpdateItem, setStockUpdateItem] = useState<any>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>("Restock");
  const [adjustmentMode, setAdjustmentMode] = useState<"ADD" | "SUB">("ADD");
  const [isScanning, setIsScanning] = useState(false);
  
  const [actionItem, setActionItem] = useState<any>(null);
  const [actionType, setActionType] = useState<"SUSPEND" | "DELETE" | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [historyItem, setHistoryItem] = useState<any>(null);

  const handleExportLedger = () => {
    if (!data?.products) return;
    const headers = ["Product", "Category", "SKU", "Stock Level", "Health Status"];
    const csvData = data.products.map((p: any) => [
      p.name,
      p.category,
      p.sku,
      p.stock,
      p.status
    ]);
    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inventory ledger exported");
  };

  const loadData = async () => {
    const result = await getInventoryDashboardAction();
    if (result.success) {
      setData(result.data);
    }
    setRefreshTrigger(prev => prev + 1);
  };

  const columns: ColumnDef<any>[] = [

    {
      accessorKey: "image",
      header: "IMAGE",
      cell: ({ row }) => (
        <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-brand-navy/10 bg-muted/30">
          {row.original.image ? (
            <Image src={row.original.image} alt={row.original.name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "PRODUCTS",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
            <span className="font-black text-sm tracking-tight group-hover:text-brand-navy transition-colors">{row.original.name}</span>
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{row.original.category}</span>
        </div>
      ),
    },
    {
      accessorKey: "sku",
      header: "IDENTITY (SKU)",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest border-border/50 bg-muted/30">
                {row.original.sku}
            </Badge>
            <BarcodeVisualizer variantId={row.original.variantId} sku={row.original.sku} />
        </div>
      ),
    },
    {
      accessorKey: "stock",
      header: "QUANTITY",
      cell: ({ row }) => (
        <span className={cn(
            "font-black text-sm tracking-tighter",
            row.original.stock <= 5 ? "text-rose-500" : "text-foreground"
        )}>
            {row.original.stock} UNITS
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "STOCK HEALTH",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge 
            className={cn(
              "font-black text-[10px] px-3 uppercase tracking-widest border-none shadow-sm",
              status === "In Stock" && "bg-emerald-500/10 text-emerald-600",
              status === "Low Stock" && "bg-amber-500/10 text-amber-600",
              status === "Out of Stock" && "bg-rose-500/10 text-rose-600"
            )}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: "history",
      header: "LAST MOVEMENT",
      cell: ({ row }) => {
        const lastMovement = row.original.lastMovement || "No movements logged";
        
        let colorClasses = "text-muted-foreground hover:text-foreground bg-muted/10 border-border/10";
        if (lastMovement === "STOCK INCREMENT") {
          colorClasses = "text-emerald-600 hover:text-emerald-700 bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10";
        } else if (lastMovement === "SALES OUTFLOW") {
          colorClasses = "text-indigo-600 hover:text-indigo-700 bg-indigo-500/5 border-indigo-500/10 hover:bg-indigo-500/10";
        } else if (lastMovement === "STOCK DECREMENT") {
          colorClasses = "text-amber-600 hover:text-amber-700 bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10";
        } else if (lastMovement.includes("SUSPENDED")) {
          colorClasses = "text-rose-600 hover:text-rose-700 bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10";
        } else if (lastMovement.includes("ACTIVATED")) {
          colorClasses = "text-sky-600 hover:text-sky-700 bg-sky-500/5 border-sky-500/10 hover:bg-sky-500/10";
        }

        return (
          <Button
            variant="ghost"
            onClick={() => setHistoryItem(row.original)}
            className={cn(
              "flex items-center gap-2 text-xs font-black rounded-xl px-3 py-1.5 h-auto transition-all text-left max-w-[220px] justify-start shadow-sm border",
              colorClasses
            )}
          >
            <History className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate uppercase tracking-wide text-[10px]">{lastMovement}</span>
          </Button>
        )
      },
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
            onClick={() => setStockUpdateItem(row.original)}
          >
            <Zap className="h-3.5 w-3.5" /> Adjust
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center hover:bg-brand-navy/5 hover:text-brand-navy rounded-xl transition-colors text-muted-foreground focus:outline-none">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 glass-card border-none shadow-2xl p-2 rounded-2xl">
              <DropdownMenuGroup>
                <BarcodeVisualizer 
                  variantId={row.original.variantId} 
                  sku={row.original.sku} 
                  trigger={
                    <DropdownMenuItem 
                      onSelect={(e) => e.preventDefault()}
                      className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy cursor-pointer"
                    >
                      <Barcode className="size-4" /> Print Tag
                    </DropdownMenuItem>
                  } 
                />
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem 
                  className="rounded-xl h-10 font-bold gap-3 focus:bg-amber-500/10 focus:text-amber-600 text-amber-600 cursor-pointer"
                  onClick={() => {
                    setActionItem(row.original);
                    setActionType("SUSPEND");
                  }}
                >
                  <Ban className="size-4" /> {row.original.isSuspended ? "Activate Product" : "Suspend Product"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-xl h-10 font-bold gap-3 focus:bg-rose-500/10 focus:text-rose-600 text-rose-600 cursor-pointer"
                  onClick={() => {
                    setActionItem(row.original);
                    setActionType("DELETE");
                  }}
                >
                  <Trash className="size-4" /> Delete Product
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];



  return (
    <div className="space-y-10 animate-slow-fade">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-gradient">Inventory Control</h2>
          <p className="text-muted-foreground font-medium">Real-time stock orchestration and SKU health monitoring.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="glass-card border-none h-12 px-6 font-black text-xs uppercase tracking-widest hover:text-brand-navy transition-colors"
            onClick={() => setIsScanning(true)}
          >
            <Barcode className="mr-2 h-4 w-4" />
            SCAN PRODUCT
          </Button>

          <Button 
            variant="outline" 
            onClick={handleExportLedger}
            className="glass-card border-none h-12 px-6 font-black text-xs uppercase tracking-widest hover:text-brand-navy transition-all"
          >
            <Download className="mr-2 h-4 w-4" />
            EXPORT LEDGER
          </Button>
          
          <Dialog open={!!stockUpdateItem} onOpenChange={(open) => {
            if (!open) {
              setStockUpdateItem(null);
              setAdjustmentValue(0);
              setAdjustmentReason("");
              setAdjustmentMode("ADD");
            }
          }}>
            <DialogContent className="max-w-md glass-card border-none p-0 overflow-hidden rounded-[2rem] shadow-2xl">
              <div className="p-6 bg-brand-mesh border-b border-border/10">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-gradient">Adjust Stock Levels</DialogTitle>
                  <DialogDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">
                    Modifying {stockUpdateItem?.name}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-6 space-y-5">
                {/* Current Stock Stats Card */}
                <div className="bg-brand-navy/5 dark:bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-brand-navy/10">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">Current Stock</span>
                    <span className="text-xl font-black text-brand-navy dark:text-white mt-0.5">{stockUpdateItem?.stock || 0} UNITS</span>
                  </div>
                  <Badge 
                    className={cn(
                      "font-black text-[9px] px-3 py-1 uppercase tracking-widest border-none shadow-sm",
                      stockUpdateItem?.status === "In Stock" && "bg-emerald-500/10 text-emerald-600",
                      stockUpdateItem?.status === "Low Stock" && "bg-amber-500/10 text-amber-600",
                      stockUpdateItem?.status === "Out of Stock" && "bg-rose-500/10 text-rose-600"
                    )}
                  >
                    {stockUpdateItem?.status}
                  </Badge>
                </div>

                {/* Plus / Minus Action Toggle */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">Adjustment Action</label>
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                      type="button"
                      onClick={() => {
                        setAdjustmentMode("ADD");
                      }}
                      className={cn(
                        "h-11 rounded-xl font-black text-xs uppercase tracking-widest border transition-all flex items-center justify-center gap-2 cursor-pointer",
                        adjustmentMode === "ADD" 
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm" 
                          : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                      )}
                    >
                      <Plus className="size-4" /> Add Stock
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setAdjustmentMode("SUB");
                      }}
                      className={cn(
                        "h-11 rounded-xl font-black text-xs uppercase tracking-widest border transition-all flex items-center justify-center gap-2 cursor-pointer",
                        adjustmentMode === "SUB" 
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-sm" 
                          : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                      )}
                    >
                      <Minus className="size-4" /> Reduce Stock
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">Quantity to Adjust</label>
                  <Input 
                    type="number" 
                    value={adjustmentValue === 0 ? "" : adjustmentValue} 
                    onChange={(e) => setAdjustmentValue(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-11 rounded-xl border border-border/50 bg-muted/20 font-black text-base focus:border-brand-navy"
                    placeholder="Enter quantity amount..."
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">Reason</label>
                  <Input 
                    value={adjustmentReason} 
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder={adjustmentMode === "SUB" ? "What is the reason for reduction?" : "What is the reason for addition?"}
                    className="h-11 rounded-xl border border-border/50 bg-muted/20 font-bold text-sm focus:border-brand-navy"
                  />
                </div>

                <Button 
                  className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white h-12 font-black rounded-xl cursor-pointer mt-2"
                  onClick={async () => {
                    if (adjustmentValue <= 0) {
                      toast.error("Please enter a valid quantity amount greater than 0");
                      return;
                    }
                    const change = adjustmentMode === "ADD" ? adjustmentValue : -adjustmentValue;
                    const reasonFallback = adjustmentReason.trim() || (adjustmentMode === "ADD" ? "Restock" : "Shrinkage/Damage");
                    const res = await updateStockAction(stockUpdateItem.variantId, change, reasonFallback);
                    if (res.success) {
                        toast.success("Stock inventory updated successfully");
                        setStockUpdateItem(null);
                        setAdjustmentValue(0);
                        setAdjustmentReason("");
                        loadData();
                    } else {
                        toast.error(res.error);
                    }
                  }}
                >
                  COMMIT ADJUSTMENT
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isScanning} onOpenChange={setIsScanning}>
            <DialogContent className="max-w-xl glass-card border-none p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
              <div className="p-8 bg-brand-mesh border-b border-border/10">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-gradient">Optical Catalog Scan</DialogTitle>
                  <DialogDescription className="font-bold text-xs uppercase tracking-widest opacity-60">
                    Align barcode to identify fashion line.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <BarcodeScanner 
                onScan={(sku) => {
                  const item = data.products.find((p: any) => p.sku === sku);
                  if (item) {
                    setStockUpdateItem(item);
                  } else {
                    toast.error(`Product with SKU ${sku} not found in catalog`);
                  }
                  setIsScanning(false);
                }} 
                onClose={() => setIsScanning(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stock Health KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Stock Units"
          value={data?.products?.reduce((acc: number, p: any) => acc + p.stock, 0) || 0}
          icon={Package}
          description="Aggregated warehouse items"
          variant="slate"
        />
        <MetricCard
          title="Stock Critical"
          value={data?.kpis?.stockAlerts || 0}
          icon={AlertTriangle}
          description="Items requiring restock"
          variant="pink"
        />
        <MetricCard
          title="Inventory Value"
          value={`₦${(data?.kpis?.totalValue || 0).toLocaleString()}`}
          icon={Boxes}
          description="Aggregated stock asset value"
          variant="blue"
        />
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionItem} onOpenChange={(open) => !open && setActionItem(null)}>
        <DialogContent className="max-w-md glass-card border-none p-0 overflow-hidden rounded-[2rem] shadow-2xl">
          <div className="p-6 bg-brand-mesh border-b border-border/10">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-gradient">
                {actionType === "SUSPEND" ? (actionItem?.isSuspended ? "Activate Product" : "Suspend Product") : "Delete Product"}
              </DialogTitle>
              <DialogDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">
                {actionType === "SUSPEND" ? (actionItem?.isSuspended ? "Restore to storefront" : "Hide from storefront") : "Irreversible Action"}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-5">
            <p className="text-sm font-medium text-muted-foreground">
              {actionType === "SUSPEND" 
                ? (actionItem?.isSuspended 
                    ? `Are you sure you want to activate "${actionItem?.name}"? It will become visible to customers on the storefront again.`
                    : `Are you sure you want to suspend "${actionItem?.name}"? It will no longer be visible to customers on the storefront.`
                  )
                : `Are you sure you want to completely delete "${actionItem?.name}" and all its inventory records? This action cannot be undone.`}
            </p>
            <div className="flex gap-3 mt-4">
              <Button 
                variant="outline" 
                className="w-full h-12 font-black rounded-xl"
                onClick={() => setActionItem(null)}
                disabled={isActionLoading}
              >
                CANCEL
              </Button>
              <Button 
                variant="destructive"
                className="w-full h-12 font-black rounded-xl bg-rose-500 hover:bg-rose-600"
                disabled={isActionLoading}
                onClick={async () => {
                  setIsActionLoading(true);
                  if (actionType === "SUSPEND") {
                    const res = await toggleSuspendProductAction(actionItem.id);
                    if (res.success) {
                      toast.success(res.isSuspended ? "Product suspended" : "Product activated");
                      loadData();
                    } else {
                      toast.error(res.error);
                    }
                  } else if (actionType === "DELETE") {
                    const res = await deleteProductAction(actionItem.id);
                    if (res.success) {
                      toast.success("Product deleted successfully");
                      loadData();
                    } else {
                      toast.error(res.error);
                    }
                  }
                  setIsActionLoading(false);
                  setActionItem(null);
                }}
              >
                {isActionLoading ? <LoadingSpinner size="sm" /> : "CONFIRM"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!historyItem} onOpenChange={(open) => !open && setHistoryItem(null)}>
        <DialogContent className="max-w-4xl glass-card border-none p-0 overflow-hidden rounded-[2rem] shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Product Audit Ledger</DialogTitle>
            <DialogDescription>Comprehensive logistics movements</DialogDescription>
          </DialogHeader>
          <div className="p-12 max-h-[85vh] overflow-y-auto custom-scrollbar">
            {historyItem && (
              <InventoryHistoryViewer variantId={historyItem.variantId} refreshTrigger={refreshTrigger} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Table Layer */}
      <div className="overflow-hidden">
        <DataTable 
          columns={columns} 
          data={data?.products || []} 
          searchKey="name"
        />
      </div>
    </div>
  );
}


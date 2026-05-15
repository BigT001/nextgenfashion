"use client";

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
  Barcode
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
import { deleteProductAction, updateStockAction } from "@/modules/products/actions/product.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export default function InventoryPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stockUpdateItem, setStockUpdateItem] = useState<any>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>("Restock");
  const [isScanning, setIsScanning] = useState(false);

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
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "PRODUCT ARCHITECTURE",
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
            <BarcodeVisualizer variantId={row.original.id} sku={row.original.sku} />
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
      id: "actions",
      header: () => <div className="text-right">CONTROL</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center hover:bg-brand-navy/5 hover:text-brand-navy rounded-lg transition-colors">
                <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card border-none shadow-2xl p-2 rounded-2xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">Logistics Actions</DropdownMenuLabel>
                <DropdownMenuItem 
                  className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy"
                  onClick={() => setStockUpdateItem(row.original)}
                >
                  <Zap className="size-4" /> Adjust Inventory
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy">
                  <Barcode className="size-4" /> Print Labels
                </DropdownMenuItem>
              </DropdownMenuGroup>
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
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Auditing Stock Architecture...</p>
      </div>
    );
  }

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
            SCAN WAREHOUSE
          </Button>

          <Button 
            variant="outline" 
            onClick={handleExportLedger}
            className="glass-card border-none h-12 px-6 font-black text-xs uppercase tracking-widest hover:text-brand-navy transition-all"
          >
            <Download className="mr-2 h-4 w-4" />
            EXPORT LEDGER
          </Button>
          
          <Dialog open={!!stockUpdateItem} onOpenChange={(open) => !open && setStockUpdateItem(null)}>
            <DialogContent className="max-md glass-card border-none p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
              <div className="p-8 bg-brand-mesh border-b border-border/10">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-gradient">Adjust Stock Levels</DialogTitle>
                  <DialogDescription className="font-bold text-xs uppercase tracking-widest opacity-60">
                    Modifying inventory for {stockUpdateItem?.name}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quantity Adjustment</label>
                  <Input 
                    type="number" 
                    value={adjustmentValue} 
                    onChange={(e) => setAdjustmentValue(parseInt(e.target.value))}
                    className="h-12 rounded-xl border-none bg-muted/50 font-black text-lg"
                    placeholder="e.g. 10 or -5"
                  />
                  <p className="text-[10px] text-muted-foreground">Enter positive for restock, negative for shrinkage/damage.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reasoning</label>
                  <Input 
                    value={adjustmentReason} 
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="h-12 rounded-xl border-none bg-muted/50 font-bold"
                  />
                </div>
                <Button 
                  className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white h-12 font-black rounded-xl"
                  onClick={async () => {
                    const res = await updateStockAction(stockUpdateItem.id, adjustmentValue, adjustmentReason);
                    if (res.success) {
                        toast.success("Stock inventory updated");
                        setStockUpdateItem(null);
                        setAdjustmentValue(0);
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


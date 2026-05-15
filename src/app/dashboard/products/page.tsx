"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Download, 
  PackagePlus, 
  Sparkles,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Zap,
  Image as ImageIcon
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
import { getInventoryDashboardAction } from "@/modules/inventory/actions/inventory.actions";
import { deleteProductAction } from "@/modules/products/actions/product.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export default function ProductsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const handleExport = () => {
    if (!data?.products) return;
    
    const headers = ["Name", "Category", "SKU", "Selling Price", "Cost Price", "Stock"];
    const csvData = data.products.map((p: any) => [
      p.name,
      p.category,
      p.sku,
      p.price,
      p.costPrice,
      p.stock
    ]);
    
    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `nextgen_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Catalog export initiated");
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
      accessorKey: "images",
      header: "IMAGE",
      cell: ({ row }) => (
        <div className="size-14 rounded-2xl bg-muted/30 flex items-center justify-center shrink-0 border border-border/20 overflow-hidden shadow-sm">
            {row.original.images?.[0] ? (
                <Image 
                    src={row.original.images[0]} 
                    alt={row.original.name} 
                    width={56} 
                    height={56} 
                    className="object-cover w-full h-full"
                />
            ) : (
                <ImageIcon className="size-6 text-muted-foreground/30" />
            )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "PRODUCT NAME",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[200px]">
            <span className="font-black text-sm tracking-tight group-hover:text-brand-navy transition-colors">{row.original.name}</span>
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{row.original.category}</span>
        </div>
      ),
    },
    {
      accessorKey: "sku",
      header: "IDENTITY (SKU)",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest border-border/50 bg-muted/10 px-3 py-1">
            {row.original.sku}
        </Badge>
      ),
    },
    {
      accessorKey: "price",
      header: "SELLING PRICE",
      cell: ({ row }) => (
        <div className="font-black text-brand-navy tracking-tighter text-sm">
            ₦{Number(row.original.price).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "costPrice",
      header: "COST PRICE",
      cell: ({ row }) => (
        <div className="font-black text-muted-foreground/40 tracking-tighter text-sm italic">
            ₦{Number(row.original.costPrice || 0).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "variants",
      header: "ACTIVE VARIANT",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-black text-[10px] rounded-lg px-2">
            {row.original.variants?.length || 1} VARS
        </Badge>
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
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">Catalog Control</DropdownMenuLabel>
                <DropdownMenuItem className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy">
                  <Eye className="size-4" /> View Blueprint
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy"
                  onClick={() => setEditingProduct(row.original)}
                >
                  <Edit className="size-4" /> Modify Catalog
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/30" />
                <DropdownMenuItem 
                  className="rounded-xl h-10 font-bold gap-3 text-destructive focus:bg-destructive/5"
                  onClick={async () => {
                    if (confirm("Are you sure you want to retire this fashion line?")) {
                      const res = await deleteProductAction(row.original.id);
                      if (res.success) {
                          toast.success("Product retired from catalog");
                          loadData();
                      }
                    }
                  }}
                >
                  <Trash2 className="size-4" /> Retire Line
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
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Catalog Architecture...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-slow-fade">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-gradient">Product Catalog</h2>
          <p className="text-muted-foreground font-medium">Design and orchestrate the NextGen fashion blueprint.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="glass-card border-none h-12 px-6 font-black text-xs uppercase tracking-widest hover:bg-brand-navy/5 hover:text-brand-navy transition-all"
          >
            <Download className="mr-2 h-4 w-4" />
            EXPORT CATALOG
          </Button>
          
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger render={<Button className="bg-brand-navy hover:bg-brand-navy/90 text-white h-12 px-8 font-black rounded-xl shadow-xl shadow-brand-navy/20 active:scale-95 transition-all" />}>
              <Plus className="mr-2 h-5 w-5" />
              ADD PRODUCT
            </DialogTrigger>
            <DialogContent className="max-w-5xl glass-card border-none p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
              <div className="px-10 py-6 bg-brand-mesh border-b border-border/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-navy/5" />
                <DialogHeader className="relative z-10">
                  <DialogTitle className="text-xl font-black text-brand-navy uppercase tracking-[0.2em]">Add Product</DialogTitle>
                </DialogHeader>
              </div>
              <div className="p-8 max-h-[85vh] overflow-y-auto scrollbar-hide">
                <ProductForm onClose={() => {
                    setIsAddProductOpen(false);
                    loadData();
                }} />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
            <DialogContent className="max-w-5xl glass-card border-none p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
              <div className="px-10 py-6 bg-brand-mesh border-b border-border/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-navy/5" />
                <DialogHeader className="relative z-10">
                  <DialogTitle className="text-xl font-black text-brand-navy uppercase tracking-[0.2em]">Modify Catalog</DialogTitle>
                </DialogHeader>
              </div>
              <div className="p-8 max-h-[85vh] overflow-y-auto scrollbar-hide">
                <ProductForm 
                  initialData={editingProduct} 
                  onClose={() => {
                    setEditingProduct(null);
                    loadData();
                  }} 
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Catalog KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Products"
          value={data?.kpis?.totalProducts || 0}
          icon={PackagePlus}
          description="Registered fashion architectures"
          variant="slate"
        />
        <MetricCard
          title="Featured Lines"
          value={data?.products?.filter((p: any) => p.stock > 0).length || 0}
          icon={Sparkles}
          description="High-visibility collections"
          variant="blue"
        />
        <MetricCard
          title="Global Valuation"
          value={`₦${(data?.kpis?.totalValue || 0).toLocaleString()}`}
          icon={Zap}
          description="Catalog market potential"
          variant="pink"
        />
      </div>

      {/* Catalog Table */}
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

"use client";

import Image from "next/image";

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
  Image as ImageIcon,
  Upload,
  Loader2,
  FileText,
  CheckCircle2
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
import { deleteProductAction, importProductsAction, uploadImageAction, syncPosProductsAction } from "@/modules/products/actions/product.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export default function ProductsClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState<any>(initialData);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Bulk CSV Import States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState<string>("");
  const [importProgress, setImportProgress] = useState<number>(0);

  // POS Sync States
  const [isSyncingPos, setIsSyncingPos] = useState(false);

  const handleSyncPos = async () => {
    if (isSyncingPos) return;
    setIsSyncingPos(true);
    
    const promise = syncPosProductsAction();
    
    toast.promise(promise, {
      loading: "Connecting to PHP POS at nextgen.storeapp.com.ng & synchronizing catalogs...",
      success: (res: any) => {
        if (res.success) {
          loadData();
          return `POS Synchronized successfully! Synced ${res.totalSynced} items (Created: ${res.totalCreated}, Updated: ${res.totalUpdated}).`;
        } else {
          throw new Error(res.errors?.[0] || "Sync encountered errors");
        }
      },
      error: (err: any) => `POS Sync failed: ${err.message}`
    });

    try {
      await promise;
    } catch (err) {
      console.error("POS Sync error:", err);
    } finally {
      setIsSyncingPos(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 
      "Product Name,Description,Category Name,Gender,Base Price,Cost Price,Tax,Image Filename,SKU,Barcode,Size,Color,Variant Price,Stock Quantity,Low Stock Threshold\n" +
      "Premium Vintage Denim Jacket,Heavyweight raw indigo vintage denim jacket with custom brass hardware,Vintage,BOTH,45000,30000,7.5,vintage_denim_jacket.jpg,NG-VD-JK-M-BLU,880192837401,M,Indigo,45000,15,5\n" +
      "Premium Vintage Denim Jacket,Heavyweight raw indigo vintage denim jacket with custom brass hardware,Vintage,BOTH,45000,30000,7.5,vintage_denim_jacket.jpg,NG-VD-JK-L-BLU,880192837402,L,Indigo,45000,20,5\n" +
      "Retro Urban Cargo Pants,Relaxed fit tactical urban cargo pants with multi-pocket utilities,Urban,BOTH,38000,24000,7.5,urban_cargo_pants.jpg,NG-UR-CP-S-BLK,880192837501,S,Midnight Black,,30,5\n" +
      "Retro Urban Cargo Pants,Relaxed fit tactical urban cargo pants with multi-pocket utilities,Urban,BOTH,38000,24000,7.5,urban_cargo_pants.jpg,NG-UR-CP-M-BLK,880192837502,M,Midnight Black,,40,5\n";
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "nextgen_bulk_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloadable CSV template generated!");
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error("Please select a CSV file to import.");
      return;
    }

    try {
      setIsImporting(true);
      setImportStep("Reading CSV template...");
      setImportProgress(10);

      const text = await csvFile.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      
      if (lines.length <= 1) {
        throw new Error("The CSV file has no product data rows.");
      }

      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      
      const parsedRows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < headers.length) continue;

        parsedRows.push({
          productName: values[0],
          description: values[1] || "",
          categoryName: values[2],
          gender: values[3]?.toUpperCase() || "BOTH",
          basePrice: parseFloat(values[4]) || 0,
          costPrice: values[5] ? parseFloat(values[5]) : null,
          tax: values[6] ? parseFloat(values[6]) : null,
          imageFilename: values[7] || "",
          sku: values[8],
          barcode: values[9] || null,
          size: values[10] || null,
          color: values[11] || null,
          variantPrice: values[12] ? parseFloat(values[12]) : null,
          stockQuantity: parseInt(values[13]) || 0,
          lowStockThreshold: values[14] ? parseInt(values[14]) : 5
        });
      }

      if (parsedRows.length === 0) {
        throw new Error("No valid rows could be parsed from the CSV file.");
      }

      const productGroups: any = {};
      for (const row of parsedRows) {
        if (!productGroups[row.productName]) {
          productGroups[row.productName] = [];
        }
        productGroups[row.productName].push(row);
      }

      const productNames = Object.keys(productGroups);
      setImportStep(`Uploading product assets... (0 of ${productNames.length})`);
      setImportProgress(30);

      const uploadedImagesMap: Record<string, string> = {};
      
      if (imageFiles && imageFiles.length > 0) {
        let uploadedCount = 0;
        
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          
          setImportStep(`Uploading "${file.name}" to Cloudinary...`);
          setImportProgress(Math.round(30 + (uploadedCount / imageFiles.length) * 40));

          const formData = new FormData();
          formData.append("file", file);
          
          const uploadRes: any = await uploadImageAction(formData);
          if (uploadRes.success && uploadRes.url) {
            uploadedImagesMap[file.name] = uploadRes.url;
          }
          
          uploadedCount++;
        }
      }

      setImportStep("Processing inventory database sync...");
      setImportProgress(80);

      const productsPayloadList = productNames.map((name) => {
        const variantsList = productGroups[name];
        const firstRow = variantsList[0];
        
        let imageUrls: string[] = [];
        if (firstRow.imageFilename) {
          if (firstRow.imageFilename.startsWith("http://") || firstRow.imageFilename.startsWith("https://")) {
            imageUrls.push(firstRow.imageFilename);
          } else if (uploadedImagesMap[firstRow.imageFilename]) {
            imageUrls.push(uploadedImagesMap[firstRow.imageFilename]);
          } else {
            imageUrls.push("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600");
          }
        } else {
          imageUrls.push("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600");
        }

        return {
          productName: name,
          description: firstRow.description,
          categoryName: firstRow.categoryName,
          gender: firstRow.gender,
          basePrice: firstRow.basePrice,
          costPrice: firstRow.costPrice,
          tax: firstRow.tax,
          imageUrls,
          variants: variantsList.map((v: any) => ({
            sku: v.sku,
            barcode: v.barcode,
            size: v.size,
            color: v.color,
            variantPrice: v.variantPrice,
            stockQuantity: v.stockQuantity,
            lowStockThreshold: v.lowStockThreshold
          }))
        };
      });

      const importRes = await importProductsAction(productsPayloadList);
      
      if (!importRes.success) {
        throw new Error(importRes.error || "Server action failed during database insert.");
      }

      setImportStep("Bulk Import Completed Successfully!");
      setImportProgress(100);
      toast.success(`Success! Imported ${importRes.count} products seamlessly.`);
      
      setTimeout(() => {
        setIsImportOpen(false);
        setCsvFile(null);
        setImageFiles(null);
        setIsImporting(false);
        loadData();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An unexpected error occurred during bulk import.");
      setIsImporting(false);
    }
  };

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
  };

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
    }
  ];



  return (
    <div className="space-y-10 animate-slow-fade">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-gradient">Product Catalog</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleSyncPos}
            disabled={isSyncingPos}
            className="group glass-card border-none h-12 px-6 font-black text-xs uppercase tracking-widest text-black bg-amber-400 hover:bg-brand-navy hover:text-white transition-all flex items-center shadow-lg shadow-brand-navy/30"
          >
            {isSyncingPos ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-black group-hover:text-white" />
            ) : (
              <Zap className="mr-2 h-4 w-4 text-black fill-black group-hover:text-white group-hover:fill-white transition-colors" />
            )}
            {isSyncingPos ? "SYNCING..." : "SYNC FROM POS"}
          </Button>

          <Button 
            variant="outline" 
            onClick={handleExport}
            className="glass-card border-none h-12 px-6 font-black text-xs uppercase tracking-widest hover:bg-brand-navy/5 hover:text-brand-navy transition-all"
          >
            <Download className="mr-2 h-4 w-4" />
            EXPORT CATALOG
          </Button>

          {/* Import CSV dialog */}
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger render={
              <Button 
                variant="outline" 
                className="glass-card border-none h-12 px-6 font-black text-xs uppercase tracking-widest hover:bg-brand-navy/5 hover:text-brand-navy transition-all"
              >
                <Upload className="mr-2 h-4 w-4" />
                IMPORT CSV
              </Button>
            } />
            <DialogContent className="max-w-2xl glass-card border-none p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
              <div className="px-10 py-6 bg-brand-mesh border-b border-border/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-navy/5" />
                <DialogHeader className="relative z-10">
                  <DialogTitle className="text-xl font-black text-brand-navy uppercase tracking-[0.2em]">Bulk Catalog Import</DialogTitle>
                  <DialogDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">
                    Mass deploy catalog architectures using spreadsheets
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <div className="p-8 space-y-6">
                {!isImporting ? (
                  <form onSubmit={handleImportSubmit} className="space-y-6">
                    {/* Action buttons */}
                    <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-border/40">
                      <div className="space-y-0.5">
                        <p className="text-xs font-black uppercase tracking-wider text-brand-navy">CSV spreadsheet Template</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Use our pre-configured CSV schema to align column data.</p>
                      </div>
                      <Button 
                        type="button" 
                        onClick={handleDownloadTemplate}
                        className="bg-white hover:bg-zinc-100 text-brand-navy border border-border/50 h-9 px-4 font-black text-[9px] uppercase tracking-widest rounded-xl shadow-xs"
                      >
                        <Download className="mr-1.5 size-3.5" />
                        Download Template
                      </Button>
                    </div>

                    {/* Drag and Drop fields */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">1. Upload CSV Spreadsheet (Required)</label>
                        <div className="relative border-2 border-dashed border-zinc-200 hover:border-brand-navy/50 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-zinc-50/50">
                          <input 
                            type="file" 
                            accept=".csv"
                            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <FileText className="size-8 text-muted-foreground/60" />
                          <span className="text-xs font-black text-brand-navy uppercase tracking-wider">
                            {csvFile ? csvFile.name : "Select your spreadsheet file"}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-medium">CSV files only</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">2. Match Media Assets (Optional)</label>
                        <div className="relative border-2 border-dashed border-zinc-200 hover:border-brand-navy/50 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-zinc-50/50">
                          <input 
                            type="file" 
                            multiple
                            accept="image/*"
                            onChange={(e) => setImageFiles(e.target.files)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <ImageIcon className="size-8 text-muted-foreground/60" />
                          <span className="text-xs font-black text-brand-navy uppercase tracking-wider text-center">
                            {imageFiles && imageFiles.length > 0 
                              ? `${imageFiles.length} image files selected` 
                              : "Select matching product image files"}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-medium text-center max-w-sm">
                            Make sure their filenames match the values under the "Image Filename" column exactly.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-border/30">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setIsImportOpen(false)}
                        className="h-11 px-6 font-black text-[10px] uppercase tracking-widest rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={!csvFile}
                        className="bg-brand-navy hover:bg-brand-navy/90 text-white h-11 px-8 font-black rounded-xl shadow-xl shadow-brand-navy/20 disabled:opacity-40"
                      >
                        Run Importer
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center gap-6">
                    {importProgress < 100 ? (
                      <Loader2 className="size-10 text-brand-navy animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-10 text-emerald-500 animate-bounce" />
                    )}
                    <div className="text-center space-y-1.5">
                      <h3 className="text-sm font-black uppercase tracking-widest text-brand-navy">{importStep}</h3>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Please keep this browser window open</p>
                    </div>
                    <div className="w-full max-w-md bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-navy transition-all duration-500 ease-out" 
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
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
      <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
        <MetricCard
          title="Total Products"
          value={data?.kpis?.totalProducts || 0}
          icon={PackagePlus}
          variant="slate"
          compact={true}
          className="flex-1"
        />
        <MetricCard
          title="Global Valuation"
          value={`₦${(data?.kpis?.totalValue || 0).toLocaleString()}`}
          icon={Zap}
          variant="pink"
          compact={true}
          className="flex-1"
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

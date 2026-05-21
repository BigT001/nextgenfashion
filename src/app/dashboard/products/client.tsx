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
  CheckCircle2,
  AlertTriangle,
  Check,
  X as XIcon,
  Clock,
  ChevronDown
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
import { deleteProductAction, importProductsAction, uploadImageAction, syncPosProductsAction, getProductByIdAction, matchImageFilenamesAction, linkProductImageAction } from "@/modules/products/actions/product.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export default function ProductsClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState<any>(initialData);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  const handleEditProduct = async (productId: string) => {
    if (isLoadingProduct) return;
    setIsLoadingProduct(true);
    
    const promise = getProductByIdAction(productId);
    
    toast.promise(promise, {
      loading: "Fetching complete catalog specifications...",
      success: (res) => {
        if (res.success && res.data) {
          setEditingProduct(res.data);
          return "Catalog loaded!";
        } else {
          throw new Error(res.error || "Could not fetch details");
        }
      },
      error: (err) => `Failed to load details: ${err.message}`
    });

    try {
      await promise;
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  // Bulk CSV Import States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState<string>("");
  const [importProgress, setImportProgress] = useState<number>(0);

  // POS Sync States
  const [isSyncingPos, setIsSyncingPos] = useState(false);

  // Mass Image Upload States
  const [isMassUploadOpen, setIsMassUploadOpen] = useState(false);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<FileList | null>(null);
  const [isMatchingImages, setIsMatchingImages] = useState(false);
  const [matchResults, setMatchResults] = useState<{
    matched: Array<{ filename: string; productId: string; productName: string; sku: string; barcode: string | null }>;
    unmatched: Array<{ filename: string }>;
  } | null>(null);
  const [uploadStep, setUploadStep] = useState<"select" | "preview" | "progress" | "complete">("select");
  const [uploadStatusList, setUploadStatusList] = useState<Array<{ filename: string; status: "pending" | "uploading" | "linking" | "success" | "failed"; error?: string }>>([]);
  const [massUploadProgress, setMassUploadProgress] = useState(0);

  const handleMassFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setSelectedUploadFiles(files);
    setIsMatchingImages(true);
    setUploadStep("preview");

    const filenames = Array.from(files).map(f => f.name);
    try {
      const res = await matchImageFilenamesAction(filenames) as any;
      if (res.success && res.matched) {
        setMatchResults({
          matched: res.matched,
          unmatched: res.unmatched || []
        });
        
        // Initialize status list
        const initialStatus = Array.from(files).map(file => {
          const isMatched = res.matched.some((m: any) => m.filename === file.name);
          return {
            filename: file.name,
            status: isMatched ? "pending" as const : "failed" as const,
            error: isMatched ? undefined : "No matching SKU/Barcode product variant found."
          };
        });
        setUploadStatusList(initialStatus);
      } else {
        toast.error(res.error || "Failed to analyze filenames");
        setUploadStep("select");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze filenames");
      setUploadStep("select");
    } finally {
      setIsMatchingImages(false);
    }
  };

  const handleStartMassUpload = async () => {
    if (!selectedUploadFiles || !matchResults || matchResults.matched.length === 0) return;

    setUploadStep("progress");
    setMassUploadProgress(0);

    const matchedFilesMap = new Map<string, File>();
    Array.from(selectedUploadFiles).forEach(file => {
      matchedFilesMap.set(file.name, file);
    });

    let completedCount = 0;
    const totalToUpload = matchResults.matched.length;

    for (let i = 0; i < matchResults.matched.length; i++) {
      const match = matchResults.matched[i];
      const file = matchedFilesMap.get(match.filename);
      
      if (!file) continue;

      setUploadStatusList(prev => prev.map(item => 
        item.filename === match.filename ? { ...item, status: "uploading" } : item
      ));

      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await uploadImageAction(formData) as any;
        if (!uploadRes.success || !uploadRes.url) {
          throw new Error(uploadRes.error || "Failed to upload to Cloudinary");
        }

        setUploadStatusList(prev => prev.map(item => 
          item.filename === match.filename ? { ...item, status: "linking" } : item
        ));

        const linkRes = await linkProductImageAction(match.productId, uploadRes.url);
        if (!linkRes.success) {
          throw new Error(linkRes.error || "Failed to link image to product");
        }

        setUploadStatusList(prev => prev.map(item => 
          item.filename === match.filename ? { ...item, status: "success" } : item
        ));
      } catch (err: any) {
        console.error(`Error uploading ${match.filename}:`, err);
        setUploadStatusList(prev => prev.map(item => 
          item.filename === match.filename ? { ...item, status: "failed", error: err.message || "Unknown error" } : item
        ));
      }

      completedCount++;
      setMassUploadProgress(Math.round((completedCount / totalToUpload) * 100));
    }

    setUploadStep("complete");
    loadData();
    toast.success("Mass upload flow finished!");
  };

  const handleResetMassUpload = () => {
    setSelectedUploadFiles(null);
    setMatchResults(null);
    setUploadStatusList([]);
    setMassUploadProgress(0);
    setUploadStep("select");
  };

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
      "Product Name,Description,Category Name,Gender,Wholesale Price,Retail Price,Cost Price,Tax,Image Filename,SKU,Barcode,Size,Color,Variant Wholesale Price,Variant Retail Price,Stock Quantity,Low Stock Threshold\n" +
      "Premium Vintage Denim Jacket,Heavyweight raw indigo vintage denim jacket with custom brass hardware,Vintage,BOTH,45000,52000,30000,7.5,vintage_denim_jacket.jpg,NG-VD-JK-M-BLU,880192837401,M,Indigo,45000,52000,15,5\n" +
      "Premium Vintage Denim Jacket,Heavyweight raw indigo vintage denim jacket with custom brass hardware,Vintage,BOTH,45000,52000,30000,7.5,vintage_denim_jacket.jpg,NG-VD-JK-L-BLU,880192837402,L,Indigo,45000,52000,20,5\n" +
      "Retro Urban Cargo Pants,Relaxed fit tactical urban cargo pants with multi-pocket utilities,Urban,BOTH,38000,44000,24000,7.5,urban_cargo_pants.jpg,NG-UR-CP-S-BLK,880192837501,S,Midnight Black,,,30,5\n" +
      "Retro Urban Cargo Pants,Relaxed fit tactical urban cargo pants with multi-pocket utilities,Urban,BOTH,38000,44000,24000,7.5,urban_cargo_pants.jpg,NG-UR-CP-M-BLK,880192837502,M,Midnight Black,,,40,5\n";
    
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
      header: "PRODUCT",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[150px]">
            <span className="font-black text-sm tracking-tight group-hover:text-brand-navy transition-colors">{row.original.name}</span>
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{row.original.category}</span>
        </div>
      ),
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest border-border/50 bg-muted/10 px-3 py-1">
            {row.original.sku}
        </Badge>
      ),
    },
    {
      accessorKey: "price",
      header: "WHOLESALE",
      cell: ({ row }) => (
        <div className="font-black text-brand-navy tracking-tighter text-sm">
            ₦{Number(row.original.price).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "retailPrice",
      header: "RETAIL",
      cell: ({ row }) => (
        <div className="font-black text-brand-navy tracking-tighter text-sm">
            ₦{Number(row.original.retailPrice || 0).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "costPrice",
      header: "COST",
      cell: ({ row }) => (
        <div className="font-black text-muted-foreground/40 tracking-tighter text-sm italic">
            ₦{Number(row.original.costPrice || 0).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "variants",
      header: "VARS",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-black text-[10px] rounded-lg px-2">
            {row.original.variants?.length || 1} VARS
        </Badge>
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
            onClick={() => handleEditProduct(row.original.id)}
            disabled={isLoadingProduct}
          >
            <Edit className="h-3.5 w-3.5" /> Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center hover:bg-brand-navy/5 hover:text-brand-navy rounded-xl transition-colors text-muted-foreground focus:outline-none">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 glass-card border-none shadow-2xl p-2 rounded-2xl">
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy cursor-pointer"
                  onClick={() => handleEditProduct(row.original.id)}
                  disabled={isLoadingProduct}
                >
                  <Edit className="size-4" /> Modify Catalog
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem 
                  className="rounded-xl h-10 font-bold gap-3 focus:bg-rose-500/10 focus:text-rose-600 text-rose-600 cursor-pointer"
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this product?")) {
                      const res = (await deleteProductAction(row.original.id)) as any;
                      if (res.success) {
                        toast.success(res.message || "Product deleted successfully");
                        loadData();
                      } else {
                        toast.error(res.error || "Failed to delete product");
                      }
                    }
                  }}
                >
                  <Trash2 className="size-4" /> Delete Product
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
            className="group glass-card border-none h-10 px-4 font-black text-xs uppercase tracking-wider text-black bg-amber-400 hover:bg-brand-navy hover:text-white transition-all flex items-center shadow-md shadow-brand-navy/10 cursor-pointer"
          >
            {isSyncingPos ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-black group-hover:text-white" />
            ) : (
              <Zap className="mr-1.5 h-3.5 w-3.5 text-black fill-black group-hover:text-white group-hover:fill-white transition-colors" />
            )}
            {isSyncingPos ? "SYNCING..." : "SYNC FROM POS"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="glass-card border border-border/35 bg-white hover:bg-brand-navy/5 hover:text-brand-navy text-muted-foreground h-10 px-4 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all outline-none cursor-pointer">
              <span>More Actions</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 glass-card border-none shadow-2xl p-2 rounded-2xl">
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy cursor-pointer text-xs uppercase tracking-wider px-3"
                  onClick={() => setIsImportOpen(true)}
                >
                  <Upload className="size-4" /> Import CSV
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy cursor-pointer text-xs uppercase tracking-wider px-3"
                  onClick={() => setIsMassUploadOpen(true)}
                >
                  <ImageIcon className="size-4" /> Mass Upload Images
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem 
                  className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy cursor-pointer text-xs uppercase tracking-wider px-3"
                  onClick={handleExport}
                >
                  <Download className="size-4" /> Export Catalog
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={() => setIsAddProductOpen(true)}
            className="bg-brand-navy hover:bg-brand-navy/90 text-white h-10 px-5 font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-brand-navy/15 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            ADD PRODUCT
          </Button>

          {/* Mass Image Upload Dialog */}
          <Dialog open={isMassUploadOpen} onOpenChange={(open) => {
            setIsMassUploadOpen(open);
            if (!open) handleResetMassUpload();
          }}>
            <DialogContent className="max-w-2xl glass-card border-none p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
              <div className="px-10 py-6 bg-brand-mesh border-b border-border/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-navy/5" />
                <DialogHeader className="relative z-10">
                  <DialogTitle className="text-xl font-black text-brand-navy uppercase tracking-[0.2em]">Mass Image Upload</DialogTitle>
                  <DialogDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">
                    Auto-associate image assets with matching catalog SKUs or barcodes
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-8 space-y-6">
                {uploadStep === "select" && (
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Select Product Images (Multiple Allowed)</label>
                      <div className="relative border-2 border-dashed border-zinc-200 hover:border-brand-navy/50 transition-colors rounded-2xl p-10 flex flex-col items-center justify-center gap-3 bg-zinc-50/50">
                        <input 
                          type="file" 
                          multiple
                          accept="image/*"
                          onChange={handleMassFilesChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload className="size-10 text-muted-foreground/60 animate-pulse" />
                        <span className="text-sm font-black text-brand-navy uppercase tracking-wider">
                          Choose images or drag them here
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium text-center max-w-sm">
                          Filenames must match the Product SKU (e.g. <code>NGN-DENIM-M.jpg</code>) or Barcode (e.g. <code>880192837401.png</code>) exactly.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {uploadStep === "preview" && (
                  <div className="space-y-6">
                    {isMatchingImages ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="size-10 text-brand-navy animate-spin" />
                        <span className="text-xs font-black uppercase tracking-widest text-brand-navy">Analyzing matching variants...</span>
                      </div>
                    ) : (
                      <>
                        {/* Summary Badges */}
                        <div className="flex gap-4 p-4 bg-zinc-50 rounded-2xl border border-border/40 justify-around">
                          <div className="text-center">
                            <span className="block text-2xl font-black text-brand-navy">
                              {(matchResults?.matched.length || 0) + (matchResults?.unmatched.length || 0)}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Total Selected</span>
                          </div>
                          <div className="border-r border-zinc-200 my-1" />
                          <div className="text-center">
                            <span className="block text-2xl font-black text-emerald-600">
                              {matchResults?.matched.length || 0}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Matched Products</span>
                          </div>
                          <div className="border-r border-zinc-200 my-1" />
                          <div className="text-center">
                            <span className="block text-2xl font-black text-amber-500">
                              {matchResults?.unmatched.length || 0}
                            </span>
                            <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Unresolved</span>
                          </div>
                        </div>

                        {/* List of files */}
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Mapping Specifications</label>
                          <div className="max-h-60 overflow-y-auto border border-zinc-100 rounded-2xl p-2 divide-y divide-zinc-50 space-y-1">
                            {uploadStatusList.map((item, index) => {
                              const match = matchResults?.matched.find(m => m.filename === item.filename);
                              return (
                                <div key={index} className="py-2.5 px-3 flex items-center justify-between text-xs hover:bg-zinc-50/50 rounded-xl transition-colors">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
                                    <span className="font-bold truncate max-w-[200px]" title={item.filename}>{item.filename}</span>
                                  </div>
                                  <div className="flex items-center gap-2 max-w-[60%] text-right">
                                    {match ? (
                                      <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full truncate">
                                        Matches: {match.productName}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-amber-600 font-black uppercase tracking-wider bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full truncate">
                                        Skipped (No Match)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Footer buttons */}
                        <div className="flex gap-3 justify-end pt-4 border-t border-border/30">
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={handleResetMassUpload}
                            className="h-11 px-6 font-black text-[10px] uppercase tracking-widest rounded-xl"
                          >
                            Reset
                          </Button>
                          <Button 
                            type="button"
                            onClick={handleStartMassUpload}
                            disabled={!matchResults || matchResults.matched.length === 0}
                            className="bg-brand-navy hover:bg-brand-navy/90 text-white h-11 px-8 font-black rounded-xl shadow-xl shadow-brand-navy/20 disabled:opacity-40"
                          >
                            Upload {matchResults?.matched.length} matched {matchResults?.matched.length === 1 ? "image" : "images"}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {uploadStep === "progress" && (
                  <div className="py-8 flex flex-col items-center justify-center gap-6">
                    <Loader2 className="size-10 text-brand-navy animate-spin" />
                    <div className="text-center space-y-1.5 w-full px-8">
                      <h3 className="text-sm font-black uppercase tracking-widest text-brand-navy">
                        Uploading and linking assets... ({massUploadProgress}%)
                      </h3>
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                        Please keep this browser window open. Do not refresh.
                      </p>
                    </div>

                    <div className="w-full max-w-md bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-navy transition-all duration-500 ease-out" 
                        style={{ width: `${massUploadProgress}%` }}
                      />
                    </div>

                    {/* Progress details */}
                    <div className="w-full max-w-md max-h-48 overflow-y-auto border border-zinc-100 rounded-xl p-2 space-y-1">
                      {uploadStatusList
                        .filter(item => item.status !== "failed" || item.error !== "No matching SKU/Barcode product variant found.")
                        .map((item, idx) => {
                          return (
                            <div key={idx} className="flex items-center justify-between text-[11px] py-1.5 px-2.5 rounded-lg hover:bg-zinc-50 transition-colors">
                              <span className="font-bold truncate max-w-[220px]">{item.filename}</span>
                              <div className="flex items-center gap-1.5 font-black uppercase tracking-widest text-[9px]">
                                {item.status === "pending" && (
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="size-3" /> Queued
                                  </span>
                                )}
                                {item.status === "uploading" && (
                                  <span className="text-blue-500 flex items-center gap-1">
                                    <Loader2 className="size-3 animate-spin" /> Cloudinary...
                                  </span>
                                )}
                                {item.status === "linking" && (
                                  <span className="text-indigo-500 flex items-center gap-1">
                                    <Loader2 className="size-3 animate-spin" /> Linking...
                                  </span>
                                )}
                                {item.status === "success" && (
                                  <span className="text-emerald-600 flex items-center gap-1">
                                    <Check className="size-3" /> Done
                                  </span>
                                )}
                                {item.status === "failed" && (
                                  <span className="text-rose-500 flex items-center gap-1" title={item.error}>
                                    <AlertTriangle className="size-3" /> Failed
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {uploadStep === "complete" && (
                  <div className="space-y-6">
                    <div className="py-10 flex flex-col items-center justify-center gap-4">
                      <CheckCircle2 className="size-12 text-emerald-500 animate-bounce" />
                      <div className="text-center space-y-1">
                        <h3 className="text-base font-black uppercase tracking-widest text-brand-navy">
                          Mass Upload Sync Completed
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                          Successfully updated {uploadStatusList.filter(i => i.status === "success").length} product image profiles
                        </p>
                      </div>
                    </div>

                    {/* Show failures if any */}
                    {uploadStatusList.some(i => i.status === "failed") && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1">
                          <AlertTriangle className="size-3.5" /> Failures / Warnings
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-rose-100 bg-rose-50/20 rounded-2xl p-2 space-y-1">
                          {uploadStatusList.filter(i => i.status === "failed").map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] py-1.5 px-3 rounded-xl bg-white border border-rose-100/50">
                              <span className="font-bold truncate max-w-[200px]" title={item.filename}>{item.filename}</span>
                              <span className="text-[9px] text-rose-500 font-bold truncate max-w-[60%]">{item.error}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 justify-end pt-4 border-t border-border/30">
                      <Button 
                        type="button"
                        onClick={handleResetMassUpload}
                        className="border border-border h-11 px-6 font-black text-[10px] uppercase tracking-widest rounded-xl"
                      >
                        Upload More
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => {
                          setIsMassUploadOpen(false);
                          handleResetMassUpload();
                        }}
                        className="bg-brand-navy hover:bg-brand-navy/90 text-white h-11 px-8 font-black rounded-xl shadow-xl shadow-brand-navy/20"
                      >
                        Finish & Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Import CSV dialog */}
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
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

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
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const ProductForm = dynamic(
  () => import("@/modules/products/components/product-form").then((mod) => mod.ProductForm),
  { ssr: false, loading: () => <LoadingSpinner size="sm" /> }
);
import { getInventoryDashboardAction } from "@/modules/inventory/actions/inventory.actions";
import { deleteProductAction, deleteAllProductsAction, importProductsAction, uploadImageAction, getProductByIdAction, matchImageFilenamesAction, linkProductImageAction } from "@/modules/products/actions/product.actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export default function ProductsClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState<any>(initialData);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [showOnlyWithImages, setShowOnlyWithImages] = useState(false);

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
        const skuBasedId = match.sku
          ? match.sku.toString().trim().replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").substring(0, 60).toUpperCase()
          : null;
        const publicId = skuBasedId
          ? `product-${skuBasedId}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
          : `product-${match.productId}-${Date.now()}`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("publicId", publicId);
        
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
      const imageNameToSku: Record<string, string> = {};
      parsedRows.forEach((row) => {
        if (row.imageFilename && row.sku) {
          imageNameToSku[row.imageFilename] = row.sku;
        }
      });

      if (imageFiles && imageFiles.length > 0) {
        let uploadedCount = 0;
        
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const matchingSku = imageNameToSku[file.name];
          const normalizedSku = matchingSku
            ? matchingSku.toString().trim().replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").substring(0, 60).toUpperCase()
            : file.name.replace(/\.[^/.]+$/, "").toString().trim().replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").substring(0, 60).toUpperCase();
          const publicId = `import-${normalizedSku}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

          setImportStep(`Uploading "${file.name}" to Cloudinary...`);
          setImportProgress(Math.round(30 + (uploadedCount / imageFiles.length) * 40));

          const formData = new FormData();
          formData.append("file", file);
          formData.append("publicId", publicId);
          
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

  const getImageFilename = (url?: string) => {
    if (!url) return "";
    const cleanUrl = url.split("?")[0];
    const parts = cleanUrl.split("/");
    return parts[parts.length - 1] || "";
  };

  const escapeCsvValue = (value: any) => {
    const cell = value ?? "";
    const stringValue = typeof cell === "string" ? cell : String(cell);
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const handleExport = () => {
    if (!data?.products) return;
    
    const headers = ["Name", "Category", "SKU", "Sizes", "Colors", "Image Name", "Selling Price", "Cost Price", "Stock"];
    const csvData = data.products.map((p: any) => [
      p.name,
      p.category,
      p.sku,
      p.sizes?.length ? p.sizes.join("; ") : "",
      p.colors?.length ? p.colors.join("; ") : "",
      p.imageName || getImageFilename(p.image),
      p.price,
      p.costPrice,
      p.stock
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(escapeCsvValue).join(","))
      .join("\n");
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

  const isCssColor = (color: string) => {
    if (!color) return false;
    return typeof window !== "undefined" && CSS.supports("color", color.trim());
  };

  const renderColorChip = (color: string) => {
    const value = color?.trim();
    const valid = isCssColor(value);

    return (
      <span
        key={value}
        className="inline-flex items-center justify-center rounded-full border border-border/40 bg-background/80 shadow-sm"
        style={valid ? { backgroundColor: value, boxShadow: `0 0 0 2px ${value}40` } : undefined}
        aria-label={value || "No color"}
        title={value || "No color"}
      >
        <span
          className={cn(
            "h-5 w-5 rounded-full border border-white/60",
            valid ? "" : "bg-muted"
          )}
          style={valid ? { backgroundColor: value } : undefined}
        />
      </span>
    );
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
      size: 64,
      cell: ({ row }) => (
        <div className="size-12 md:size-14 rounded-2xl bg-muted/30 flex items-center justify-center shrink-0 border border-border/20 overflow-hidden shadow-sm">
            {row.original.images?.[0] ? (
                <Image 
                    src={row.original.images[0]} 
                    alt={row.original.name} 
                    width={56} 
                    height={56} 
                    className="object-cover w-full h-full"
                />
            ) : (
                <ImageIcon className="size-5 md:size-6 text-muted-foreground/30" />
            )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "PRODUCT",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
            <span className="font-black text-sm tracking-tight group-hover:text-brand-navy transition-colors truncate">{row.original.name}</span>
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate">{row.original.category}</span>
            {row.original.sizes?.length ? (
              <span className="text-[10px] text-foreground/80 uppercase tracking-[0.18em] font-black mt-1 truncate">
                Sizes: {row.original.sizes.join(", ")}
              </span>
            ) : null}
        </div>
      ),
    },
    {
      accessorKey: "colors",
      header: "COLORS",
      meta: { className: "hidden lg:table-cell" },
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          {Array.isArray(row.original.colors) && row.original.colors.length > 0 ? (
            row.original.colors.map((color: string) => renderColorChip(color))
          ) : (
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-black">No colors</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "sizes",
      header: "SIZES",
      meta: { className: "hidden lg:table-cell" },
      cell: ({ row }) => (
        <span className="text-[11px] font-black text-muted-foreground">{row.original.sizes?.length ? row.original.sizes.join(", ") : "—"}</span>
      ),
    },
    // ── Desktop-only columns ──────────────────────────────────
    {
      accessorKey: "sku",
      header: "SKU",
      meta: { className: "hidden md:table-cell" },
      cell: ({ row }) => (
        <span className="font-mono text-[11px] font-bold text-muted-foreground tracking-tight">
          {row.original.sku || "—"}
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: "WHOLESALE",
      meta: { className: "hidden md:table-cell" },
      cell: ({ row }) => (
        <span className="font-black text-sm text-brand-navy">
          ₦{Number(row.original.price || 0).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "retailPrice",
      header: "RETAIL",
      meta: { className: "hidden md:table-cell" },
      cell: ({ row }) => (
        <span className="font-black text-sm text-foreground">
          ₦{Number(row.original.retailPrice || 0).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "STATUS",
      meta: { className: "hidden md:table-cell" },
      cell: ({ row }) => {
        const s = row.original.status as string;
        return (
          <Badge className={cn(
            "font-black text-[9px] px-2.5 py-1 uppercase tracking-widest border-none",
            s === "Out of Stock" ? "bg-rose-100 text-rose-700" :
            s === "Low Stock"   ? "bg-amber-100 text-amber-700" :
                                  "bg-emerald-100 text-emerald-700"
          )}>
            {s}
          </Badge>
        );
      },
    },
    // ── Stock (mobile only) ──────────────────────────────────
    {
      accessorKey: "stock",
      header: "STOCK",
      size: 60,
      meta: { className: "md:hidden" },
      cell: ({ row }) => (
        <div className={`font-black text-sm tracking-tighter ${
          row.original.status === "Out of Stock" ? "text-rose-600" :
          row.original.status === "Low Stock"   ? "text-amber-500" :
                                                  "text-emerald-600"
        }`}>
            {row.original.stock}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-2 md:pr-4 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">CONTROL</div>,
      size: 96,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5 pr-1 md:pr-2 shrink-0">
          {/* Mobile: compact icon-only edit button */}
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-9 md:hidden bg-brand-navy/5 text-brand-navy hover:bg-brand-navy hover:text-white border-none rounded-2xl active:scale-95 transition-all flex items-center justify-center p-0 shadow-sm"
            onClick={() => handleEditProduct(row.original.id)}
            disabled={isLoadingProduct}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <div className={cn("flex items-center justify-center h-9 w-9 rounded-2xl md:hidden text-muted-foreground bg-muted/10 shrink-0", row.getIsExpanded() && "bg-brand-navy/10")}> 
            <ChevronDown className={cn("h-4 w-4 transition-transform", row.getIsExpanded() && "-rotate-180")} />
          </div>

          {/* Desktop: labeled edit button + dropdown */}
          <Button
            size="sm"
            variant="outline"
            className="hidden md:inline-flex h-9 px-3 font-black text-[10px] uppercase tracking-[0.24em] bg-brand-navy text-white hover:bg-brand-navy/90 border-none rounded-2xl active:scale-95 transition-all items-center gap-1.5 shadow-sm whitespace-nowrap"
            onClick={() => handleEditProduct(row.original.id)}
            disabled={isLoadingProduct}
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="hidden md:inline-flex h-9 w-9 items-center justify-center hover:bg-brand-navy/10 hover:text-brand-navy rounded-2xl transition-colors text-muted-foreground focus:outline-none bg-muted/10 border border-border/30 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 glass-card border-none shadow-2xl p-2 rounded-2xl">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy cursor-pointer text-xs"
                  onClick={() => handleEditProduct(row.original.id)}
                  disabled={isLoadingProduct}
                >
                  <Edit className="size-4" /> Modify Catalog
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem
                  className="rounded-xl h-10 font-bold gap-3 focus:bg-rose-500/10 focus:text-rose-600 text-rose-600 cursor-pointer text-xs"
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



  const renderProductDetails = ({ row }: { row: any }) => {
    const item = row.original;
    return (
      <div className="space-y-4 p-4 bg-white/95 rounded-3xl shadow-inner sm:hidden">
        <div className="flex items-start gap-3">
          <div className="size-16 rounded-3xl bg-muted/10 overflow-hidden border border-border/20">
            {item.images?.[0] ? (
              <Image src={item.images[0]} alt={item.name} width={84} height={84} className="object-cover w-full h-full" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ImageIcon className="size-6" /></div>
            )}
          </div>
          <div className="min-w-0 space-y-2">
            <p className="font-black text-base tracking-tight text-brand-navy truncate">{item.name}</p>
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground font-black">{item.category}</p>
            <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest border-border/50 bg-muted/10 px-2 py-1">
              {(item.variants?.length ?? 1)} VARS
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-[11px] text-brand-navy">
          <div className="rounded-3xl border border-border/30 bg-muted/10 p-3">
            <p className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground font-black">SKU</p>
            <p className="mt-1 font-black truncate">{item.sku || "—"}</p>
          </div>
          <div className="rounded-3xl border border-border/30 bg-muted/10 p-3">
            <p className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground font-black">Stock</p>
            <p className={`mt-1 font-black ${
                item.status === "Out of Stock" ? "text-rose-600" :
                item.status === "Low Stock"   ? "text-amber-500" :
                                                "text-emerald-600"
            }`}>
              {item.stock}{item.status === "Out of Stock" ? " · OOS" : item.status === "Low Stock" ? " · LOW" : ""}
            </p>
          </div>
          <div className="rounded-3xl border border-border/30 bg-muted/10 p-3">
            <p className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground font-black">Wholesale</p>
            <p className="mt-1 font-black">₦{Number(item.price || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-3xl border border-border/30 bg-muted/10 p-3">
            <p className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground font-black">Retail</p>
            <p className="mt-1 font-black">₦{Number(item.retailPrice || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-3xl border border-border/30 bg-muted/10 p-3">
            <p className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground font-black">Sizes</p>
            <p className="mt-1 font-black">{item.sizes?.length ? item.sizes.join(", ") : "—"}</p>
          </div>
          <div className="rounded-3xl border border-border/30 bg-muted/10 p-3">
            <p className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground font-black">Colors</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.isArray(item.colors) && item.colors.length > 0 ? (
                item.colors.map((color: string) => renderColorChip(color))
              ) : (
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-black">No colors</span>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-border/30 bg-muted/10 p-4">
          <p className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground font-black mb-2">Description</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {item.description || "No description available."}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-11 font-black text-[10px] uppercase tracking-widest"
            onClick={() => handleEditProduct(item.id)}
            disabled={isLoadingProduct}
          >
            Edit Product
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="flex-1 h-11 font-black text-[10px] uppercase tracking-widest text-rose-600 border border-rose-100"
            onClick={async () => {
              if (confirm("Are you sure you want to delete this product?")) {
                const res = (await deleteProductAction(item.id)) as any;
                if (res.success) {
                  toast.success(res.message || "Product deleted successfully");
                  loadData();
                } else {
                  toast.error(res.error || "Failed to delete product");
                }
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-slow-fade">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tight text-gradient">Product Catalog</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Button
              onClick={() => setIsAddProductOpen(true)}
              className="bg-brand-navy hover:bg-brand-navy/90 text-white h-12 min-w-[11rem] px-6 font-black text-sm uppercase tracking-[0.18em] rounded-[1rem] shadow-xl shadow-brand-navy/15 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">ADD PRODUCT</span>
              <span className="sm:hidden">ADD</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="glass-card border border-border/35 bg-white hover:bg-brand-navy/5 hover:text-brand-navy text-muted-foreground h-12 px-5 font-black text-sm uppercase tracking-[0.18em] rounded-[1rem] flex items-center justify-center gap-2 transition-all outline-none cursor-pointer w-full sm:w-auto">
                <span className="hidden sm:inline">More Actions</span>
                <span className="sm:hidden">More</span>
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 glass-card border-none shadow-2xl p-2 rounded-2xl">
                <DropdownMenuGroup>
                  <DropdownMenuItem 
                    className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy cursor-pointer text-xs uppercase tracking-wider px-3"
                    onClick={() => setIsImportOpen(true)}
                  >
                    <Upload className="size-4" /> Import CSV
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
          </div>
        </div>

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
                        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-zinc-50 rounded-2xl border border-border/40">
                          <div className="text-center flex-1">
                            <span className="block text-2xl font-black text-brand-navy">
                              {(matchResults?.matched.length || 0) + (matchResults?.unmatched.length || 0)}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Total Selected</span>
                          </div>
                          <div className="border-r border-zinc-200 hidden sm:block my-1" />
                          <div className="text-center flex-1">
                            <span className="block text-2xl font-black text-emerald-600">
                              {matchResults?.matched.length || 0}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Matched Products</span>
                          </div>
                          <div className="border-r border-zinc-200 hidden sm:block my-1" />
                          <div className="text-center flex-1">
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
                                <div key={index} className="py-2.5 px-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs hover:bg-zinc-50/50 rounded-xl transition-colors gap-2">
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
          
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen} disablePointerDismissal>
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

          <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)} disablePointerDismissal>
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

      {/* Catalog KPIs - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-full">
        <MetricCard
          title="Total Products"
          value={data?.kpis?.totalProducts || 0}
          icon={PackagePlus}
          variant="slate"
          compact={true}
          className="w-full"
        />
        <MetricCard
          title="Global Valuation"
          value={`₦${(data?.kpis?.totalValue || 0).toLocaleString()}`}
          icon={Zap}
          variant="pink"
          compact={true}
          className="w-full"
        />
        {/* With Images filter card */}
        <div
          onClick={() => setShowOnlyWithImages(v => !v)}
          className={cn(
            "col-span-2 md:col-span-1 w-full relative flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 select-none group overflow-hidden shadow-sm",
            showOnlyWithImages
              ? "bg-brand-navy border-brand-navy text-white shadow-lg shadow-brand-navy/20"
              : "bg-white/60 border-border/30 hover:border-brand-navy/30 hover:bg-brand-navy/5"
          )}
        >
          {/* Background shimmer when active */}
          {showOnlyWithImages && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          )}
          <div className={cn(
            "size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
            showOnlyWithImages ? "bg-white/20" : "bg-brand-navy/10 group-hover:bg-brand-navy/15"
          )}>
            <ImageIcon className={cn("size-5", showOnlyWithImages ? "text-white" : "text-brand-navy")} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-[0.3em] truncate",
              showOnlyWithImages ? "text-white/70" : "text-muted-foreground"
            )}>
              {showOnlyWithImages ? "● Filtering Active" : "With Images"}
            </span>
            <span className={cn(
              "text-2xl font-black tracking-tight leading-tight",
              showOnlyWithImages ? "text-white" : "text-foreground"
            )}>
              {data?.kpis?.productsWithImages ?? 0}
            </span>
            <span className={cn(
              "text-[9px] font-medium truncate",
              showOnlyWithImages ? "text-white/60" : "text-muted-foreground/60"
            )}>
              {showOnlyWithImages ? "Click to show all" : "Click to filter table"}
            </span>
          </div>
          {showOnlyWithImages && (
            <div className="shrink-0 size-6 rounded-full bg-white/20 flex items-center justify-center">
              <XIcon className="size-3.5 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="overflow-x-auto">
        <DataTable 
          columns={columns} 
          data={(showOnlyWithImages
            ? (data?.products || []).filter((p: any) => p.images && p.images.length > 0)
            : (data?.products || [])
          )}
          searchKey="name"
          expandOnMobileOnly
          renderSubComponent={renderProductDetails}
        />
      </div>
    </div>
  );
}

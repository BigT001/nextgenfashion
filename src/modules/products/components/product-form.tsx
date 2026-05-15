"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Resolver } from "react-hook-form";
import * as z from "zod";
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  LayoutGrid, 
  Banknote, 
  Warehouse, 
  Images,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  createProductAction, 
  updateProductAction, 
  uploadImageAction, 
  getCategoriesAction,
  getProductBySkuAction,
  createCategoryAction 
} from "@/modules/products/actions/product.actions";
import { 
  getWarehousesAction, 
  createWarehouseAction, 
  deleteWarehouseAction 
} from "@/modules/inventory/actions/warehouse.actions";
import { toast } from "sonner";
import { Barcode, RotateCcw, ShieldCheck, AlertCircle, MapPin, HardDrive } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(2, "Product Name is required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  sku: z.string().min(1, "Product ID is required"),
  color: z.string().optional(),
  size: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  tags: z.string().optional(),
  costPrice: z.coerce.number().min(1, "Cost Price is required"),
  sellingPrice: z.coerce.number().min(1, "Selling Price is required"),
  promoPrice: z.coerce.number().optional(),
  discount: z.coerce.number().optional(),
  tax: z.coerce.number().optional(),
  hasTax: z.boolean().optional(),
  warehouseId: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductForm({ 
  onClose, 
  initialData 
}: { 
  onClose: () => void;
  initialData?: any;
}) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [images, setImages] = useState<{ url: string; publicId: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("product");
  const [isScanMode, setIsScanMode] = useState(false);
  const [skuStatus, setSkuStatus] = useState<"auto" | "scanned" | "conflict" | "syncing">("auto");

  useEffect(() => {
    async function fetchData() {
      const catResult = await getCategoriesAction();
      if (catResult.success) {
        setCategories(catResult.data || []);
      }
      const whResult = await getWarehousesAction();
      if (whResult.success) {
        setWarehouses(whResult.data || []);
      }
    }
    fetchData();
  }, []);

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [newWhName, setNewWhName] = useState("");
  const [newWhLoc, setNewWhLoc] = useState("");
  const [isAddingWarehouse, setIsAddingWarehouse] = useState(false);

  useEffect(() => {
    if (initialData?.images) {
        setImages(initialData.images.map((url: string) => ({ url, publicId: "" })));
    }
  }, [initialData]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || "",
      categoryId: initialData.categoryId,
      sku: initialData.sku || initialData.variants?.[0]?.sku || "",
      color: initialData.variants?.[0]?.color || "",
      size: initialData.variants?.[0]?.size || "",
      quantity: Number(initialData.variants?.[0]?.inventory?.quantity || 0),
      tags: initialData.tags || "",
      costPrice: initialData.costPrice || 0,
      sellingPrice: initialData.basePrice || initialData.price || 0,
      promoPrice: initialData.promoPrice || 0,
      discount: initialData.discount || 0,
      tax: initialData.tax || 7.5,
      hasTax: !!initialData.tax && initialData.tax > 0,
      warehouseId: initialData.variants?.[0]?.inventory?.warehouseId || "",
    } : {
      name: "",
      description: "",
      categoryId: "",
      sku: "",
      color: "",
      size: "",
      quantity: 0,
      tags: "",
      costPrice: 0,
      sellingPrice: 0,
      promoPrice: 0,
      discount: 0,
      tax: 7.5,
      hasTax: false,
      warehouseId: "",
    },
  });

  const generateAutoSku = () => {
    if (isScanMode || isEditing) return;
    const name = form.getValues("name");
    const categoryId = form.getValues("categoryId");
    if (!name) return;
    
    const category = categories.find(c => c.id === categoryId)?.name?.substring(0, 3).toUpperCase() || "GEN";
    const namePart = name.substring(0, 3).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    const generated = `NGN-${category}-${namePart}-${random}`;
    form.setValue("sku", generated);
    setSkuStatus("auto");
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "name" || name === "categoryId") {
        generateAutoSku();
      }
    });
    return () => subscription.unsubscribe();
  }, [categories, isScanMode]);

  const handleSkuLookup = async (sku: string) => {
    if (!sku || sku.length < 4) return;
    setSkuStatus("syncing");
    const result = await getProductBySkuAction(sku);
    if (result.success && result.data) {
        const existing = result.data;
        toast.info(`Inventory Record Found: ${existing.product.name}. Synchronizing...`, {
            icon: <ShieldCheck className="text-blue-500" />
        });
        
        // Auto-fill form if details found
        form.setValue("name", existing.product.name);
        form.setValue("categoryId", existing.product.categoryId);
        form.setValue("description", existing.product.description || "");
        form.setValue("costPrice", Number(existing.product.costPrice || 0));
        form.setValue("sellingPrice", Number(existing.price || 0));
        form.setValue("quantity", existing.inventory?.quantity || 0);
        setSkuStatus("scanned");
    } else {
        setSkuStatus(isScanMode ? "scanned" : "auto");
    }
  };

  const validateTab = async (tab: string) => {
    if (tab === "product") {
        const fields: (keyof ProductFormValues)[] = ["name", "categoryId", "quantity"];
        const result = await form.trigger(fields);
        if (!result) {
            toast.error("Please fill Name, Category and Quantity to proceed");
            return false;
        }
    }
    if (tab === "pricing") {
        const fields: (keyof ProductFormValues)[] = ["costPrice", "sellingPrice"];
        const result = await form.trigger(fields);
        if (!result) {
            toast.error("Cost Price and Selling Price are mandatory");
            return false;
        }
    }
    if (tab === "media" && images.length === 0) {
        toast.error("At least one product image is required");
        return false;
    }
    return true;
  };

  const handleTabChange = async (value: string) => {
    const order = ["product", "media", "pricing", "logistics"];
    const currentIndex = order.indexOf(activeTab);
    const targetIndex = order.indexOf(value);
    
    // If moving forward, validate all tabs in between
    if (targetIndex > currentIndex) {
        for (let i = currentIndex; i < targetIndex; i++) {
            const isValid = await validateTab(order[i]);
            if (!isValid) return;
        }
    }
    setActiveTab(value);
  };

  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Compression failed"));
            }, "image/jpeg", 0.75
          );
        };
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const compressedBlob = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressedBlob, "compressed_image.jpg");
      const result = await uploadImageAction(formData);
      if (result.success && (result as any).url) {
        setImages((prev) => [...prev, { url: (result as any).url, publicId: (result as any).publicId }]);
        toast.success("Optimized image uploaded");
      } else {
        toast.error(result.error || "Upload failed");
      }
    } catch (error) {
      toast.error("Upload error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsAddingCategory(true);
    const result = await createCategoryAction(newCategoryName);
    if (result.success) {
      setCategories(prev => [...prev, result.data]);
      form.setValue("categoryId", result.data.id);
      setNewCategoryName("");
      setIsCategoryDialogOpen(false);
      toast.success("New category added");
    } else {
      toast.error(result.error || "Failed to add category");
    }
    setIsAddingCategory(false);
  };

  const handleAddWarehouse = async () => {
    if (!newWhName.trim()) return;
    setIsAddingWarehouse(true);
    const result = await createWarehouseAction({ name: newWhName, location: newWhLoc });
    if (result.success) {
      setWarehouses(prev => [...prev, result.data]);
      form.setValue("warehouseId", result.data.id);
      setNewWhName("");
      setNewWhLoc("");
      setIsWarehouseDialogOpen(false);
      toast.success("New logistics hub registered");
    } else {
      toast.error(result.error);
    }
    setIsAddingWarehouse(false);
  };

  async function onSubmit(values: ProductFormValues) {
    setIsSubmitting(true);
    try {
      if (images.length === 0) {
        toast.error("At least one product image is required to commit to catalog");
        setIsSubmitting(false);
        return;
      }
      const variant = {
        size: values.size,
        color: values.color,
        sku: values.sku.toUpperCase(),
        price: values.sellingPrice,
        stock: values.quantity,
      };

      const payload = {
        ...values,
        tax: values.hasTax ? values.tax : 0,
        baseSku: values.sku.split("-")[0] || values.sku,
        variants: [variant],
        images,
      };

      const result = isEditing 
        ? await updateProductAction(initialData.id, payload)
        : await createProductAction(payload);
        
      if (result.success) {
        toast.success(`Product ${isEditing ? "updated" : "created"}`);
        onClose();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex w-full bg-brand-navy/[0.04] p-1.5 rounded-2xl h-14 border border-brand-navy/10 mb-8 overflow-x-auto scrollbar-hide">
            <TabsTrigger value="product" className="flex-1 rounded-xl font-black text-[11px] uppercase tracking-widest gap-2 data-[state=active]:bg-brand-navy data-[state=active]:text-white transition-all shadow-sm">
              <LayoutGrid className="size-4" /> INFO
            </TabsTrigger>
            <TabsTrigger value="media" className="flex-1 rounded-xl font-black text-[11px] uppercase tracking-widest gap-2 data-[state=active]:bg-brand-navy data-[state=active]:text-white transition-all shadow-sm">
              <Images className="size-4" /> MEDIA
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex-1 rounded-xl font-black text-[11px] uppercase tracking-widest gap-2 data-[state=active]:bg-brand-navy data-[state=active]:text-white transition-all shadow-sm">
              <Banknote className="size-4" /> FINANCE
            </TabsTrigger>
            <TabsTrigger value="logistics" className="flex-1 rounded-xl font-black text-[11px] uppercase tracking-widest gap-2 data-[state=active]:bg-brand-navy data-[state=active]:text-white transition-all shadow-sm">
              <Warehouse className="size-4" /> STORAGE
            </TabsTrigger>
          </TabsList>

          <TabsContent value="product" className="space-y-6 animate-in fade-in-50 duration-500 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5 p-7 bg-brand-navy/[0.02] border border-brand-navy/10 rounded-[2.5rem] shadow-inner">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Product Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Midnight Silk Blouse" className="h-12 bg-white border-2 border-brand-navy/5 rounded-xl font-bold text-brand-navy focus:border-brand-navy/20 transition-all" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="space-y-2">
                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Category Architecture</FormLabel>
                    <div className="flex gap-3">
                        <FormField control={form.control} name="categoryId" render={({ field }) => (
                          <FormItem className="flex-1">
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-white border-2 border-brand-navy/5 rounded-xl font-bold text-brand-navy">
                                  <SelectValue placeholder="Select Category">
                                    {categories.find(c => c.id === field.value)?.name}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="glass-card border-none rounded-2xl p-1 shadow-2xl">
                                {categories.length === 0 ? (
                                    <div className="p-4 text-center text-xs font-bold text-brand-navy/30">Loading Intelligence...</div>
                                ) : (
                                    categories.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id} className="rounded-xl h-11 font-bold focus:bg-brand-navy/5">{cat.name}</SelectItem>
                                    ))
                                )}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                            <DialogTrigger render={<Button type="button" variant="outline" className="size-12 shrink-0 rounded-xl border-2 border-brand-navy/10 hover:bg-brand-navy hover:text-white" />}>
                                <Plus className="size-5" />
                            </DialogTrigger>
                            <DialogContent className="max-w-xs glass-card border-none p-10 rounded-[3rem] shadow-2xl">
                                <h4 className="text-sm font-black uppercase tracking-widest mb-6 text-brand-navy">New Category</h4>
                                <Input placeholder="Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="h-12 bg-muted/30 border-none rounded-xl mb-6 font-bold" />
                                <Button onClick={handleAddCategory} disabled={isAddingCategory} className="w-full bg-brand-navy text-white h-12 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl">{isAddingCategory ? "Syncing..." : "Confirm"}</Button>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Product Description</FormLabel>
                    <FormControl><Textarea placeholder="Material, fit, and seasonal inspiration..." className="resize-none h-32 bg-white border-2 border-brand-navy/5 rounded-xl font-medium p-4 text-sm leading-relaxed text-brand-navy" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="space-y-5 p-7 bg-brand-navy/[0.02] border border-brand-navy/10 rounded-[2.5rem] shadow-inner">
                <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Product ID (Barcode/SKU)</FormLabel>
                        <div className="flex gap-2">
                            {skuStatus === "syncing" && <span className="text-[9px] font-black text-blue-500 animate-pulse uppercase tracking-widest">Syncing Intelligence...</span>}
                            {skuStatus === "scanned" && <span className="text-[9px] font-black text-emerald-500 flex items-center gap-1 uppercase tracking-widest"><ShieldCheck className="size-3" /> Record Verified</span>}
                            <button type="button" onClick={() => {
                                setIsScanMode(!isScanMode);
                                if (isScanMode) generateAutoSku();
                            }} className={cn("text-[10px] font-black uppercase px-3 py-1 rounded-full border-2 transition-all flex items-center gap-2", isScanMode ? "bg-brand-navy text-white border-brand-navy" : "text-brand-navy border-brand-navy/10 hover:border-brand-navy/40")}>
                                {isScanMode ? <RotateCcw className="size-3" /> : <Barcode className="size-3" />}
                                {isScanMode ? "Reset to Auto" : "Manual Scan"}
                            </button>
                        </div>
                    </div>
                    <FormControl>
                        <div className="relative group">
                            <Input placeholder={isScanMode ? "Scan barcode now..." : "Auto-generating..."} readOnly={!isScanMode} className={cn("h-14 bg-white border-2 rounded-xl font-black text-brand-navy transition-all pl-12", isScanMode ? "border-brand-navy shadow-lg" : "border-brand-navy/5 opacity-80 cursor-not-allowed")} {...field} onChange={(e) => {
                                field.onChange(e);
                                if (isScanMode) handleSkuLookup(e.target.value);
                            }} />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                {isScanMode ? <Barcode className="size-5 text-brand-navy" /> : <ShieldCheck className="size-5 text-brand-navy/20" />}
                            </div>
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="color" render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Color</FormLabel>
                        <FormControl><Input placeholder="e.g. Navy" className="h-12 bg-white border-2 border-brand-navy/5 rounded-xl font-bold text-brand-navy" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="size" render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Size</FormLabel>
                        <FormControl><Input placeholder="e.g. XL" className="h-12 bg-white border-2 border-brand-navy/5 rounded-xl font-bold text-brand-navy" {...field} /></FormControl>
                      </FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Quantity in Stock</FormLabel>
                    <FormControl><Input type="number" placeholder="0" className="h-12 bg-white border-2 border-brand-navy/5 rounded-xl font-bold text-brand-navy" {...field} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="tags" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Search Tags</FormLabel>
                    <FormControl><Input placeholder="luxury, summer, silk" className="h-12 bg-white border-2 border-brand-navy/5 rounded-xl font-bold text-brand-navy" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6 animate-in slide-in-from-right-10 duration-500 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="space-y-6 p-10 bg-brand-navy/[0.02] border border-brand-navy/10 rounded-[3rem] shadow-inner">
                <FormField control={form.control} name="costPrice" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Cost Price (₦)</FormLabel>
                    <FormControl><Input type="number" className="h-16 bg-white border-2 border-brand-navy/5 rounded-2xl font-black text-brand-navy text-2xl" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="sellingPrice" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Selling Price (₦)</FormLabel>
                    <FormControl><Input type="number" className="h-16 bg-white border-2 border-brand-navy/20 rounded-2xl font-black text-brand-navy text-2xl shadow-sm focus:border-brand-navy transition-all" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="space-y-6 p-10 bg-brand-navy/[0.02] border border-brand-navy/10 rounded-[3rem] shadow-inner">
                <FormField control={form.control} name="hasTax" render={({ field }) => (
                  <FormItem className="flex items-center gap-4 space-y-0 mb-4 bg-white/50 p-4 rounded-2xl border border-brand-navy/5">
                    <FormControl>
                        <button type="button" onClick={() => field.onChange(!field.value)} className={cn("w-12 h-6 rounded-full transition-all relative shrink-0", field.value ? "bg-brand-navy" : "bg-brand-navy/20")}>
                            <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm", field.value ? "left-7" : "left-1")} />
                        </button>
                    </FormControl>
                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy cursor-pointer">Apply Sales Tax (%)</FormLabel>
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="tax" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormControl><Input type="number" disabled={!form.watch("hasTax")} className={cn("h-16 bg-white border-2 rounded-2xl font-black text-brand-navy text-2xl transition-all", !form.watch("hasTax") ? "opacity-30 border-brand-navy/5" : "border-brand-navy/5")} {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="discount" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Fixed Discount (₦)</FormLabel>
                    <FormControl><Input type="number" className="h-16 bg-white border-2 border-brand-navy/5 rounded-2xl font-bold text-brand-navy text-xl" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logistics" className="space-y-6 animate-in slide-in-from-left-10 duration-500 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-10 p-12 bg-brand-navy/[0.02] border border-brand-navy/10 rounded-[4rem]">
                <div className="flex justify-between items-start">
                    <div className="space-y-3">
                        <h3 className="text-3xl font-black tracking-tighter text-brand-navy uppercase">Logistics Intake</h3>
                        <p className="text-sm text-brand-navy/60 font-bold uppercase tracking-widest">Select physical storage destination</p>
                    </div>
                    <Dialog open={isWarehouseDialogOpen} onOpenChange={setIsWarehouseDialogOpen}>
                        <DialogTrigger render={<Button type="button" variant="outline" className="size-12 rounded-2xl border-2 border-brand-navy/10 hover:bg-brand-navy hover:text-white" />}>
                            <Plus className="size-5" />
                        </DialogTrigger>
                        <DialogContent className="max-w-sm glass-card border-none p-10 rounded-[3rem] shadow-2xl">
                            <h4 className="text-sm font-black uppercase tracking-widest mb-6 text-brand-navy">Register Hub</h4>
                            <div className="space-y-4 mb-8">
                                <Input placeholder="Hub Name (e.g. Lekki North)" value={newWhName} onChange={(e) => setNewWhName(e.target.value)} className="h-12 bg-muted/30 border-none rounded-xl font-bold" />
                                <Input placeholder="Geographic Location" value={newWhLoc} onChange={(e) => setNewWhLoc(e.target.value)} className="h-12 bg-muted/30 border-none rounded-xl font-bold" />
                            </div>
                            <Button onClick={handleAddWarehouse} disabled={isAddingWarehouse} className="w-full bg-brand-navy text-white h-14 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl">{isAddingWarehouse ? "Registering..." : "Confirm Deployment"}</Button>
                        </DialogContent>
                    </Dialog>
                </div>
                
                <FormField control={form.control} name="warehouseId" render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-[12px] font-black uppercase tracking-widest text-brand-navy">Active Storage Hub</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                            <SelectTrigger className="h-16 bg-white border-2 border-brand-navy/20 rounded-2xl font-black text-xl px-8 text-brand-navy shadow-sm">
                                <SelectValue placeholder="Select Warehouse Hub" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-card border-none rounded-[2rem] p-4 shadow-2xl">
                            <SelectItem value="none" className="rounded-xl h-14 font-black focus:bg-brand-navy/5 px-8 uppercase text-muted-foreground/40 italic">
                                NO PHYSICAL HUB (VIRTUAL ONLY)
                            </SelectItem>
                            {warehouses.length > 0 && warehouses.map((wh) => (
                                <SelectItem key={wh.id} value={wh.id} className="rounded-xl h-14 font-black focus:bg-brand-navy/5 px-8 uppercase">
                                    {wh.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                {form.watch("warehouseId") && (
                    <div className="space-y-5 px-2 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black uppercase tracking-widest text-brand-navy/60">Hub Operating Capacity</span>
                            <span className="text-[12px] font-black text-brand-navy">
                                {Math.floor(Math.random() * (90 - 40) + 40)}% FULL
                            </span>
                        </div>
                        <div className="h-3 w-full bg-brand-navy/10 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-brand-navy w-[65%] rounded-full shadow-lg transition-all duration-1000" />
                        </div>
                    </div>
                )}
              </div>

              <div className="relative aspect-video rounded-[4rem] overflow-hidden border-4 border-white shadow-2xl group bg-muted/20">
                {form.watch("warehouseId") ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy to-transparent z-10 opacity-70" />
                    <div className="absolute bottom-12 left-12 z-20 text-white">
                        <h4 className="text-4xl font-black tracking-tighter uppercase">
                            {warehouses.find(w => w.id === form.watch("warehouseId"))?.name}
                        </h4>
                        <p className="text-[12px] font-black opacity-60 mt-3 uppercase tracking-[0.4em]">
                            {warehouses.find(w => w.id === form.watch("warehouseId"))?.location || "ZONE A-12 • BATCH ALPHA-01"}
                        </p>
                    </div>
                    <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000" className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-1000" alt="Warehouse" />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-brand-navy/20 gap-4">
                    <HardDrive className="size-20" />
                    <span className="font-black text-xs uppercase tracking-widest">Select Storage Destination</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-6 animate-in zoom-in-95 duration-500 outline-none">
            <div className="max-w-4xl mx-auto space-y-10 py-4">
                <div className="text-center space-y-2">
                    <h3 className="text-4xl font-black tracking-tighter text-brand-navy uppercase">Visual Assets</h3>
                    <p className="text-[10px] text-brand-navy/40 font-black uppercase tracking-[0.6em]">Studio Intake Module</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-[3/4] rounded-[2rem] overflow-hidden border border-brand-navy/10 bg-white shadow-xl group transition-all hover:scale-[1.02]">
                        <img src={img.url} alt="Preview" className="object-cover w-full h-full transition-all duration-700" />
                        <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-4 right-4 bg-brand-navy text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-rose-600"><X className="h-4 w-4" /></button>
                        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-brand-navy/20 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    ))}
                    {images.length < 4 && (
                      <label className="aspect-[3/4] border-2 border-dashed border-brand-navy/10 rounded-[2rem] flex flex-col items-center justify-center gap-6 text-brand-navy/20 hover:bg-brand-navy/[0.02] hover:border-brand-navy/30 transition-all cursor-pointer group shadow-inner">
                        {isUploading ? ( <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-navy border-t-transparent" /> ) : (
                          <>
                            <div className="size-20 rounded-[1.5rem] bg-brand-navy/[0.03] flex items-center justify-center group-hover:bg-brand-navy/5 transition-all">
                                <Images className="h-8 w-8 opacity-20 group-hover:opacity-100" />
                            </div>
                            <div className="text-center space-y-1">
                                <span className="block text-[11px] font-black uppercase tracking-widest text-brand-navy">Add Media</span>
                                <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">Max 4 Units</span>
                            </div>
                          </>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                      </label>
                    )}
                </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-10 border-t-2 border-brand-navy/5">
          <div className="flex gap-4">
            {activeTab !== "product" && (
                <Button variant="ghost" onClick={() => {
                    const order = ["product", "media", "pricing", "logistics"];
                    setActiveTab(order[order.indexOf(activeTab) - 1]);
                }} type="button" className="text-xs font-black uppercase tracking-[0.3em] h-14 px-10 rounded-2xl hover:bg-brand-navy/5 text-brand-navy transition-all">BACK</Button>
            )}
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={onClose} type="button" className="text-xs font-black uppercase tracking-[0.3em] h-14 px-12 rounded-2xl hover:bg-rose-500/5 text-rose-600 transition-all">CANCEL</Button>
            {activeTab !== "logistics" ? (
                <Button onClick={() => {
                    const order = ["product", "media", "pricing", "logistics"];
                    handleTabChange(order[order.indexOf(activeTab) + 1]);
                }} type="button" className="bg-brand-navy text-white font-black text-xs uppercase tracking-[0.3em] h-16 px-16 rounded-2xl shadow-2xl shadow-brand-navy/20 active:scale-95 transition-all">CONTINUE</Button>
            ) : (
                <Button type="submit" disabled={isSubmitting} className="bg-brand-navy text-white font-black text-xs uppercase tracking-[0.4em] h-16 px-20 rounded-2xl shadow-[0_0_40px_rgba(var(--brand-navy-rgb),0.5)] active:scale-95 transition-all">
                  {isSubmitting ? "SAVING..." : "SAVE"}
                  <Save className="ml-5 h-6 w-6" />
                </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

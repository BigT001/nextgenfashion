"use client";

import { useState, useEffect, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Resolver } from "react-hook-form";
import { getProductPriceRequirementSetting } from "@/modules/settings/actions/settings.actions";
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
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/modules/products/actions/product.actions";
import { useSession } from "next-auth/react";
import {
  getWarehousesAction,
  createWarehouseAction,
  deleteWarehouseAction
} from "@/modules/inventory/actions/warehouse.actions";

import { toast } from "sonner";
import { Barcode, RotateCcw, ShieldCheck, AlertCircle, MapPin, HardDrive } from "lucide-react";
import { VariantBuilder, type Variant } from "./variant-builder";

const productSchema = z.object({
  name: z.string().min(2, "Product Name is required"),
  description: z.string().optional(),
  categoryIds: z.array(z.string()).min(1, "At least one category is required"),
  sku: z.string().min(1, "Product ID is required"),
  tags: z.string().optional(),
  costPrice: z.coerce.number().optional(),
  sellingPrice: z.coerce.number().optional(),
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
  const [priceFieldsRequired, setPriceFieldsRequired] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [images, setImages] = useState<{ id: string; url: string; publicId: string; status?: "idle" | "uploading" | "uploaded" | "failed" }[]>(
    // Pre-populate with existing images when editing
    initialData?.images?.map((url: string) => ({ id: url, url, publicId: url, status: "uploaded" as const })) ?? []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("product");
  const [isScanMode, setIsScanMode] = useState(false);
  const [skuStatus, setSkuStatus] = useState<"auto" | "scanned" | "conflict" | "syncing">("auto");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [isUpdatingCategoryId, setIsUpdatingCategoryId] = useState<string | null>(null);
  const [isDeletingCategoryId, setIsDeletingCategoryId] = useState<string | null>(null);
  const { data: session } = useSession();
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);


  useEffect(() => {
    async function fetchData() {
      try {
        const { getCachedCategories, getCachedWarehouses } = await import("@/lib/client-cache");
        const catResult = await getCachedCategories(getCategoriesAction);
        if (catResult.success) setCategories(catResult.data || []);

        const whResult = await getCachedWarehouses(getWarehousesAction);
        if (whResult.success) setWarehouses(whResult.data || []);
      } catch (e) {
        // fallback
        const catResult = await getCategoriesAction();
        if (catResult.success) setCategories(catResult.data || []);
        const whResult = await getWarehousesAction();
        if (whResult.success) setWarehouses(whResult.data || []);
      }

      const enabled = await getProductPriceRequirementSetting();
      setPriceFieldsRequired(enabled);
    }
    fetchData();
  }, []);

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [newWhName, setNewWhName] = useState("");
  const [newWhLoc, setNewWhLoc] = useState("");
  const [isAddingWarehouse, setIsAddingWarehouse] = useState(false);
  const fileInputId = useId();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || "",
      categoryIds: (initialData.categories && Array.isArray(initialData.categories)) ? initialData.categories.map((c: any) => c.id) : (initialData.categoryId ? [initialData.categoryId] : []),
      sku: initialData.sku || initialData.variants?.[0]?.sku || initialData.ProductVariant?.[0]?.sku || "",
      tags: initialData.tags || "",
      costPrice: initialData.costPrice || 0,
      sellingPrice: initialData.basePrice || initialData.price || 0,
      promoPrice: initialData.promoPrice || 0,
      discount: initialData.discount || 0,
      tax: initialData.tax || 7.5,
      hasTax: !!initialData.tax && initialData.tax > 0,
      warehouseId: initialData.variants?.[0]?.inventory?.warehouseId || initialData.ProductVariant?.[0]?.Inventory?.warehouseId || "",
    } : {
      name: "",
      description: "",
      categoryIds: [],
      sku: "",
      tags: "",
      costPrice: undefined,
      sellingPrice: undefined,
      promoPrice: undefined,
      discount: undefined,
      tax: 7.5,
      hasTax: false,
      warehouseId: "",
    },
  });

  // Initialize variants from existing data
  useEffect(() => {
    const rawVariants = initialData?.variants ?? initialData?.ProductVariant ?? [];
    if (rawVariants && rawVariants.length > 0) {
      const initialVariants: Variant[] = rawVariants.map((v: any, idx: number) => ({
        id: v.id || `var-${idx}`,
        color: v.color || "",
        size: v.size || "",
        sku: v.sku,
        price: v.price !== undefined ? Number(v.price) : undefined,
        quantity: v.inventory?.quantity || v.Inventory?.quantity || 0,
      }));
      setVariants(initialVariants);
    }
  }, [initialData]);

  const generateAutoSku = () => {
    if (isScanMode || isEditing) return;
    const name = form.getValues("name");
    const categoryIds = form.getValues("categoryIds") || [];
    const categoryId = categoryIds[0];
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
      if (name === "name" || name === "categoryIds") {
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
      const existingCatIds = existing.product?.categories ? existing.product.categories.map((c:any) => c.id) : (existing.product?.categoryId ? [existing.product.categoryId] : []);
      form.setValue("categoryIds", existingCatIds);
      form.setValue("description", existing.product.description || "");
      form.setValue("costPrice", Number(existing.product.costPrice || 0));
      form.setValue("sellingPrice", Number(existing.price || 0));
      setSkuStatus("scanned");
    } else {
      setSkuStatus(isScanMode ? "scanned" : "auto");
    }
  };

  const validatePricingFields = async () => {
    form.clearErrors(["costPrice", "sellingPrice"]);

    if (!priceFieldsRequired) {
      return true;
    }

    const costPrice = form.getValues("costPrice");
    const sellingPrice = form.getValues("sellingPrice");
    let valid = true;

    if (costPrice === undefined || costPrice === null || Number(costPrice) <= 0) {
      form.setError("costPrice", { type: "manual", message: "Cost Price is required" });
      valid = false;
    }

    if (sellingPrice === undefined || sellingPrice === null || Number(sellingPrice) <= 0) {
      form.setError("sellingPrice", { type: "manual", message: "Selling Price is required" });
      valid = false;
    }

    if (!valid) {
      toast.error("Cost Price and Selling Price are mandatory");
    }

    return valid;
  };

  const validateTab = async (tab: string) => {
    if (tab === "product") {
      const fields: (keyof ProductFormValues)[] = ["name", "categoryIds"];
      const result = await form.trigger(fields);
      if (!result) {
        toast.error("Please fill Name and Category to proceed");
        return false;
      }
      if (variants.length === 0) {
        toast.error("Please add at least one variant (color & size combination)");
        return false;
      }
    }
    if (tab === "pricing") {
      return await validatePricingFields();
    }
    return true;
  };

  const handleTabChange = async (value: string) => {
    const order = ["product", "media", "pricing"];
    const currentIndex = order.indexOf(activeTab);
    const targetIndex = order.indexOf(value);

    // If moving forward, validate all tabs in between
    if (targetIndex > currentIndex) {
      for (let i = currentIndex; i < targetIndex; i++) {
        const isValid = await validateTab(order[i]);
        if (!isValid) return;
      }
    }
    // Explicitly prevent any form submission during tab navigation
    setActiveTab(value);
  };

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

    // Enforce max 5 images per product
    if (images.length >= 5) {
      toast.error("Maximum 5 images per product.");
      return;
    }

    // Non-blocking upload: create local preview and start background upload
    const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const previewUrl = URL.createObjectURL(file);
    setImages((prev) => [...prev, { id, url: previewUrl, publicId: "", status: "uploading" }]);

    try {
      const compressedBlob = await compressImage(file);
      const skuValue = form.getValues("sku") || initialData?.sku || `UNNAMED-${Date.now()}`;
      const normalizedSku = skuValue
        .toString()
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .substring(0, 60)
        .toUpperCase();
      const publicId = initialData?.id
        ? `product-${normalizedSku}-${initialData.id.slice(0, 8)}-${Date.now()}`
        : `product-${normalizedSku}-${Date.now()}`;

      const compressedFile = new File([compressedBlob], "compressed_image.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("publicId", publicId);

      // Start upload but keep UI interactive
      (async () => {
        try {
          const result = await uploadImageAction(formData);
          if (result.success && (result as any).url) {
            setImages((prev) => prev.map(img => img.id === id ? { ...img, url: (result as any).url, publicId: (result as any).publicId, status: "uploaded" } : img));
            toast.success("Image uploaded");
          } else {
            setImages((prev) => prev.map(img => img.id === id ? { ...img, status: "failed" } : img));
            toast.error(result.error || "Upload failed");
          }
        } catch (err) {
          setImages((prev) => prev.map(img => img.id === id ? { ...img, status: "failed" } : img));
          toast.error("Upload error");
        } finally {
          // revoke preview URL after some time
          setTimeout(() => URL.revokeObjectURL(previewUrl), 2000);
        }
      })();
    } catch (error) {
      setImages((prev) => prev.map(img => img.id === id ? { ...img, status: "failed" } : img));
      toast.error("Compression error");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsAddingCategory(true);
    const result = await createCategoryAction(newCategoryName);
    if (result.success) {
      setCategories(prev => [...prev, result.data]);
      // append new category id to categoryIds array
      const current = form.getValues("categoryIds") || [];
      form.setValue("categoryIds", Array.from(new Set([...current, result.data.id])));
      setNewCategoryName("");
      setIsCategoryDialogOpen(false);
      toast.success("New category added");
    } else {
      toast.error(result.error || "Failed to add category");
    }
    setIsAddingCategory(false);
  };

  const handleUpdateCategory = async (categoryId: string, name: string) => {
    if (!name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    setIsUpdatingCategoryId(categoryId);
    const result = await updateCategoryAction(categoryId, name.trim());
    if (result.success) {
      setCategories((prev) => prev.map((cat) => cat.id === categoryId ? result.data : cat));
      setEditingCategoryId(null);
      setEditingCategoryName("");
      toast.success("Category name updated");
    } else {
      toast.error(result.error || "Failed to update category");
    }
    setIsUpdatingCategoryId(null);
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
    console.log("[ProductForm] onSubmit triggered", { isEditing, variantsLength: variants.length, imageCount: images.length });
    setIsSubmitting(true);
    try {
      if (variants.length === 0) {
        toast.error("Add at least one variant before saving");
        setIsSubmitting(false);
        return;
      }

      const effectivePriceRequirement = await getProductPriceRequirementSetting();
      if (effectivePriceRequirement) {
        const pricingValid = await validatePricingFields();
        if (!pricingValid) {
          setIsSubmitting(false);
          return;
        }
      }

      const uploadingImages = images.filter(img => img.status === "uploading");
      const failedImages = images.filter(img => img.status === "failed");

      if (uploadingImages.length > 0) {
        toast.error("Please wait for all image uploads to finish before saving.");
        setIsSubmitting(false);
        return;
      }

      if (failedImages.length > 0) {
        toast.error("Please remove or retry failed image uploads before saving.");
        setIsSubmitting(false);
        return;
      }

      // Build variants payload from the VariantBuilder data
      const variantPayload = variants.map(v => ({
        id: v.id,
        size: v.size,
        color: v.color,
        sku: v.sku.toUpperCase(),
        price: v.price,
        stock: v.quantity,
      }));

      // Only include successfully uploaded image URLs (filter out previews/failures)
      const uploadedImageUrls = images
        .filter(img => img.status === "uploaded" && img.url.startsWith("http"))
        .map(img => img.url);

      const payload = {
        ...values,
        costPrice: values.costPrice && Number(values.costPrice) > 0 ? values.costPrice : undefined,
        sellingPrice: values.sellingPrice && Number(values.sellingPrice) > 0 ? values.sellingPrice : undefined,
        tax: values.hasTax ? values.tax : 0,
        baseSku: values.sku.split("-")[0] || values.sku,
        variants: variantPayload,
        images: uploadedImageUrls,
      };

      console.log(`[ProductForm] Submitting ${isEditing ? "UPDATE" : "CREATE"} with ${variants.length} variant(s):`, payload);

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
      console.error("[ProductForm] onSubmit error:", error);
      toast.error("Unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex w-full bg-brand-navy/[0.04] p-1.5 rounded-2xl h-12 border border-brand-navy/10 mb-6 overflow-x-auto scrollbar-hide">
            <TabsTrigger value="product" className="flex-1 rounded-xl font-black text-[11px] uppercase tracking-widest gap-2 data-[state=active]:bg-brand-navy data-[state=active]:text-white transition-all shadow-sm">
              <LayoutGrid className="size-4" /> INFO
            </TabsTrigger>
            <TabsTrigger value="media" className="flex-1 rounded-xl font-black text-[11px] uppercase tracking-widest gap-2 data-[state=active]:bg-brand-navy data-[state=active]:text-white transition-all shadow-sm">
              <Images className="size-4" /> MEDIA
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex-1 rounded-xl font-black text-[11px] uppercase tracking-widest gap-2 data-[state=active]:bg-brand-navy data-[state=active]:text-white transition-all shadow-sm">
              <Banknote className="size-4" /> FINANCE
            </TabsTrigger>
          </TabsList>

          <TabsContent value="product" className="space-y-4 animate-in fade-in-50 duration-500 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4 p-5 bg-brand-navy/[0.02] border border-brand-navy/10 rounded-3xl shadow-inner">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Product Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Midnight Silk Blouse" className="h-10 bg-white border-2 border-brand-navy/5 rounded-xl font-bold text-brand-navy focus:border-brand-navy/20 transition-all" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Product Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Write a short description for the product..." className="min-h-[140px] resize-none bg-white border-2 border-brand-navy/5 rounded-3xl font-medium text-brand-navy focus:border-brand-navy/20 transition-all" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="space-y-2">
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <FormField control={form.control} name="categoryIds" render={({ field }) => (
                      <FormItem className="flex-1 space-y-2 relative">
                        <div className="flex justify-between items-center px-1">
                          <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Product Category</FormLabel>
                          <div className="flex items-center gap-2">
                            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                              <DialogTrigger className="text-[9px] font-black uppercase px-3 py-1 rounded-full bg-brand-navy text-white hover:bg-brand-navy/90 transition-all flex items-center gap-2">
                                <Plus className="size-3" />
                                New
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <div className="space-y-4">
                                  <h3 className="text-sm font-bold">Add New Category</h3>
                                  <Input
                                    placeholder="e.g. Women's Wear"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setIsCategoryDialogOpen(false)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="button"
                                      disabled={isAddingCategory}
                                      onClick={handleAddCategory}
                                    >
                                      {isAddingCategory ? "Adding..." : "Add"}
                                    </Button>
                                  </div>

                                  {/* Existing categories with delete option for admins */}
                                  {categories.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Existing Categories</h4>
                                      <div className="space-y-2">
                                        {categories.map((cat) => (
                                          <div key={cat.id} className="flex items-center justify-between gap-3 p-2 rounded-md border border-border/50 bg-white">
                                            <div className="flex-1">
                                              {editingCategoryId === cat.id ? (
                                                <Input
                                                  value={editingCategoryName}
                                                  onChange={(e) => setEditingCategoryName(e.target.value)}
                                                  className="h-10"
                                                />
                                              ) : (
                                                <div className="text-sm font-medium">{cat.name}</div>
                                              )}
                                            </div>
                                            {session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN" ? (
                                              <div className="flex items-center gap-2">
                                                {editingCategoryId === cat.id ? (
                                                  <>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => {
                                                        setEditingCategoryId(null);
                                                        setEditingCategoryName("");
                                                      }}
                                                    >
                                                      Cancel
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      disabled={isUpdatingCategoryId === cat.id}
                                                      onClick={() => handleUpdateCategory(cat.id, editingCategoryName)}
                                                    >
                                                      {isUpdatingCategoryId === cat.id ? "Saving..." : <Save className="size-4" />}
                                                    </Button>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={() => {
                                                        setEditingCategoryId(cat.id);
                                                        setEditingCategoryName(cat.name);
                                                      }}
                                                    >
                                                      Edit
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="text-rose-600" onClick={async () => {
                                                      if (!confirm(`Delete category '${cat.name}'? This cannot be undone.`)) return;
                                                      try {
                                                        setIsDeletingCategoryId(cat.id);
                                                        const res = await deleteCategoryAction(cat.id);
                                                        if (res.success) {
                                                          setCategories((prev) => prev.filter(c => c.id !== cat.id));
                                                          toast.success("Category deleted");
                                                        } else {
                                                          toast.error(res.error || "Failed to delete category");
                                                        }
                                                      } catch (e) {
                                                        console.error(e);
                                                        toast.error("Failed to delete category");
                                                      } finally {
                                                        setIsDeletingCategoryId(null);
                                                      }
                                                    }}>
                                                      {isDeletingCategoryId === cat.id ? "Deleting..." : <Trash2 className="size-4" />}
                                                    </Button>
                                                  </>
                                                )}
                                              </div>
                                            ) : null}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>

                        {/* Dropdown trigger */}
                        <button type="button" onClick={() => setCategoryDropdownOpen(v => !v)} className="w-full text-left h-10 bg-white border-2 border-brand-navy/5 rounded-xl px-4 flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            {Array.isArray(field.value) && field.value.length > 0 ? `${field.value.length} selected` : "Select categories"}
                          </div>
                          <div className="text-xs text-muted-foreground">▾</div>
                        </button>

                        {categoryDropdownOpen && (
                          <div className="absolute z-50 mt-2 w-full bg-popover border border-border/20 rounded-lg shadow-lg max-h-56 overflow-auto p-3">
                            <div className="space-y-2">
                              {categories.map((category) => {
                                const checked = Array.isArray(field.value) && field.value.includes(category.id);
                                return (
                                  <label key={category.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-popover/50">
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4"
                                      checked={checked}
                                      onChange={(e) => {
                                        const current = Array.isArray(field.value) ? [...field.value] : [];
                                        if (e.target.checked) {
                                          field.onChange(Array.from(new Set([...current, category.id])));
                                        } else {
                                          field.onChange(current.filter((id) => id !== category.id));
                                        }
                                      }}
                                    />
                                    <span className="text-sm">{category.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <FormMessage />
                      </FormItem>
                    )} />


                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5 bg-brand-navy/[0.02] border border-brand-navy/10 rounded-3xl shadow-inner">
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
                        <Input placeholder={isScanMode ? "Scan barcode now..." : "Auto-generating..."} readOnly={!isScanMode} className={cn("h-10 bg-white border-2 rounded-xl font-black text-brand-navy transition-all pl-12", isScanMode ? "border-brand-navy shadow-md" : "border-brand-navy/5 opacity-80 cursor-not-allowed")} {...field} onChange={(e) => {
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
                  <FormField control={form.control} name="tags" render={({ field }) => (
                    <FormItem className="col-span-2 space-y-2">
                      <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Search Tags</FormLabel>
                      <FormControl><Input placeholder="luxury, summer, silk" className="h-10 bg-white border-2 border-brand-navy/5 rounded-xl font-bold text-brand-navy" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <VariantBuilder
                  variants={variants}
                  onVariantsChange={setVariants}
                  productName={form.getValues("name")}
                  costPrice={form.getValues("costPrice")}
                  sellingPrice={form.getValues("sellingPrice")}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4 animate-in slide-in-from-right-10 duration-500 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <div className="space-y-4 p-6 bg-brand-navy/[0.02] border border-brand-navy/10 rounded-3xl shadow-inner">
                <FormField control={form.control} name="costPrice" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Cost Price (₦)</FormLabel>
                      {!priceFieldsRequired && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Optional</span>
                      )}
                    </div>
                    <FormControl><Input type="number" placeholder={priceFieldsRequired ? "Required" : "Optional"} className="h-12 bg-white border-2 border-brand-navy/5 rounded-xl font-black text-brand-navy text-xl" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sellingPrice" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Selling Price (₦)</FormLabel>
                      {!priceFieldsRequired && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Optional</span>
                      )}
                    </div>
                    <FormControl><Input type="number" placeholder={priceFieldsRequired ? "Required" : "Optional"} className="h-12 bg-white border-2 border-brand-navy/20 rounded-xl font-black text-brand-navy text-xl shadow-sm focus:border-brand-navy transition-all" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="space-y-4 p-6 bg-brand-navy/[0.02] border border-brand-navy/10 rounded-3xl shadow-inner">
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
                    <FormControl><Input type="number" disabled={!form.watch("hasTax")} className={cn("h-12 bg-white border-2 rounded-xl font-black text-brand-navy text-xl transition-all", !form.watch("hasTax") ? "opacity-30 border-brand-navy/5" : "border-brand-navy/5")} {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="discount" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Fixed Discount (₦)</FormLabel>
                    <FormControl><Input type="number" className="h-12 bg-white border-2 border-brand-navy/5 rounded-xl font-bold text-brand-navy text-lg" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logistics" className="space-y-8 animate-in slide-in-from-left-10 duration-500 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Selection */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-8 bg-brand-navy/[0.02] border border-brand-navy/10 rounded-[2.5rem] shadow-inner">
                  <div className="space-y-2 mb-8">
                    <h3 className="text-2xl font-black tracking-tighter text-brand-navy uppercase">Inventory Destination</h3>
                    <p className="text-[10px] text-brand-navy/40 font-black uppercase tracking-widest">Select where this stock will be housed</p>
                  </div>

                  <FormField control={form.control} name="warehouseId" render={({ field }) => (
                    <FormItem className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => field.onChange("")}
                          className={cn(
                            "flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left",
                            !field.value
                              ? "border-brand-navy bg-brand-navy/5 shadow-md"
                              : "border-brand-navy/5 bg-white hover:border-brand-navy/20"
                          )}
                        >
                          <HardDrive className={cn("size-5 mb-3", !field.value ? "text-brand-navy" : "text-brand-navy/20")} />
                          <span className="text-[11px] font-black uppercase tracking-widest text-brand-navy">Virtual Stock</span>
                          <span className="text-[9px] font-bold opacity-40 uppercase">No physical hub</span>
                        </button>

                        {warehouses.map((wh) => (
                          <button
                            key={wh.id}
                            type="button"
                            onClick={() => field.onChange(wh.id)}
                            className={cn(
                              "flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left",
                              field.value === wh.id
                                ? "border-brand-navy bg-brand-navy/5 shadow-md"
                                : "border-brand-navy/5 bg-white hover:border-brand-navy/20"
                            )}
                          >
                            <MapPin className={cn("size-5 mb-3", field.value === wh.id ? "text-brand-navy" : "text-brand-navy/20")} />
                            <span className="text-[11px] font-black uppercase tracking-widest text-brand-navy truncate w-full">{wh.name}</span>
                            <span className="text-[9px] font-bold opacity-40 uppercase truncate w-full">{wh.location || "Central Hub"}</span>
                          </button>
                        ))}
                      </div>
                    </FormItem>
                  )} />
                </div>

                {form.watch("warehouseId") && (
                  <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-4 text-emerald-600">
                      <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <ShieldCheck className="size-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest">Inflow Authorized</p>
                        <p className="text-xs font-bold opacity-70">Stock will be registered to {warehouses.find(w => w.id === form.watch("warehouseId"))?.name}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Quick Add */}
              <div className="lg:col-span-5">
                <div className="p-8 bg-brand-navy text-white rounded-[2.5rem] shadow-2xl space-y-8 sticky top-0">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black tracking-tighter uppercase">Quick Register Hub</h3>
                    <p className="text-[9px] opacity-40 font-black uppercase tracking-[0.3em]">Expand Logistics Network</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Hub Name</label>
                      <Input
                        placeholder="e.g. Lagos Mainland"
                        value={newWhName}
                        onChange={(e) => setNewWhName(e.target.value)}
                        className="bg-white/10 border-none h-12 rounded-xl text-white font-bold placeholder:text-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Geographic Zone</label>
                      <Input
                        placeholder="e.g. Ikeja, Lagos"
                        value={newWhLoc}
                        onChange={(e) => setNewWhLoc(e.target.value)}
                        className="bg-white/10 border-none h-12 rounded-xl text-white font-bold placeholder:text-white/20"
                      />
                    </div>
                    <Button
                      onClick={handleAddWarehouse}
                      disabled={isAddingWarehouse || !newWhName}
                      className="w-full bg-white text-brand-navy hover:bg-white/90 h-14 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all"
                    >
                      {isAddingWarehouse ? "SYNCHRONIZING..." : "CONFIRM DEPLOYMENT"}
                    </Button>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <div className="flex items-center gap-3 opacity-40">
                      <AlertCircle className="size-4" />
                      <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                        Registered hubs are immediately available for inventory allocation across all product lines.
                      </p>
                    </div>
                  </div>
                </div>
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
                {images.length < 5 && (
                  <label
                    htmlFor={fileInputId}
                    className="relative aspect-[3/4] border-2 border-dashed border-brand-navy/10 rounded-[2rem] flex flex-col items-center justify-center gap-6 text-brand-navy/20 hover:bg-brand-navy/[0.02] hover:border-brand-navy/30 transition-all cursor-pointer group shadow-inner"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerUp={(event) => event.stopPropagation()}
                  >
                    {isUploading ? (<div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-navy border-t-transparent" />) : (
                      <>
                        <div className="size-20 rounded-[1.5rem] bg-brand-navy/[0.03] flex items-center justify-center group-hover:bg-brand-navy/5 transition-all">
                          <Images className="h-8 w-8 opacity-20 group-hover:opacity-100" />
                        </div>
                        <div className="text-center space-y-1">
                          <span className="block text-[11px] font-black uppercase tracking-widest text-brand-navy">Add Media</span>
                          <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">Max 5 Images</span>
                        </div>
                      </>
                    )}
                    <input
                      id={fileInputId}
                      type="file"
                      className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                      onPointerUp={(event) => event.stopPropagation()}
                    />
                  </label>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 mt-4 border-t-2 border-brand-navy/5">
          <div className="flex gap-4 w-full sm:w-auto order-2 sm:order-1">
            {activeTab !== "product" && (
              <Button variant="ghost" onClick={() => {
                const order = ["product", "media", "pricing"];
                setActiveTab(order[order.indexOf(activeTab) - 1]);
              }} type="button" className="flex-1 sm:flex-none text-xs font-black uppercase tracking-[0.3em] h-12 px-8 rounded-xl hover:bg-brand-navy/5 text-brand-navy transition-all">BACK</Button>
            )}
          </div>
          <div className="flex gap-4 w-full sm:w-auto order-1 sm:order-2">
            <Button variant="ghost" onClick={onClose} type="button" className="flex-1 sm:flex-none text-xs font-black uppercase tracking-[0.3em] h-12 px-4 sm:px-8 rounded-xl hover:bg-rose-500/5 text-rose-600 transition-all">CANCEL</Button>
            {activeTab !== "pricing" ? (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none bg-brand-navy text-white font-black text-xs uppercase tracking-[0.3em] h-12 px-10 rounded-xl shadow-lg shadow-brand-navy/20 active:scale-95 transition-all"
              >
                SAVE
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none bg-brand-navy text-white font-black text-xs uppercase tracking-[0.4em] h-12 px-12 rounded-xl shadow-[0_0_20px_rgba(var(--brand-navy-rgb),0.5)] active:scale-95 transition-all"
              >
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

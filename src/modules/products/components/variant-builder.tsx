"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Copy, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface Variant {
  id: string;
  color: string;
  size: string;
  sku: string;
  price?: number;
  quantity: number;
}

interface VariantBuilderProps {
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
  productName: string;
  costPrice?: number;
  sellingPrice?: number;
}

export function VariantBuilder({
  variants,
  onVariantsChange,
  productName,
  costPrice = 0,
  sellingPrice = 0,
}: VariantBuilderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newColor, setNewColor] = useState("");
  const [newSizes, setNewSizes] = useState("");
  const [newQuantity, setNewQuantity] = useState("0");
  const [editingId, setEditingId] = useState<string | null>(null);

  const generateSku = (color: string, size: string): string => {
    if (!productName) return "SKU";
    const namePart = productName.substring(0, 3).toUpperCase();
    const colorPart = color.substring(0, 2).toUpperCase();
    const sizePart = size.substring(0, 2).toUpperCase();
    const random = Math.floor(100 + Math.random() * 900);
    return `${namePart}-${colorPart}${sizePart}-${random}`;
  };

  const parseSizes = (value: string) =>
    Array.from(
      new Set(
        value
          .toString()
          .split(/[,\/|]+/)
          .map((size) => size.trim())
          .filter(Boolean)
      )
    );

  const handleAddVariant = () => {
    if (!newColor.trim()) {
      toast.error("Color is required");
      return;
    }

    const sizes = parseSizes(newSizes);
    if (sizes.length === 0) {
      toast.error("At least one size is required");
      return;
    }

    if (Number(newQuantity) < 0) {
      toast.error("Quantity cannot be negative");
      return;
    }

    const normalizedColor = newColor.trim();
    const baseVariants = editingId ? variants.filter((v) => v.id !== editingId) : variants;
    const existingKeys = new Set(
      baseVariants.map((v) => `${v.color.toLowerCase()}|${v.size.toLowerCase()}`)
    );

    const newVariants = sizes
      .map((size) => ({ size, key: `${normalizedColor.toLowerCase()}|${size.toLowerCase()}` }))
      .filter((entry) => !existingKeys.has(entry.key))
      .map((entry) => ({
        id: `var-${Date.now()}-${Math.random()}`,
        color: normalizedColor,
        size: entry.size,
        sku: generateSku(normalizedColor, entry.size),
        quantity: Number(newQuantity),
      }));

    if (newVariants.length === 0) {
      toast.error("All selected size combinations already exist");
      return;
    }

    if (editingId) {
      onVariantsChange([...baseVariants, ...newVariants]);
      toast.success(`Updated ${newVariants.length} variant${newVariants.length === 1 ? "" : "s"}`);
    } else {
      onVariantsChange([...variants, ...newVariants]);
      toast.success(`Added ${newVariants.length} variant${newVariants.length === 1 ? "" : "s"}`);
    }

    setNewColor("");
    setNewSizes("");
    setNewQuantity("0");
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleDeleteVariant = (id: string) => {
    onVariantsChange(variants.filter((v) => v.id !== id));
    toast.success("Variant removed");
  };

  const handleEditVariant = (variant: Variant) => {
    setEditingId(variant.id);
    setNewColor(variant.color);
    setNewSizes(variant.size);
    setNewQuantity(variant.quantity.toString());
    setIsDialogOpen(true);
  };

  const handleBulkAdd = () => {
    const colors = ["Red", "Blue", "Black", "White"];
    const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

    const newVariants = [];
    for (const color of colors) {
      for (const size of sizes) {
        const isDuplicate = variants.some(
          (v) =>
            v.color.toLowerCase() === color.toLowerCase() &&
            v.size.toLowerCase() === size.toLowerCase()
        );
        if (!isDuplicate) {
          const sku = generateSku(color, size);
          newVariants.push({
            id: `var-${Date.now()}-${Math.random()}`,
            color,
            size,
            sku,
            quantity: 0,
          });
        }
      }
    }

    if (newVariants.length === 0) {
      toast.info("All default variants already exist");
      return;
    }

    onVariantsChange([...variants, ...newVariants]);
    toast.success(`Added ${newVariants.length} variants`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-navy to-brand-navy/80 text-white px-5 py-2 text-xs font-extrabold uppercase tracking-[0.25em] shadow-lg hover:from-brand-navy/90 hover:to-brand-navy/80 focus:outline-none focus:ring-2 focus:ring-brand-navy/40 transition-all duration-150"
            onClick={() => {
              setEditingId(null);
              setNewColor("");
              setNewSizes("");
              setNewQuantity("0");
            }}
            aria-label="Add Variant"
          >
            <Plus className="h-4 w-4" />
            <span>Add Variant</span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit" : "Add"} Variant
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest">
                    Color
                  </label>
                  <Input
                    placeholder="e.g. Red, Blue, Black"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest">
                    Sizes
                  </label>
                  <Input
                    placeholder="e.g. S, M, L or 0-3m | 3-6m"
                    value={newSizes}
                    onChange={(e) => setNewSizes(e.target.value)}
                    className="mt-1"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Separate multiple sizes with commas, slashes, or pipes.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest">
                    Quantity in Stock
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={handleAddVariant}>
                  {editingId ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {variants.length === 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-[10px] px-2 py-1"
              onClick={handleBulkAdd}
            >
              <Copy className="h-3 w-3 mr-1" />
              Quick Setup
            </Button>
          )}
        </div>

      {variants.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-brand-navy/10 p-6 text-center sm:p-4">
          <p className="text-[11px] text-brand-navy/60">
            No variants yet. Add color & size combinations above.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border-2 border-brand-navy/10">
          <Table>
            <TableHeader>
              <TableRow className="bg-brand-navy/5">
                <TableHead className="text-[10px] font-black uppercase tracking-[0.35em]">
                  Color
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.35em]">
                  Size
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.35em]">
                  SKU
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.35em] text-right">
                  Qty
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.35em] w-[80px] min-w-[80px]">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant.id} className="hover:bg-brand-navy/2">
                  <TableCell className="font-medium text-[11px]">{variant.color}</TableCell>
                  <TableCell className="font-medium text-[11px]">{variant.size}</TableCell>
                  <TableCell className="text-[10px] text-brand-navy/60">
                    {variant.sku}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold",
                        variant.quantity === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      )}
                    >
                      {variant.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="w-[80px] min-w-[80px]">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditVariant(variant)}
                        className="h-8 w-8 p-0 text-brand-navy hover:text-brand-navy/80 hover:bg-brand-navy/5 flex items-center justify-center rounded-lg"
                        aria-label="Edit variant"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteVariant(variant.id)}
                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center rounded-lg"
                        aria-label="Delete variant"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {variants.length > 0 && (
        <div className="rounded-lg bg-brand-navy/5 p-3 text-xs">
          <p className="font-bold text-brand-navy">
            Total Variants: {variants.length} | Total Stock: {variants.reduce((sum, v) => sum + v.quantity, 0)}
          </p>
        </div>
      )}
    </div>
  );
}

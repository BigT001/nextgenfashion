"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
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
  price: number;
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
  const [newSize, setNewSize] = useState("");
  const [newPrice, setNewPrice] = useState(sellingPrice.toString());
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

  const handleAddVariant = () => {
    if (!newColor.trim()) {
      toast.error("Color is required");
      return;
    }
    if (!newSize.trim()) {
      toast.error("Size is required");
      return;
    }
    if (Number(newPrice) <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    if (Number(newQuantity) < 0) {
      toast.error("Quantity cannot be negative");
      return;
    }

    // Check for duplicate
    const isDuplicate = variants.some(
      (v) =>
        v.color.toLowerCase() === newColor.toLowerCase() &&
        v.size.toLowerCase() === newSize.toLowerCase() &&
        v.id !== editingId
    );

    if (isDuplicate) {
      toast.error("This color-size combination already exists");
      return;
    }

    if (editingId) {
      // Update existing
      onVariantsChange(
        variants.map((v) =>
          v.id === editingId
            ? {
                ...v,
                color: newColor,
                size: newSize,
                price: Number(newPrice),
                quantity: Number(newQuantity),
              }
            : v
        )
      );
      toast.success("Variant updated");
    } else {
      // Add new
      const sku = generateSku(newColor, newSize);
      onVariantsChange([
        ...variants,
        {
          id: `var-${Date.now()}`,
          color: newColor,
          size: newSize,
          sku,
          price: Number(newPrice),
          quantity: Number(newQuantity),
        },
      ]);
      toast.success("Variant added");
    }

    // Reset form
    setNewColor("");
    setNewSize("");
    setNewPrice(sellingPrice.toString());
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
    setNewSize(variant.size);
    setNewPrice(variant.price.toString());
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
            price: sellingPrice,
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[11px] font-black uppercase tracking-[0.35em] text-brand-navy">
          Product Variants (Colors & Sizes)
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.35em] text-brand-navy shadow-sm transition hover:bg-brand-navy/5"
              onClick={() => {
                setEditingId(null);
                setNewColor("");
                setNewSize("");
                setNewPrice(sellingPrice.toString());
                setNewQuantity("0");
              }}
            >
              <Plus className="h-4 w-4" />
              Add Variant
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
                    Size
                  </label>
                  <Input
                    placeholder="e.g. S, M, L, XL"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest">
                    Price (₦)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter price"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="mt-1"
                  />
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
                  Price
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.35em] text-right">
                  Qty
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.35em]">
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
                  <TableCell className="text-right font-medium text-[11px]">
                    ₦{variant.price.toLocaleString()}
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
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditVariant(variant)}
                        className="h-8 w-8 p-0"
                        aria-label="Edit variant"
                      >
                        <span className="text-[10px]">✎</span>
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteVariant(variant.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        aria-label="Delete variant"
                      >
                        <Trash2 className="h-3 w-3" />
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

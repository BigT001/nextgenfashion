"use client";

import { usePOSStore } from "@/modules/pos/store/pos.store";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Trash2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export function POSItemTable() {
  const { cart, updateQuantity, removeItem, updateItemDiscount } = usePOSStore();

  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white/50 dark:bg-zinc-900/50 rounded-[2rem] border-2 border-dashed border-border/50">
        <div className="text-4xl font-black text-brand-navy/10 mb-4 uppercase tracking-tighter">
          No items in the cart [Sales]
        </div>
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
          Ready for transaction scan
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-[2rem] shadow-xl shadow-brand-navy/5 overflow-hidden border border-border/50">
      <Table>
        <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px]">Item Name</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">Price</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-center">Qty.</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">Disc %</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cart.map((item) => {
            const itemTotal = (item.price * item.quantity) - (item.discount || 0);
            const discPercent = ((item.discount || 0) / (item.price * item.quantity)) * 100;

            return (
              <TableRow key={item.variantId} className="group border-b border-zinc-100 dark:border-zinc-800/50">
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => removeItem(item.variantId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground">{item.name}</span>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.sku}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold text-sm">
                  ₦{item.price.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7 rounded-lg border-zinc-200"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-4 text-center text-xs font-black">{item.quantity}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7 rounded-lg border-zinc-200"
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Input 
                      type="number" 
                      className="h-8 w-16 text-right text-xs font-bold rounded-lg border-zinc-200 focus-visible:ring-brand-navy"
                      value={item.discount || ""}
                      placeholder="0"
                      onChange={(e) => updateItemDiscount(item.variantId, Number(e.target.value))}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right font-black text-sm text-brand-navy">
                  ₦{Math.max(0, itemTotal).toLocaleString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {/* Receipt style bottom border */}
      <div className="h-4 w-full bg-[radial-gradient(circle,transparent_8px,_var(--border)_8px)] bg-[length:24px_24px] bg-repeat-x opacity-10" />
    </div>
  );
}

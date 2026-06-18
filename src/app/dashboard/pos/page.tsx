"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  UserPlus, 
  CreditCard, 
  Banknote, 
  Smartphone,
  ScanLine,
  ShoppingCart,
  Package,
  Zap,
  LayoutGrid,
  History,
  Play,
  Trash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { usePOSStore } from "@/modules/pos/store/pos.store";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getPOSProductsAction } from "@/modules/products/actions/pos.actions";
import { getAutoVatSetting } from "@/modules/settings/actions/settings.actions";
import { createSaleAction } from "@/modules/pos/actions/sale.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckoutSuccessDialog } from "@/components/pos/checkout-success-dialog";
import { POSItemTable } from "@/modules/pos/components/pos-item-table";
import { POSSummary } from "@/modules/pos/components/pos-summary";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

export default function POSPage() {
  const { 
    cart, 
    addItem, 
    total, 
    customer,
    clearCart,
    suspendedSales,
    resumeSale,
    deleteSuspendedSale,
    calculateTotals,
    setTaxRate
  } = usePOSStore();
  
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<"GRID" | "CART">("CART");
  const [isSuspendedOpen, setIsSuspendedOpen] = useState(false);
  
  // Success Dialog State
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  // Load live products
  const fetchProducts = useCallback(async (query?: string) => {
    setIsLoading(true);
    const result = await getPOSProductsAction(query);
    if (result.success) {
      setProducts(result.data || []);
    } else {
      toast.error(result.error || "Failed to load products");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    async function loadVatSetting() {
      const vatEnabled = await getAutoVatSetting();
      setTaxRate(vatEnabled ? 0.075 : 0.0);
    }
    loadVatSetting();
  }, [setTaxRate]);

  useEffect(() => {
    fetchProducts();
    calculateTotals();
  }, [fetchProducts, calculateTotals]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    
    // Switch to grid view if searching
    if (value.length > 0 && viewMode === "CART") {
        setViewMode("GRID");
    }
    
    const timer = setTimeout(() => {
      fetchProducts(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  const handleCheckout = async (paymentMethod: "CASH" | "CARD" | "TRANSFER") => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    try {
      const result = await createSaleAction({
        items: cart.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: total,
        paymentMethod,
        customerId: customer?.id,
      });

      if (result.success) {
        setLastOrder({
          orderNumber: result.data.orderNumber,
          totalAmount: total,
          itemCount: cart.reduce((acc, i) => acc + i.quantity, 0),
          paymentMethod,
        });
        setIsSuccessOpen(true);
        clearCart();
        setViewMode("CART"); // Reset to cart view after successful sale
      } else {
        toast.error(result.error || "Checkout failed");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] animate-slow-fade relative overflow-hidden">
      {/* Transaction Control (Left/Main) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Top Header Bar */}
        <div className="bg-white/40 dark:bg-zinc-900/40 p-2 rounded-[2rem] border border-border/50 flex items-center gap-2">
            <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-brand-navy transition-colors" />
                <Input
                    placeholder="Enter item name or scan barcode..."
                    className="pl-14 h-14 bg-transparent border-none text-lg font-bold placeholder:font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0"
                    value={search}
                    onChange={handleSearch}
                />
            </div>
            
            <div className="flex items-center gap-2 pr-2">
                <Button 
                    variant={viewMode === "CART" ? "default" : "outline"}
                    onClick={() => setViewMode("CART")}
                    className={cn(
                        "h-12 px-6 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest transition-all",
                        viewMode === "CART" ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-none" : "border-none"
                    )}
                >
                    <ShoppingCart className="size-4" />
                    Sale
                </Button>
                <Button 
                    variant={viewMode === "GRID" ? "default" : "outline"}
                    onClick={() => setViewMode("GRID")}
                    className={cn(
                        "h-12 px-6 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest transition-all",
                        viewMode === "GRID" ? "bg-brand-navy hover:bg-brand-navy/90 text-white shadow-lg shadow-brand-navy/20 border-none" : "border-none"
                    )}
                >
                    <LayoutGrid className="size-4" />
                    Show Products
                </Button>
                <Button size="icon" className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-brand-navy rounded-2xl transition-all active:scale-95 border-none">
                    <ScanLine className="h-5 w-5" />
                </Button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-4 scrollbar-hide">
          {viewMode === "GRID" ? (
             <>
               {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <EmptyState 
                            title="No Products Found" 
                            description="Try adjusting your search or category filters."
                            icon={Package}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {products.map((product) => (
                            <div key={product.id} className="contents">
                                {product.variants.map((variant: any) => (
                                    <Card 
                                        key={variant.id} 
                                        className="group cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300 border-none shadow-sm glass-card overflow-hidden rounded-[2rem]"
                                        onClick={() => {
                                            const stock = variant.inventory?.quantity ?? 0;
                                            if (stock <= 0) {
                                                toast.error(`"${product.name} (${variant.size} / ${variant.color})" is out of stock!`, {
                                                    description: "You cannot add out-of-stock items to a sale."
                                                });
                                                return;
                                            }

                                            // Check if already in cart and adding another exceeds stock
                                            const existingCartItem = cart.find((i) => i.variantId === variant.id);
                                            if (existingCartItem && existingCartItem.quantity + 1 > stock) {
                                                toast.error("Requested quantity exceeds available stock!", {
                                                    description: `Only ${stock} items left in inventory.`
                                                });
                                                return;
                                            }

                                            addItem({
                                                id: product.id,
                                                variantId: variant.id,
                                                name: `${product.name} (${variant.size} / ${variant.color})`,
                                                price: Number(variant.price || product.basePrice),
                                                sku: variant.sku
                                            });
                                            setViewMode("CART");
                                        }}
                                    >
                                        <CardContent className="p-4 space-y-3">
                                            <div className="aspect-square bg-muted/30 rounded-2xl mb-2 flex flex-col items-center justify-center relative overflow-hidden group-hover:bg-brand-navy/5 transition-colors">
                                                {product.images && product.images.length > 0 ? (
                                                    <img 
                                                        src={product.images[0]} 
                                                        alt={product.name} 
                                                        className="size-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <>
                                                        <Zap className="size-8 text-brand-navy/20 group-hover:text-brand-navy/40 transition-colors" />
                                                        <span className="mt-2 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{variant.sku}</span>
                                                    </>
                                                )}
                                                
                                                {variant.inventory && (
                                                    <div className="absolute top-2 right-2">
                                                        <Badge className={cn(
                                                            "text-[8px] font-black border-none px-3 py-1 rounded-full uppercase tracking-widest",
                                                            variant.inventory.quantity > 5 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                                                        )}>
                                                            {variant.inventory.quantity} In Stock
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-sm line-clamp-1 group-hover:text-brand-navy transition-colors">{product.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-muted-foreground/20 px-2">
                                                        {variant.size} • {variant.color}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-base font-black tracking-tight text-foreground">
                                                    ₦{Number(variant.price || product.basePrice).toLocaleString()}
                                                </span>
                                                <div className="size-8 rounded-full bg-brand-navy text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-brand-navy/30">
                                                    <Plus className="size-5" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
             </>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <POSItemTable products={products} />
            </div>
          )}
        </div>
      </div>

      {/* Summary & Checkout (Right Sidebar) */}
      <div className="lg:col-span-4 flex flex-col h-fit">
         <POSSummary onCheckout={handleCheckout} isProcessing={isProcessing} />
      </div>

      <CheckoutSuccessDialog 
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        orderData={lastOrder}
      />
    </div>
  );
}

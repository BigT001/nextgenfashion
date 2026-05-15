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
  Zap
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
import { createSaleAction } from "@/modules/pos/actions/sale.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckoutSuccessDialog } from "@/components/pos/checkout-success-dialog";

export default function POSPage() {
  const { 
    cart, 
    addItem, 
    removeItem, 
    updateQuantity, 
    subtotal, 
    taxAmount,
    total, 
    discount, 
    clearCart 
  } = usePOSStore();
  
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  
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
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    
    // Simple debounce for search
    const timer = setTimeout(() => {
      fetchProducts(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  const handleCheckout = async () => {
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] animate-slow-fade">
      {/* Product Selection (Left) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search products or scan barcode..."
              className="pl-12 h-14 bg-white/50 dark:bg-zinc-900/50 border-none shadow-sm text-lg rounded-2xl focus-visible:ring-brand-navy"
              value={search}
              onChange={handleSearch}
            />
          </div>
          <Button size="icon" className="h-14 w-14 bg-brand-navy hover:bg-brand-navy/90 rounded-2xl shadow-lg shadow-brand-navy/20 transition-all active:scale-95">
            <ScanLine className="h-6 w-6 text-white" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-4 scrollbar-hide">
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="space-y-4">
                  {product.variants.map((variant: any) => (
                    <Card 
                      key={variant.id} 
                      className="group cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-300 border-none shadow-sm glass-card overflow-hidden"
                      onClick={() => addItem({
                        id: product.id,
                        variantId: variant.id,
                        name: `${product.name} (${variant.size} / ${variant.color})`,
                        price: Number(variant.price || product.basePrice),
                        sku: variant.sku
                      })}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="aspect-square bg-muted/30 rounded-2xl mb-2 flex flex-col items-center justify-center relative overflow-hidden group-hover:bg-brand-navy/5 transition-colors">
                          <Zap className="size-8 text-brand-navy/20 group-hover:text-brand-navy/40 transition-colors" />
                          <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{variant.sku}</span>
                          
                          {variant.inventory && (
                            <div className="absolute top-2 right-2">
                              <Badge className={cn(
                                "text-[10px] font-black border-none",
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
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-muted-foreground/20">
                              {variant.size} • {variant.color}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-lg font-black tracking-tight text-foreground">
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
        </div>
      </div>

      {/* Cart & Checkout (Right) */}
      <div className="lg:col-span-5 flex flex-col h-full">
        <Card className="flex-1 flex flex-col border-none shadow-2xl glass-card overflow-hidden">
          <CardHeader className="py-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                  <ShoppingCart className="size-5 text-brand-navy" />
                  Register
                </CardTitle>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Active Sale Transaction</p>
              </div>
              <Button variant="outline" size="sm" className="h-10 px-4 gap-2 border-dashed rounded-xl hover:bg-brand-navy/5 hover:text-brand-navy hover:border-brand-navy/50 transition-all">
                <UserPlus className="h-4 w-4" />
                <span className="font-bold text-xs uppercase">Customer</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                <div className="size-20 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                  <ShoppingCart className="size-10 text-muted-foreground/30" />
                </div>
                <p className="font-bold text-lg text-foreground/50">Cart is currently empty</p>
                <p className="text-sm mt-1 max-w-[200px]">Scan a product or select an item from the catalog to begin.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {cart.map((item) => (
                  <div key={item.variantId} className="p-5 flex items-center gap-4 group hover:bg-brand-navy/[0.02] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate group-hover:text-brand-navy transition-colors">{item.name}</p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">SKU: {item.sku}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-xl border-muted-foreground/20 hover:border-brand-navy/50 hover:bg-brand-navy/5"
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-black">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-xl border-muted-foreground/20 hover:border-brand-navy/50 hover:bg-brand-navy/5"
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="w-24 text-right">
                      <p className="text-sm font-black">₦{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                      onClick={() => removeItem(item.variantId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex-col gap-6 p-8 border-t border-border/50 bg-muted/10">
            <div className="w-full space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold text-foreground">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Promo Discount</span>
                <span className="text-rose-500 font-bold">-₦{discount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">VAT (7.5%)</span>
                <span className="font-bold text-foreground">₦{Math.round(taxAmount).toLocaleString()}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Total Revenue</span>
                  <span className="text-3xl font-black tracking-tighter text-brand-navy">₦{Math.round(total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full">
              {[
                { id: "CASH", icon: Banknote, color: "text-emerald-500" },
                { id: "TRANSFER", icon: Smartphone, color: "text-blue-500" },
                { id: "CARD", icon: CreditCard, color: "text-purple-500" },
              ].map((method) => (
                <Button 
                  key={method.id}
                  variant="outline" 
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={cn(
                    "flex-col h-20 gap-2 border-2 transition-all rounded-2xl",
                    paymentMethod === method.id 
                      ? "border-brand-navy bg-brand-navy/5 text-brand-navy shadow-lg shadow-brand-navy/5" 
                      : "hover:border-brand-navy/50 hover:bg-brand-navy/[0.02] border-muted-foreground/10"
                  )}
                >
                  <method.icon className={cn("h-6 w-6", method.color)} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{method.id}</span>
                </Button>
              ))}
            </div>

            <Button 
              className="w-full h-16 text-xl font-black rounded-2xl bg-brand-navy hover:bg-brand-navy/90 text-white shadow-2xl shadow-brand-navy/30 active:scale-95 transition-all disabled:opacity-50"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCheckout}
            >
              {isProcessing ? (
                <LoadingSpinner size="sm" variant="white" />
              ) : (
                <>
                  <Zap className="mr-3 h-6 w-6 fill-white" />
                  COMPLETE TRANSACTION
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <CheckoutSuccessDialog 
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        orderData={lastOrder}
      />
    </div>
  );
}

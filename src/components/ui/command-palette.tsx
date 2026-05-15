"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Search, 
  ShoppingBag, 
  Box, 
  User, 
  ArrowRight, 
  Command, 
  Zap,
  TrendingUp,
  History
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { universalSearchAction } from "@/modules/search/actions/search.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  // Handle keyboard shortcut (CMD+K or CTRL+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Debounced Search Orchestration
  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults(null);
        return;
      }
      setIsSearching(true);
      const result = await universalSearchAction(query);
      if (result.success) {
        setResults(result.data);
      }
      setIsSearching(false);
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const navigate = (path: string) => {
    setOpen(false);
    setQuery("");
    router.push(path);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none glass-card shadow-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl top-[20%] translate-y-0 rounded-[2rem]">
        <div className="flex flex-col">
          {/* Search Header */}
          <div className="flex items-center gap-4 px-6 py-5 border-b border-border/30">
            <Search className="size-5 text-brand-navy animate-pulse" />
            <input
              autoFocus
              placeholder="Discover products, orders, or collections..."
              className="flex-1 bg-transparent border-none outline-none text-lg font-bold placeholder:text-muted-foreground/40 placeholder:font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-border/50">
              <span className="text-[10px] font-black opacity-40">CMD</span>
              <span className="text-[10px] font-black opacity-40">K</span>
            </div>
          </div>

          {/* Results Container */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-8 scrollbar-hide">
            {!results && !isSearching && (
              <div className="py-20 text-center space-y-4">
                <div className="size-16 bg-brand-navy/5 rounded-2xl flex items-center justify-center mx-auto text-brand-navy/30">
                  <Command className="size-8" />
                </div>
                <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">Initialising Cognitive Discovery...</p>
              </div>
            )}

            {isSearching && (
              <div className="py-20 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {results && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Products Section */}
                {results.products.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-brand-navy">LATEST COLLECTIONS</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {results.products.map((product: any) => (
                        <button
                          key={product.id}
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-brand-navy/5 group transition-all text-left"
                        >
                          <div className="size-12 rounded-xl bg-muted overflow-hidden flex-shrink-0 border border-border/30 group-hover:scale-105 transition-transform">
                            {product.images?.[0] ? (
                                <Image src={product.images[0]} alt={product.name} width={48} height={48} className="object-cover h-full" />
                            ) : (
                                <Box className="size-5 m-auto text-muted-foreground/30" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-sm tracking-tight group-hover:text-brand-navy transition-colors">{product.name}</p>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{product.category.name}</p>
                          </div>
                          <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Orders Section */}
                {results.orders.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-brand-silver">GLOBAL LEDGER</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {results.orders.map((order: any) => (
                        <button
                          key={order.id}
                          onClick={() => navigate(`/dashboard/orders`)}
                          className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-brand-silver/5 group transition-all text-left"
                        >
                          <div className="size-12 rounded-xl bg-brand-silver/10 flex items-center justify-center text-brand-silver flex-shrink-0 group-hover:rotate-12 transition-transform">
                            <History className="size-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-sm tracking-tight">{order.orderNumber}</p>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">₦{Number(order.totalAmount).toLocaleString()} • {order.customer?.name || "Walk-in"}</p>
                          </div>
                          <Badge className="bg-brand-silver/10 text-brand-silver border-none font-black text-[9px] px-2 uppercase tracking-widest">
                            {order.status}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories Section */}
                {results.categories.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">ARCHIVES</h4>
                    <div className="flex flex-wrap gap-2 px-2">
                      {results.categories.map((category: any) => (
                        <button
                          key={category.id}
                          onClick={() => navigate(`/shop?category=${category.name}`)}
                          className="px-4 py-2 rounded-xl bg-muted/50 hover:bg-brand-navy hover:text-white font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {results.products.length === 0 && results.orders.length === 0 && results.categories.length === 0 && (
                  <div className="py-20 text-center space-y-4">
                    <div className="size-16 bg-muted rounded-2xl flex items-center justify-center mx-auto text-muted-foreground/30">
                      <Zap className="size-8" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Intelligence Found For "{query}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Footer */}
          <div className="px-6 py-4 bg-muted/30 border-t border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="size-5 bg-white dark:bg-zinc-800 rounded flex items-center justify-center shadow-sm border border-border/50">
                        <ArrowRight className="size-3 text-muted-foreground" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Select</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="size-5 bg-white dark:bg-zinc-800 rounded flex items-center justify-center shadow-sm border border-border/50">
                        <span className="text-[9px] font-black text-muted-foreground">ESC</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Close</span>
                </div>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-brand-navy animate-pulse">
                <Zap className="size-3 fill-current" />
                NextGen Discovery Engine
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

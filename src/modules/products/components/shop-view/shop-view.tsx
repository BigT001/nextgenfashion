import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingCart, Zap, Heart, Filter, SlidersHorizontal, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GetProductsService } from "@/modules/products/services/get-products.service";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/modules/products/components/product-card";
import { ProductQueries } from "@/modules/products/queries/product.queries";
import { MobileDrawer } from "./mobile-drawer";
import { ShopFilters } from "./shop-filters";

interface ShopViewProps {
  category?: string;
  targetGender?: string;
  search?: string;
  maxPrice?: number;
  title?: string;
  description?: string;
  badge?: string;
}

export async function ShopView({
  category,
  targetGender,
  search,
  maxPrice,
  title = "EXPLORE THE COLLECTION",
  description = "Discover our complete range of premium, sustainably engineered fashion for the next generation.",
  badge = "Full Catalog 2026"
}: ShopViewProps) {
  // Fetch categories for the sidebar
  const categories = await ProductQueries.findCategories(targetGender);

  // Fetch products with filters
  const products = await GetProductsService.execute({
    categoryId: category,
    targetGender: targetGender,
    search: search,
    maxPrice: maxPrice,
  });

  return (
    <div className="min-h-screen bg-background selection:bg-brand-navy/30">
      {/* Discovery Layer */}
      <section className="pt-4 md:pt-8 pb-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12">

            {/* Filter Sidebar - Desktop */}
            <aside className="hidden lg:block lg:w-64 shrink-0">
              <ShopFilters categories={categories} category={category} targetGender={targetGender} />
            </aside>

            {/* Product Grid */}
            <div className="flex-1 space-y-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="lg:hidden">
                    <MobileDrawer>
                      <ShopFilters categories={categories} category={category} targetGender={targetGender} />
                    </MobileDrawer>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground hidden sm:block">Showing <span className="font-black text-foreground">{products.length}</span> luxury pieces</p>
                </div>
                
                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-4">
                  <p className="text-sm font-medium text-muted-foreground sm:hidden">Showing <span className="font-black text-foreground">{products.length}</span></p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hidden sm:inline">Sort By</span>
                    <Button variant="outline" className="h-10 rounded-xl glass-card border-none text-xs font-bold px-4">Latest Arrivals</Button>
                  </div>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="h-[50vh] flex items-center justify-center">
                  <EmptyState
                    title="Catalog Empty"
                    description="We are currently restocking our latest collection. Check back soon!"
                    icon={Package}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-10">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

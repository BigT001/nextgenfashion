export const dynamic = "force-dynamic";

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

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  // Fetch categories for the sidebar
  const categories = await ProductQueries.findCategories();

  // Fetch products with filters
  const products = await GetProductsService.execute({
    categoryId: category,
    search: q,
  });

  return (
    <div className="min-h-screen bg-background selection:bg-brand-navy/30">
      {/* Catalog Header - High-Fidelity Mesh Accent */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 bg-brand-mesh opacity-20" />
        <div className="container mx-auto px-6 relative z-10 text-center space-y-6">
          <Badge className="bg-white/10 backdrop-blur-xl text-white border-white/20 px-4 py-1.5 text-xs uppercase tracking-[0.3em] font-black rounded-full">
            Full Catalog 2024
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
            EXPLORE THE <span className="text-gradient">COLLECTION</span>.
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Discover our complete range of premium, sustainably engineered fashion for the next generation.
          </p>
        </div>
      </section>

      {/* Discovery Layer */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12">

            {/* Filter Sidebar - High-Fidelity Glassmorphism */}
            <aside className="lg:w-64 space-y-10 shrink-0">
              <div className="flex items-center justify-between pb-4 border-b border-border/30">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <SlidersHorizontal className="size-4" />
                  Filters
                </h3>
                <button className="text-[10px] font-black text-brand-navy uppercase tracking-widest hover:underline">Clear</button>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Categories</h4>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/shop"
                    className={cn(
                      "text-left py-3 px-5 rounded-2xl text-sm font-bold transition-all",
                      !category ? "bg-brand-navy/5 text-brand-navy glass-card border-none" : "hover:bg-accent hover:translate-x-1"
                    )}
                  >
                    All Products
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/shop?category=${cat.id}`}
                      className={cn(
                        "text-left py-3 px-5 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group",
                        category === cat.id ? "bg-brand-navy/5 text-brand-navy glass-card border-none" : "hover:bg-accent hover:translate-x-1"
                      )}
                    >
                      {cat.name}
                      <span className="text-[10px] opacity-40 group-hover:opacity-100">{cat._count.products}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Price Range</h4>
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black tracking-widest uppercase">
                    <span>₦0</span>
                    <span>₦100,000+</span>
                  </div>
                  <div className="h-2 bg-accent rounded-full relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-2/3 bg-brand-navy/30 rounded-full" />
                    <div className="absolute inset-y-0 left-2/3 size-2 bg-brand-navy rounded-full -translate-x-1/2" />
                  </div>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1 space-y-12">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Showing <span className="font-black text-foreground">{products.length}</span> luxury pieces</p>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Sort By</span>
                  <Button variant="outline" className="h-10 rounded-xl glass-card border-none text-xs font-bold px-4">Latest Arrivals</Button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
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

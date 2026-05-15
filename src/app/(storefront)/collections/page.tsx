export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, Package, Sparkles, Zap, Layers } from "lucide-react";
import { ProductQueries } from "@/modules/products/queries/product.queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CollectionsPage() {
  const categories = await ProductQueries.findCategories();

  return (
    <div className="min-h-screen bg-background selection:bg-brand-navy/30 pb-32">
      {/* Header */}
      <section className="relative pt-40 pb-24 overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 bg-brand-mesh opacity-20" />
        <div className="container mx-auto px-6 relative z-10 space-y-8">
          <Badge className="bg-white/10 backdrop-blur-xl text-white border-white/20 px-4 py-1.5 text-xs uppercase tracking-[0.3em] font-black rounded-full">
            The Archives
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter max-w-4xl">
            CURATED <span className="text-gradient">COLLECTIONS</span>.
          </h1>
          <p className="text-zinc-400 text-xl max-w-2xl font-medium leading-relaxed">
            Architectural fashion groupings engineered for specific lifestyles and aesthetic benchmarks.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                href={`/shop?category=${category.id}`}
                className="group relative h-[600px] rounded-[3.5rem] overflow-hidden glass-card border-none shadow-2xl transition-all hover:-translate-y-4 duration-700"
              >
                <div className="absolute inset-0 bg-zinc-900 group-hover:bg-brand-navy/20 transition-colors duration-700" />
                <div className="absolute inset-0 bg-brand-mesh opacity-10" />
                
                {/* Visual Identity */}
                <div className="absolute top-12 left-12 space-y-4 z-20">
                    <div className="size-16 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-xl group-hover:bg-brand-navy group-hover:border-brand-navy transition-all duration-700">
                        <Layers className="size-8" />
                    </div>
                    <Badge className="bg-brand-navy/20 text-brand-navy border-none font-black text-[10px] tracking-widest px-4 py-1.5 rounded-full">
                        {category._count.products} PIECES
                    </Badge>
                </div>

                <div className="absolute bottom-12 left-12 right-12 z-20 space-y-6">
                  <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                    {category.name}
                  </h3>
                  <p className="text-zinc-400 font-medium line-clamp-2 text-sm leading-relaxed group-hover:text-white transition-colors">
                    Explore our latest {category.name.toLowerCase()} engineering, designed for maximum aesthetic impact and durability.
                  </p>
                  <Button variant="outline" className="h-14 rounded-2xl border-white/20 text-white bg-transparent hover:bg-white hover:text-black font-black text-[10px] uppercase tracking-widest px-8 group-hover:border-white transition-all">
                    VIEW ARCHIVE
                    <ArrowRight className="ml-3 size-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>

                {/* Decorative pulse */}
                <div className="absolute -bottom-20 -right-20 size-80 bg-brand-navy/10 rounded-full blur-[100px] group-hover:bg-brand-navy/30 transition-all duration-700" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Callout */}
      <section className="container mx-auto px-6 py-20">
          <div className="bg-zinc-950 rounded-[4rem] p-16 md:p-32 relative overflow-hidden text-center space-y-12">
              <div className="absolute inset-0 bg-brand-mesh opacity-10" />
              <div className="relative z-10 space-y-6">
                  <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">ESTABLISHED IN <span className="text-brand-navy">2024</span>.</h2>
                  <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                      Every collection is a milestone in our journey toward sustainable, high-fidelity fashion architecture.
                  </p>
                  <div className="flex items-center justify-center gap-12 pt-8">
                      <div className="text-center">
                          <p className="text-3xl font-black text-white">100%</p>
                          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Organic</p>
                      </div>
                      <div className="text-center">
                          <p className="text-3xl font-black text-white">0%</p>
                          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Waste</p>
                      </div>
                      <div className="text-center">
                          <p className="text-3xl font-black text-white">24/7</p>
                          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Logistics</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>
    </div>
  );
}

import { notFound } from "next/navigation";
import Image from "next/image";
import { GetProductsService } from "@/modules/products/services/get-products.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Zap, ShieldCheck, Truck, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductActions } from "@/modules/products/components/product-actions";
import { ConversionPulse } from "@/modules/products/components/conversion-pulse";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await GetProductsService.byId(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="relative min-h-screen bg-background selection:bg-brand-navy/30">
      {/* Decorative Accents */}
      <div className="absolute top-0 right-0 size-[600px] bg-brand-navy/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 size-[400px] bg-brand-silver/5 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-6 py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-start">
          {/* Product Showcase */}
          <div className="space-y-8 animate-slow-fade">
            <div className="aspect-[4/5] relative rounded-[3.5rem] overflow-hidden glass-card border-none shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] group">
              <div className="absolute inset-0 bg-brand-mesh opacity-5 z-0" />
              {product.images && product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover relative z-10 group-hover:scale-110 transition-transform duration-1000"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-200">
                  <Zap className="size-32 opacity-10" />
                </div>
              )}
              <div className="absolute top-10 right-10 z-20">
                <Badge className="bg-white/90 backdrop-blur-xl text-black border-none font-black text-xs px-5 py-2 uppercase tracking-widest rounded-2xl shadow-xl">
                  NEW ARRIVAL
                </Badge>
              </div>
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-6 px-4">
                {product.images.map((img, i) => (
                  <div key={i} className="aspect-square relative rounded-3xl overflow-hidden glass-card border-none cursor-pointer hover:scale-105 transition-all shadow-sm">
                    <Image src={img} alt={`${product.name} ${i}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Intelligence & Actions */}
          <div className="flex flex-col space-y-10 animate-slow-fade delay-100">
            <div className="space-y-6">
              <div className="flex flex-col gap-6">
                <ConversionPulse />
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-brand-navy border-brand-navy/20 font-black px-4 py-1.5 rounded-full">
                    {product.category.name.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-1 text-amber-400">
                    {[1,2,3,4,5].map(i => <Star key={i} className="size-4 fill-current" />)}
                    <span className="text-xs text-muted-foreground font-bold ml-2">(48 Reviews)</span>
                    </div>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1]">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-6">
                <span className="text-5xl font-black tracking-tighter text-gradient">
                  ₦{Number(product.basePrice).toLocaleString()}
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-4 py-1.5 font-black text-xs uppercase tracking-widest">
                  Ready to ship
                </Badge>
              </div>
            </div>

            <p className="text-xl text-muted-foreground leading-relaxed font-medium">
              {product.description || "An exquisite piece of fashion tech architecture, designed for the next generation of style icons. Engineered with premium fabrics and sustainable methodology."}
            </p>

            <div className="glass-card p-10 rounded-[2.5rem] space-y-10">
              <ProductActions product={product} />
              
              <Separator className="bg-border/30" />

              <div className="grid grid-cols-2 gap-8">
                {[
                  { icon: ShieldCheck, title: "LIFETIME QUALITY", desc: "Sustainably sourced fabrics." },
                  { icon: Truck, title: "EXPRESS DELIVERY", desc: "Next-day nationwide." }
                ].map((item, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-navy/10 rounded-xl">
                        <item.icon className="size-5 text-brand-navy" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest">{item.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features list */}
            <div className="flex flex-wrap gap-8 px-4">
              {[
                  "100% Organic Cotton",
                  "Ethically Engineered",
                  "NextGen Exclusive",
                  "Limited Edition"
              ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                      <Sparkles className="size-4 text-brand-navy" />
                      {f}
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

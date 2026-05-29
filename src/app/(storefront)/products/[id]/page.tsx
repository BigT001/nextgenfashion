export const dynamic = "force-dynamic";

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
import { ResolveProductImagesService } from "@/modules/media/services/resolve-product-images.service";

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

  const resolvedProducts = await ResolveProductImagesService.resolve([product]);
  const resolvedProduct = resolvedProducts[0];
  const displayImage = resolvedProduct.resolvedImage || "";

  const totalStock = product.variants?.reduce((acc: number, v: { inventory?: { quantity?: number | null } | null }) => acc + (v.inventory?.quantity || 0), 0) ?? 0;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const isNew = product.createdAt && new Date(product.createdAt) > thirtyDaysAgo;

  return (
    <div className="relative min-h-screen bg-background selection:bg-brand-navy/30">
      {/* Decorative Accents */}
      <div className="absolute top-0 right-0 size-[600px] bg-brand-navy/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 size-[400px] bg-brand-silver/5 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-6 py-10 md:py-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Product Showcase */}
          <div className="space-y-6 animate-slow-fade lg:sticky lg:top-24">
            <div className="aspect-square lg:aspect-[4/5] max-w-md mx-auto relative rounded-3xl overflow-hidden glass-card border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] group">
              <div className="absolute inset-0 bg-brand-mesh opacity-5 z-0" />
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 40vw"
                  className="object-cover relative z-10 group-hover:scale-110 transition-transform duration-1000"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-200">
                  <Zap className="size-32 opacity-10" />
                </div>
              )}
              {isNew && (
                <div className="absolute top-10 right-10 z-20">
                  <Badge className="bg-white/90 backdrop-blur-xl text-black border-none font-black text-xs px-5 py-2 uppercase tracking-widest rounded-2xl shadow-xl">
                    NEW ARRIVAL
                  </Badge>
                </div>
              )}
            </div>
            
            {displayImage && (
              <div className="grid grid-cols-4 gap-4 px-4 max-w-md mx-auto">
                <div className="col-span-4 aspect-square relative rounded-2xl overflow-hidden glass-card border-none shadow-sm">
                  <Image
                    src={displayImage}
                    alt={`${product.name} preview`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Product Intelligence & Actions */}
          <div className="flex flex-col space-y-6 animate-slow-fade delay-100">
            <div className="space-y-4">
              
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4">
                <span className="text-3xl md:text-4xl font-black tracking-tighter text-gradient">
                  ₦{Number(product.basePrice).toLocaleString()}
                </span>
                {totalStock > 0 ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-4 py-1 font-black text-[10px] md:text-xs uppercase tracking-widest">
                    Ready to ship
                  </Badge>
                ) : (
                  <Badge className="bg-rose-500/10 text-rose-600 border-none px-4 py-1 font-black text-[10px] md:text-xs uppercase tracking-widest">
                    Out of stock
                  </Badge>
                )}
              </div>
            </div>

            {product.description && product.description.trim() !== "Imported from PHP Point of Sale" ? (
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-medium">
                {product.description}
              </p>
            ) : null}

            <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
              <ProductActions product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await GetProductsService.byId(id);
    if (!product) return { title: "Product not found" };

    const [resolvedProduct] = await ResolveProductImagesService.resolve([product]);
    const resolvedImage = resolvedProduct?.resolvedImage || "";

    return {
      title: `${product.name} — NextGen Fashion`,
      description: product.description || `Buy ${product.name} for ₦${Number(product.basePrice).toLocaleString()}`,
      openGraph: {
        title: product.name,
        description: product.description || undefined,
        images: resolvedImage ? [{ url: resolvedImage, alt: product.name }] : undefined,
      },
    };
  } catch (err) {
    return { title: "Product" };
  }
}

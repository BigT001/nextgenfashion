export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { GetProductsService } from "@/modules/products/services/get-products.service";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "@/modules/products/components/product-actions";
import { ProductImageGallery } from "@/modules/products/components/product-image-gallery";
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
  const displayImage = resolvedProduct.resolvedImage || "/images/product-placeholder.svg";

  const totalStock = product.variants?.reduce((acc: number, v: { inventory?: { quantity?: number | null } | null }) => acc + (v.inventory?.quantity || 0), 0) ?? 0;
  const firstVariant = product.variants?.[0];
  const skuLabel = firstVariant?.sku || firstVariant?.barcode || "—";
  const categoryName = product.Category?.name || product.category?.name || "Exclusive collection";
  const imageCount = resolvedProduct.images?.length ?? 1;
  const rawDescription = product.description?.trim();
  const isPlaceholderDescription = rawDescription === "Imported from PHP Point of Sale";
  const descriptionText = rawDescription && !isPlaceholderDescription
    ? rawDescription
    : "Crafted with clean detail and premium polish, this style is built to stand out while remaining timeless.";
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const isNew = product.createdAt && new Date(product.createdAt) > thirtyDaysAgo;

  return (
    <div className="relative min-h-screen bg-background selection:bg-brand-navy/30">
      {/* Decorative Accents */}
      <div className="absolute inset-x-0 top-0 h-[320px] bg-brand-navy/5 blur-[140px] -z-10" />
      <div className="absolute inset-x-0 bottom-0 h-[240px] bg-brand-silver/5 blur-[120px] -z-10" />

      <div className="container mx-auto px-6 py-10 md:py-16 max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-16 items-start">
          {/* Product Showcase */}
          <div className="space-y-6 animate-slow-fade lg:sticky lg:top-24">
            <div className="max-w-[34rem] mx-auto">
              <ProductImageGallery images={resolvedProduct.images ?? [displayImage]} alt={product.name} />
            </div>
            {isNew && (
              <div className="mx-auto w-fit rounded-full bg-white/95 border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-[0.35em] text-slate-800 shadow-sm shadow-slate-900/10">
                New arrival
              </div>
            )}
          </div>

          {/* Product Intelligence & Actions */}
          <div className="space-y-6 animate-slow-fade delay-100">
            <div className="rounded-[2.5rem] bg-white/95 border border-slate-200 shadow-2xl shadow-slate-900/5 p-8">
              <div className="space-y-5">
                <div className="space-y-3">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950 leading-tight">
                    {product.name}
                  </h1>
                  <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">
                    {descriptionText}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 font-black mb-2">Price</p>
                    <p className="text-3xl sm:text-4xl font-black text-brand-navy tracking-tight">
                      ₦{Number(product.basePrice).toLocaleString()}
                    </p>
                  </div>

                  <Badge className={`w-fit ${totalStock > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"} border-none px-4 py-2 font-black text-[10px] uppercase tracking-[0.35em]`}>
                    {totalStock > 0 ? "Ready to ship" : "Out of stock"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Category</p>
                    <p className="mt-2 font-black text-slate-950">{categoryName}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">SKU</p>
                    <p className="mt-2 font-black text-slate-950">{skuLabel}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Stock</p>
                    <p className="mt-2 font-black text-slate-950">{totalStock}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Images</p>
                    <p className="mt-2 font-black text-slate-950">{imageCount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-none shadow-xl bg-white/90">
              <ProductActions product={product} />
            </div>

            <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950/5 p-8">
              <div className="mb-4 text-xs uppercase tracking-[0.35em] text-slate-500 font-black">
                Product details
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-slate-700">
                {descriptionText}
              </p>
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

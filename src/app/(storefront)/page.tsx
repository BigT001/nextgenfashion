export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Star, Truck, ShieldCheck, Gift, Award,
  RefreshCw, Headphones, ShoppingCart, ShoppingBag, Package, Smartphone, Heart, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GetProductsService } from "@/modules/products/services/get-products.service";
import { LiveBrandPulse } from "@/modules/brand/components/live-brand-pulse";
import { AnimatedSection } from "@/components/ui/animated-section";
import { ProductQueries } from "@/modules/products/queries/product.queries";
import { ResolveProductImagesService, type ProductWithVariants } from "@/modules/media/services/resolve-product-images.service";

type FeaturedProduct = Awaited<ReturnType<typeof GetProductsService.findFeatured>>[number];
type CategoryWithProducts = Awaited<ReturnType<typeof ProductQueries.findCategories>>[number] & {
  Product?: CategoryProductRow[];
};
type CategoryProductRow = {
  id: string;
  name: string;
  categories?: Array<{ id: string; name?: string | null }> | null;
  images?: string[] | null;
  ProductVariant?: Array<{
    sku?: string | null;
    barcode?: string | null;
  }> | null;
};

export default async function LandingPage() {
  let featuredProducts: FeaturedProduct[] = [];
  let dbCategories: CategoryWithProducts[] = [];
  try {
    const [products, cats] = await Promise.all([
      GetProductsService.findFeatured(8),
      ProductQueries.findCategories()
    ]);
    featuredProducts = products;
    dbCategories = cats;
  } catch (err) {
    console.error("[LANDING_PAGE] DB Query failed:", err);
    featuredProducts = [];
    dbCategories = [];
  }

  const categoryProducts: ProductWithVariants[] = dbCategories.flatMap((cat) => {
    const rawProducts = (cat.Product ?? []) as unknown as CategoryProductRow[];

    return rawProducts.map((product) => ({
      id: product.id,
      name: product.name,
      images: product.images ?? [],
      categoryId: cat.id,
      category: { name: cat.name },
      variants: (product.ProductVariant ?? []).map((variant) => ({
        sku: variant.sku ?? null,
        barcode: variant.barcode ?? null,
      })),
    }));
  });

  // Skip remote image discovery for landing page - use DB images only for blazing fast load
  const resolvedCategoryProducts = await ResolveProductImagesService.resolve(categoryProducts, {
    allowRemoteImageDiscovery: false,
  });
  const resolvedCategoryImageMap = new Map(resolvedCategoryProducts.map((item) => [item.id, item.resolvedImage]));

  const categories = dbCategories.map(cat => {
    const rawProducts = (cat.Product ?? []) as unknown as Array<{ id: string }>;
    const firstProduct = rawProducts[0];
    const productImage = firstProduct ? resolvedCategoryImageMap.get(firstProduct.id) || "" : "";
    const displayImage = cat.image || productImage;

    return {
      name: cat.name,
      image: displayImage,
      href: `/shop?category=${cat.id}`
    };
  });

  // Map category names to icons
  const getCategoryIcon = (name?: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("bag") || n.includes("bags") || n.includes("backpack")) return ShoppingBag;
    if (n.includes("shoe") || n.includes("foot") || n.includes("sneak")) return ShoppingCart;
    if (n.includes("perfume") || n.includes("scent")) return Heart;
    if (n.includes("tablet") || n.includes("tablet") || n.includes("ipad") || n.includes("phone") || n.includes("tech")) return Smartphone;
    if (n.includes("toy") || n.includes("wooden") || n.includes("game")) return Package;
    if (n.includes("jean") || n.includes("pants") || n.includes("bottom")) return ShoppingBag;
    if (n.includes("accessor") || n.includes("accessory")) return Gift;
    return Zap;
  };

  // Friendly emoji mapping for kids-first avatars
  const getCategoryEmoji = (name?: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("bag") || n.includes("backpack")) return "👜";
    if (n.includes("shoe") || n.includes("foot") || n.includes("sneak")) return "👟";
    if (n.includes("perfume") || n.includes("scent")) return "🧴";
    if (n.includes("tablet") || n.includes("tech") || n.includes("phone")) return "📱";
    if (n.includes("toy") || n.includes("wooden") || n.includes("game")) return "🧸";
    if (n.includes("jean") || n.includes("pants") || n.includes("bottom")) return "👖";
    if (n.includes("accessor") || n.includes("accessory")) return "🎀";
    if (n.includes("boys")) return "🧢";
    if (n.includes("girls")) return "👗";
    if (n.includes("baby")) return "👶";
    return "✨";
  };

  const pastelPalette = [
    ["#FFD6E0", "#FFB6C1"],
    ["#E0F7FF", "#BEE7FF"],
    ["#FFF4D6", "#FFE6A7"],
    ["#E8FFE6", "#BFFFC4"],
    ["#F0E6FF", "#D6C8FF"],
  ];

  const pickColors = (name?: string) => {
    if (!name) return pastelPalette[0];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return pastelPalette[sum % pastelPalette.length];
  };

  type FeaturedImageItem = {
    id: string;
    product: FeaturedProduct;
    image: string;
  };

  // Skip remote image discovery for featured products - use DB images only for blazing fast load
  const resolvedFeaturedProducts = await ResolveProductImagesService.resolve(featuredProducts, {
    allowRemoteImageDiscovery: false,
  });
  const uniqueFeaturedProducts = resolvedFeaturedProducts
    .filter((product, index, products) => Boolean(product?.id) && products.findIndex((candidate) => candidate?.id === product.id) === index)
    .slice(0, 8);

  const visibleFeaturedImages: FeaturedImageItem[] = uniqueFeaturedProducts
    .filter((product) => Boolean(product.resolvedImage && product.resolvedImage.trim() !== ""))
    .map((product) => ({
      id: product.id,
      product,
      image: product.resolvedImage,
    }));

  const discoverProducts = uniqueFeaturedProducts
    .filter((product) => Boolean(product.resolvedImage && product.resolvedImage.trim() !== ""))
    .slice(0, 4);

  const discoverCards = discoverProducts.map((product) => ({
    name: product.category?.name || product.name,
    img: product.resolvedImage,
    link: product.categoryId ? `/shop?category=${product.categoryId}` : "/shop"
  }));

  return (
    <div className="flex flex-col bg-white overflow-x-hidden">

      {/* ═══════════════════ HERO — Full-width Sky Blue (reference match) ══════ */}
      <section className="relative overflow-hidden min-h-[520px] md:min-h-[82vh]" style={{ background: "linear-gradient(180deg,#1ab2f5 0%,#29ccf5 30%,#5dd8f8 65%,#b3ecfc 85%,#e0f7ff 100%)" }}>

        {/* ── Sun ── */}
        <div className="absolute top-6 left-8 z-10 animate-float" style={{ animationDuration: "6s" }}>
          <div className="relative w-20 h-20">
            {/* Rays */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
              <div key={i} className="absolute top-1/2 left-1/2 origin-left"
                style={{ width: 14, height: 4, background: "#ffd600", borderRadius: 4, transform: `rotate(${deg}deg) translateY(-50%)`, marginLeft: 10, opacity: 0.85 }} />
            ))}
            <div className="absolute inset-3 rounded-full" style={{ background: "radial-gradient(circle,#fff176 20%,#ffd600 70%,#ffab00 100%)", boxShadow: "0 0 24px 8px rgba(255,214,0,0.5)" }} />
          </div>
        </div>

        {/* ── Clouds Layer 1 (back, light) ── */}
        <div className="absolute top-8 left-[20%] animate-float-delay-2" style={{ animationDuration: "9s" }}>
          <div className="relative w-52 h-16 opacity-80">
            <div className="absolute bottom-0 left-4 w-44 h-10 bg-white rounded-full" />
            <div className="absolute bottom-5 left-12 w-28 h-14 bg-white rounded-full" />
            <div className="absolute bottom-2 left-0 w-18 h-9 bg-white rounded-full" />
          </div>
        </div>
        <div className="absolute top-10 right-[15%] animate-float-delay-1" style={{ animationDuration: "11s" }}>
          <div className="relative w-64 h-20 opacity-80">
            <div className="absolute bottom-0 left-4 w-56 h-12 bg-white rounded-full" />
            <div className="absolute bottom-6 left-14 w-36 h-16 bg-white rounded-full" />
            <div className="absolute bottom-2 left-0 w-20 h-10 bg-white rounded-full" />
            <div className="absolute bottom-4 right-0 w-24 h-12 bg-white rounded-full" />
          </div>
        </div>
        <div className="absolute top-4 left-[55%] animate-float" style={{ animationDuration: "7s" }}>
          <div className="relative w-36 h-12 opacity-70">
            <div className="absolute bottom-0 left-2 w-30 h-8 bg-white rounded-full" />
            <div className="absolute bottom-3 left-8 w-18 h-11 bg-white rounded-full" />
          </div>
        </div>

        {/* ── Cloud Layer 2 (sides, big white scallops at bottom) ── */}
        <div className="absolute bottom-16 left-0 w-[280px] opacity-90" style={{ pointerEvents: "none" }}>
          <div className="relative h-28">
            <div className="absolute bottom-0 left-0 w-52 h-16 bg-white rounded-full" />
            <div className="absolute bottom-8 left-8 w-40 h-20 bg-white rounded-full" />
            <div className="absolute bottom-4 left-24 w-32 h-14 bg-white rounded-full" />
          </div>
        </div>
        <div className="absolute bottom-16 right-0 w-[280px] opacity-90" style={{ pointerEvents: "none" }}>
          <div className="relative h-28">
            <div className="absolute bottom-0 right-0 w-52 h-16 bg-white rounded-full" />
            <div className="absolute bottom-8 right-8 w-40 h-20 bg-white rounded-full" />
            <div className="absolute bottom-4 right-24 w-32 h-14 bg-white rounded-full" />
          </div>
        </div>

        {/* ── Offer badge ── */}
        <div className="relative z-20 pt-8 hidden md:flex justify-center">
          <div className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 font-black text-xs uppercase tracking-widest px-6 py-2 rounded-full shadow-lg border-2 border-yellow-300">
            🎉 Get upto 30% off on Kids Collection — Limited Time!
          </div>
        </div>

        {/* ── Main hero text (centred over the image) ── */}
        <div className="relative z-20 text-center px-4 pt-10 pb-6 flex flex-col items-center">
          {/* Subtle glow behind text for legibility over clouds */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/40 blur-[50px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-block mb-4 px-4 py-1.5 bg-white/40 backdrop-blur-md rounded-full border border-white/50 text-[#0B1E3F] font-black text-xs tracking-[0.25em] uppercase shadow-sm">
              NextGen Exclusives
            </div>

            <h1 className="text-[3.5rem] md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1] md:leading-[0.95] text-[#0B1E3F] drop-shadow-sm">
              <span className="block">Kids Premium</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 mt-2 pb-2">
                Fashion
              </span>
            </h1>

            <p className="text-[#0B1E3F]/80 font-black text-base md:text-xl mt-5 mb-8 max-w-md mx-auto tracking-wide">
              Designed for play <span className="text-pink-500 mx-1">•</span> Built to last <span className="text-pink-500 mx-1">•</span> Made to love
            </p>

            <Link href="/shop">
              <button className="h-14 px-10 md:px-14 rounded-full font-black text-sm md:text-base text-white shadow-xl hover:scale-105 active:scale-95 transition-all border border-white/20 group relative overflow-hidden"
                style={{ background: "linear-gradient(135deg,#e91e63,#f44336)", boxShadow: "0 8px 32px rgba(233,30,99,0.4)" }}>
                <span className="relative z-10 flex items-center justify-center gap-2 tracking-widest">SHOP NOW <span className="group-hover:translate-x-1 transition-transform">→</span></span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>
            </Link>
          </div>
        </div>

        {/* ── Baby image — full-width, centred, no split ── */}
        <div className="relative z-10 flex justify-center items-end px-4 translate-y-[16px] md:translate-y-[24px]">
          <div className="relative w-full max-w-3xl">
            {/* Baby playing on ground — prominent like reference */}
            <img
              src="https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=1000"
              alt="Happy baby in NextGen Fashion"
              className="w-full object-cover rounded-t-[4rem] drop-shadow-2xl mx-auto"
              style={{ maxHeight: 380, objectPosition: "top" }}
            />
            {/* Floating stat badges on the image */}
            <div className="absolute top-4 left-4 bg-white rounded-2xl px-4 py-2.5 shadow-xl animate-float flex items-center gap-2 z-30">
              <span className="text-xl">⭐</span>
              <div><p className="font-black text-xs text-zinc-900">4.9 Rating</p><p className="text-[10px] text-zinc-400">12k+ parents</p></div>
            </div>
            <div className="absolute top-4 right-4 bg-yellow-400 rounded-2xl px-4 py-2.5 shadow-xl animate-float-delay-2 z-30">
              <p className="font-black text-xs text-yellow-900">🔥 30% OFF Today</p>
            </div>
            <div className="absolute bottom-8 left-4 bg-white rounded-2xl px-4 py-2.5 shadow-xl animate-float-delay-1 z-30 flex items-center gap-2">
              <span className="text-lg">👗</span>
              <div><p className="font-black text-xs text-zinc-900">100+ Styles</p><p className="text-[10px] text-zinc-400">New Season</p></div>
            </div>
            <div className="absolute bottom-8 right-4 bg-white rounded-2xl px-4 py-2.5 shadow-xl animate-float-delay-3 z-30 flex items-center gap-2">
              <span className="text-lg">📦</span>
              <div><p className="font-black text-xs text-zinc-900">Fast Shipping</p><p className="text-[10px] text-zinc-400">Secure Dispatch</p></div>
            </div>
          </div>
        </div>

        {/* White scallop wave at bottom */}
        <div className="absolute bottom-0 inset-x-0 pointer-events-none z-20">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60C120 60 120 100 240 100C360 100 360 60 480 60C600 60 600 100 720 100C840 100 840 60 960 60C1080 60 1080 100 1200 100C1320 100 1320 60 1440 60V100H0V60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════ LIVE BRAND PULSE ══════════════════════════════════ */}
      <LiveBrandPulse />

      {/* ═══════════════════ CATEGORIES ════════════════════════════════════════ */}
      <section className="py-8 md:py-16 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <AnimatedSection className="text-center mb-10" animation="fade-up">
            <p className="text-sm font-black uppercase tracking-widest text-pink-500 mb-1">Shop by Category</p>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900">
              Something for <span className="text-pink-500">Every Kid</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:grid-cols-8 pt-4 pb-2 md:pb-8 px-6 justify-items-center">
            {categories.map((cat, i) => {
              const shortName = (cat.name || "").length > 12 ? (cat.name || "").slice(0, 12).trim() + "…" : cat.name;
              return (
                <AnimatedSection key={i} animation="zoom-in" delay={i * 60}>
                  <Link href={cat.href}>
                    <div className="group flex flex-col items-center gap-2 cursor-pointer">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-brand-navy/30 transition-all duration-500 relative border-2 border-transparent group-hover:border-brand-navy">
                        {cat.image ? (
                          <>
                            <Image
                              src={cat.image}
                              alt={cat.name}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {(() => {
                              const [c1, c2] = pickColors(cat.name);
                              const Icon = getCategoryIcon(cat.name);
                              return (
                                <div className="absolute right-1 bottom-1 rounded-full p-1 shadow-md" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                                  <Icon className="w-3 h-3 text-white" />
                                </div>
                              );
                            })()}
                          </>
                        ) : (
                          (() => {
                            const [c1, c2] = pickColors(cat.name);
                            const emoji = getCategoryEmoji(cat.name);
                            return (
                              <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                                <span className="text-xl md:text-2xl">{emoji}</span>
                              </div>
                            );
                          })()
                        )}
                      </div>
                      <p className="font-black text-[9px] md:text-[10px] text-zinc-500 group-hover:text-brand-navy transition-colors uppercase tracking-[0.2em] w-20 md:w-24 text-center truncate">{shortName}</p>
                    </div>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TRENDING PRODUCTS ══════════════════════════════════ */}
      <section className="pt-4 md:pt-16 pb-8 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <AnimatedSection className="text-center mb-10" animation="fade-up">
            <p className="text-sm font-black uppercase tracking-widest text-pink-500 mb-1">Trending Products</p>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900">
              Kids <span className="text-pink-500">Fashion Picks</span>
            </h2>
          </AnimatedSection>

          {visibleFeaturedImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {visibleFeaturedImages.map((item, i) => (
                <AnimatedSection key={item.id} animation="fade-up" delay={i * 70}>
                  <Link href={`/products/${item.product.id}`} className="block group">
                    <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-zinc-100 shadow-lg transition-transform duration-500 group-hover:-translate-y-1">
                      {item.image && item.image.trim() !== "" ? (
                        <Image
                          src={item.image}
                          alt={item.product.name || "Product image"}
                          fill
                          className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full opacity-10">
                          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="64" height="64" rx="16" fill="#e0e7ef" />
                            <path d="M20 44L44 20M44 44L20 20" stroke="#b3b9c9" strokeWidth="4" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <p className="font-black text-lg tracking-tight line-clamp-1">{item.product.name}</p>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-12 text-center rounded-3xl border border-zinc-200 bg-zinc-50">
              <p className="text-zinc-500 text-base md:text-lg font-medium">
                No featured products are available right now.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════ PROMO BANNERS GRID ═════════════════════════════════ */}
      <AnimatedSection animation="fade-up">
        <section className="pb-16 bg-white">
          <div className="container mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Banner 1 — Boys */}
              <div className="relative rounded-3xl overflow-hidden h-24 md:h-48 flex items-center px-4 md:px-8 shadow-lg group cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-500"
                style={{ background: "linear-gradient(135deg,#ffd600,#ff6f00)" }}>
                <div className="relative z-10 flex w-full items-center justify-between md:block md:w-auto">
                  <div>
                    <p className="text-white/80 font-black text-[10px] md:text-xs uppercase tracking-widest mb-1">Play Like</p>
                    <h3 className="text-xl md:text-3xl font-black text-white leading-tight whitespace-nowrap">Boy Toys<span className="hidden md:inline"><br /></span><span className="md:hidden"> </span>&amp; Fashion</h3>
                  </div>
                  <Link href="/shop?category=boys" className="ml-2 relative z-20 shrink-0">
                    <button className="md:mt-4 bg-white text-yellow-700 font-black text-[10px] md:text-xs uppercase tracking-widest px-4 py-2 md:px-5 md:py-2 rounded-full group-hover:bg-yellow-50 group-hover:scale-105 transition-all">
                      SHOP ONLINE
                    </button>
                  </Link>
                </div>
                <div className="absolute right-4 bottom-0 text-5xl md:text-7xl opacity-70 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">🧢</div>
              </div>

              {/* Banner 2 — Big Discount */}
              <div className="relative rounded-3xl overflow-hidden h-24 md:h-48 flex items-center px-4 md:px-8 shadow-lg group cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-500"
                style={{ background: "linear-gradient(135deg,#43a047,#1de9b6)" }}>
                <div className="relative z-10 flex w-full items-center justify-between md:block md:w-auto">
                  <div>
                    <p className="text-white/80 font-black text-[10px] md:text-xs uppercase tracking-widest mb-1">Special Deal</p>
                    <h3 className="text-xl md:text-3xl font-black text-white leading-tight whitespace-nowrap">Big<span className="hidden md:inline"><br /></span><span className="md:hidden"> </span>Discount</h3>
                    <div className="mt-1 bg-yellow-400 text-yellow-900 font-black text-[10px] md:text-lg px-3 py-0.5 md:px-4 md:py-1 rounded-full inline-block group-hover:scale-110 transition-transform">50% OFF</div>
                    <div className="hidden md:block h-3" />
                  </div>
                  <Link href="/shop" className="ml-2 relative z-20 shrink-0">
                    <button className="md:mt-3 bg-white text-green-700 font-black text-[10px] md:text-xs uppercase tracking-widest px-4 py-2 md:px-5 md:py-2 rounded-full group-hover:bg-green-50 group-hover:scale-105 transition-all block">
                      SHOP NOW
                    </button>
                  </Link>
                </div>
                <div className="absolute right-4 bottom-0 text-5xl md:text-7xl opacity-70 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">🎉</div>
              </div>

              {/* Banner 3 — Elite Selection */}
              <div className="relative rounded-3xl overflow-hidden h-24 md:h-48 flex items-center px-4 md:px-8 shadow-lg group cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-500"
                style={{ background: "linear-gradient(135deg,#ff8a80,#e91e63)" }}>
                <div className="relative z-10 flex w-full items-center justify-between md:block md:w-auto">
                  <div>
                    <p className="text-white/80 font-black text-[10px] md:text-xs uppercase tracking-widest mb-1">Style Update</p>
                    <div className="bg-white/30 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-full text-white font-black text-[10px] md:text-sm mb-1 md:mb-2 inline-block">Premium Range</div>
                    <h3 className="text-xl md:text-3xl font-black text-white leading-tight whitespace-nowrap">Elite 👗<span className="hidden md:inline"><br /></span><span className="md:hidden"> </span>Selection</h3>
                  </div>
                  <Link href="/shop" className="ml-2 relative z-20 shrink-0">
                    <button className="md:mt-3 bg-white text-pink-700 font-black text-[10px] md:text-xs uppercase tracking-widest px-4 py-2 md:px-5 md:py-2 rounded-full group-hover:bg-pink-50 group-hover:scale-105 transition-all">
                      SHOP ONLINE
                    </button>
                  </Link>
                </div>
                <div className="absolute right-4 bottom-0 text-5xl md:text-7xl opacity-20 group-hover:opacity-40 transition-opacity">✨</div>
              </div>
            </div>

            {/* Full-width banner */}
            <div className="mt-5 relative rounded-3xl overflow-hidden h-24 md:h-36 flex flex-row items-center justify-between px-4 md:px-10 shadow-lg group cursor-pointer hover:shadow-2xl transition-all duration-500"
              style={{ background: "linear-gradient(90deg,#29b6f6 0%,#0288d1 50%,#01579b 100%)" }}>
              <div className="absolute inset-0 bg-brand-mesh opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="relative z-10 text-left mb-0">
                <p className="text-white/70 font-black text-[10px] md:text-xs uppercase tracking-widest mb-1">New Arrivals</p>
                <h3 className="text-xl sm:text-2xl md:text-4xl font-black text-white whitespace-nowrap">Kids Collection {new Date().getFullYear()}</h3>
              </div>
              <Link href="/shop" className="relative z-10 flex-shrink-0">
                <button className="bg-yellow-400 text-blue-900 font-black text-[10px] md:text-xs uppercase tracking-widest px-4 py-2 md:px-6 md:py-3 rounded-full hover:bg-yellow-300 group-hover:scale-105 transition-all shadow-lg active:scale-95 whitespace-nowrap">
                  SHOP NOW →
                </button>
              </Link>
              <div className="absolute right-10 top-0 bottom-0 hidden md:flex items-center opacity-10 group-hover:opacity-30 transition-opacity">
                <div className="flex gap-4 text-5xl">🎒 👗 👟</div>
              </div>
            </div>
            {/* Decorative emojis */}
            <span className="absolute right-32 top-4 text-5xl opacity-60 animate-float">👗</span>
            <span className="absolute right-16 bottom-4 text-4xl opacity-60 animate-float-delay-2">👟</span>
            <span className="absolute right-56 top-8 text-3xl opacity-40 animate-float-delay-1">🎒</span>
          </div>
        </section>
      </AnimatedSection>



      {/* ═══════════════════ TOP PERFORMING CATEGORIES ═════════════════════════ */}
      <section className="py-16 bg-white border-t border-zinc-100">
        <div className="container mx-auto px-6 md:px-12">
          <AnimatedSection className="text-center mb-10" animation="fade-up">
            <p className="text-sm font-black uppercase tracking-widest text-pink-500 mb-1">Discover More</p>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900">Top Performing <span className="text-pink-500">Categories</span></h2>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {discoverCards.length > 0 ? discoverCards.map((card, i) => (
              <AnimatedSection key={i} animation="fade-up" delay={i * 100}>
                <Link href={card.link}>
                  <div className="group relative rounded-3xl overflow-hidden aspect-[4/5] shadow-md hover:shadow-xl transition-all duration-300 bg-zinc-100">
                    {card.img && card.img.trim() !== "" ? (
                      <Image
                        src={card.img}
                        alt={card.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full opacity-10">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="64" height="64" rx="16" fill="#e0e7ef" />
                          <path d="M20 44L44 20M44 44L20 20" stroke="#b3b9c9" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                      <h3 className="text-white font-black text-xl tracking-wide group-hover:text-pink-300 transition-colors">{card.name}</h3>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            )) : (
              <div className="col-span-2 md:col-span-4 rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 py-20 text-center text-zinc-500">
                No uploaded product images available for Discover More yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════ NEWSLETTER ══════════════════════════════════════ */}
      <AnimatedSection animation="fade-up">
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 md:px-12 text-center">
            <div className="text-5xl mb-5">💌</div>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight mb-3">Be First to Know!</h2>
            <p className="text-zinc-500 font-medium mb-8 max-w-lg mx-auto">
              Exclusive drops, seasonal sales & style guides — straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto w-full px-4 md:px-0">
              <input type="email" placeholder="your@email.com"
                className="w-full sm:flex-1 h-16 md:h-14 px-8 rounded-full bg-zinc-100 border-2 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 text-base font-bold focus:outline-none focus:border-brand-navy focus:ring-4 focus:ring-brand-navy/10 transition-all shadow-inner" />
              <Button className="h-16 md:h-14 px-10 rounded-full font-black text-sm md:text-base border-0 text-white whitespace-nowrap shadow-lg hover:scale-105 active:scale-95 transition-all bg-brand-navy hover:bg-brand-navy/90 w-full sm:w-auto">
                JOIN THE CLUB
              </Button>
            </div>
            <p className="text-zinc-400 text-xs font-bold mt-4 uppercase tracking-widest">No spam. Unsubscribe anytime.</p>
          </div>
        </section>
      </AnimatedSection>

    </div>
  );
}

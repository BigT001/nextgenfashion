export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Star, Truck, ShieldCheck, Gift, Award,
  RefreshCw, Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GetProductsService } from "@/modules/products/services/get-products.service";
import { ProductCard } from "@/modules/products/components/product-card";
import { LiveBrandPulse } from "@/modules/brand/components/live-brand-pulse";
import { AnimatedSection } from "@/components/ui/animated-section";
import { ProductQueries } from "@/modules/products/queries/product.queries";

export default async function LandingPage() {
  let featuredProducts: any[] = [];
  let dbCategories: any[] = [];
  try {
    const [products, cats] = await Promise.all([
      GetProductsService.findFeatured(8),
      ProductQueries.findCategories()
    ]);
    featuredProducts = products;
    dbCategories = cats;
  } catch {
    featuredProducts = [];
    dbCategories = [];
  }

  const categories = dbCategories.map(cat => {
    // Priority: 1. Dedicated Category Image, 2. First Product Image, 3. Null (show fallback icon)
    const displayImage = cat.image || (cat.products?.[0]?.images?.[0]) || null;

    return {
      name: cat.name,
      image: displayImage,
      href: `/shop?category=${cat.id}`
    };
  });

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
        <div className="relative z-20 text-center px-4 pt-6 pb-2">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight" style={{ color: "#0B1E3F", textShadow: "0 2px 8px rgba(255,255,255,0.6)" }}>
            Kids Premium <span style={{ color: "#e91e63" }}>Fashion</span>
          </h1>
          <p className="text-blue-900/80 font-semibold text-lg mt-2 mb-6">
            Designed for play · Built to last · Made to love
          </p>
          <Link href="/shop">
            <button className="h-14 px-12 rounded-full font-black text-base text-white shadow-2xl hover:scale-105 active:scale-95 transition-all border-0"
              style={{ background: "linear-gradient(135deg,#e91e63,#f44336)", boxShadow: "0 8px 32px rgba(233,30,99,0.4)" }}>
              SHOP NOW →
            </button>
          </Link>
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
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <AnimatedSection className="text-center mb-10" animation="fade-up">
            <p className="text-sm font-black uppercase tracking-widest text-pink-500 mb-1">Shop by Category</p>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900">
              Something for <span className="text-pink-500">Every Kid</span>
            </h2>
          </AnimatedSection>

          <div className="flex items-center gap-5 md:gap-8 overflow-x-auto py-4 pb-8 scrollbar-hide px-6 md:justify-center">
            {categories.map((cat, i) => (
              <AnimatedSection key={i} animation="zoom-in" delay={i * 60} className="flex-shrink-0">
                <Link href={cat.href}>
                  <div className="group flex flex-col items-center gap-3 cursor-pointer">
                    <div className="w-14 h-14 md:w-18 md:h-18 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-brand-navy/30 transition-all duration-500 relative border-2 border-transparent group-hover:border-brand-navy">
                      {cat.image ? (
                        <Image 
                          src={cat.image} 
                          alt={cat.name} 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-300">
                          <Gift className="size-6 opacity-40" />
                        </div>
                      )}
                    </div>
                    <p className="font-black text-[9px] md:text-[10px] text-zinc-500 group-hover:text-brand-navy transition-colors uppercase tracking-[0.2em]">{cat.name}</p>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TRENDING PRODUCTS ══════════════════════════════════ */}
      <section className="pt-16 pb-8 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <AnimatedSection className="text-center mb-10" animation="fade-up">
            <p className="text-sm font-black uppercase tracking-widest text-pink-500 mb-1">Trending Products</p>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900">
              Kids <span className="text-pink-500">Fashion Picks</span>
            </h2>
          </AnimatedSection>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {featuredProducts.slice(0, 8).map((product, i) => (
                <AnimatedSection key={product.id} animation="fade-up" delay={i * 70}>
                  <ProductCard product={product} />
                </AnimatedSection>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {[
                { id: "mock1", name: "Premium Kids Set", price: 15000, category: { name: "Boys" }, images: ["https://images.unsplash.com/photo-1519241047957-be31d7379a5d?auto=format&fit=crop&q=80&w=600"] },
                { id: "mock2", name: "Summer Dress", price: 12500, category: { name: "Girls" }, images: ["https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=600"] },
                { id: "mock3", name: "Baby Sneakers", price: 8000, category: { name: "Footwear" }, images: ["https://images.unsplash.com/photo-1529604278261-8bfcb381165f?auto=format&fit=crop&q=80&w=600"] },
                { id: "mock4", name: "Cozy Jacket", price: 21000, category: { name: "Winter" }, images: ["https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=600"] }
              ].map((product, i) => (
                <AnimatedSection key={product.id} animation="fade-up" delay={i * 70}>
                  <ProductCard product={product as any} />
                </AnimatedSection>
              ))}
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
              <div className="relative rounded-3xl overflow-hidden h-48 flex items-center px-8 shadow-lg group cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-500"
                style={{ background: "linear-gradient(135deg,#ffd600,#ff6f00)" }}>
                <div className="relative z-10">
                  <p className="text-white/80 font-black text-xs uppercase tracking-widest mb-1">Play Like</p>
                  <h3 className="text-3xl font-black text-white leading-tight">Boy Toys<br />&amp; Fashion</h3>
                  <Link href="/shop?category=boys">
                    <button className="mt-4 bg-white text-yellow-700 font-black text-xs uppercase tracking-widest px-5 py-2 rounded-full group-hover:bg-yellow-50 group-hover:scale-105 transition-all">
                      SHOP ONLINE
                    </button>
                  </Link>
                </div>
                <div className="absolute right-4 bottom-0 text-7xl opacity-70 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">🧢</div>
              </div>

              {/* Banner 2 — Big Discount */}
              <div className="relative rounded-3xl overflow-hidden h-48 flex items-center px-8 shadow-lg group cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-500"
                style={{ background: "linear-gradient(135deg,#43a047,#1de9b6)" }}>
                <div className="relative z-10">
                  <p className="text-white/80 font-black text-xs uppercase tracking-widest mb-1">Special Deal</p>
                  <h3 className="text-3xl font-black text-white leading-tight">Big<br />Discount</h3>
                  <div className="mt-1 bg-yellow-400 text-yellow-900 font-black text-lg px-4 py-1 rounded-full inline-block group-hover:scale-110 transition-transform">50% OFF</div>
                  <br />
                  <Link href="/shop">
                    <button className="mt-3 bg-white text-green-700 font-black text-xs uppercase tracking-widest px-5 py-2 rounded-full group-hover:bg-green-50 group-hover:scale-105 transition-all">
                      SHOP NOW
                    </button>
                  </Link>
                </div>
                <div className="absolute right-4 bottom-0 text-7xl opacity-70 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">🎉</div>
              </div>

              {/* Banner 3 — Elite Selection */}
              <div className="relative rounded-3xl overflow-hidden h-48 flex items-center px-8 shadow-lg group cursor-pointer hover:-translate-y-1 hover:shadow-2xl transition-all duration-500"
                style={{ background: "linear-gradient(135deg,#ff8a80,#e91e63)" }}>
                <div className="relative z-10">
                  <p className="text-white/80 font-black text-xs uppercase tracking-widest mb-1">Style Update</p>
                  <div className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-white font-black text-sm mb-2 inline-block">Premium Range</div>
                  <h3 className="text-3xl font-black text-white leading-tight">Elite 👗<br />Selection</h3>
                  <Link href="/shop">
                    <button className="mt-3 bg-white text-pink-700 font-black text-xs uppercase tracking-widest px-5 py-2 rounded-full group-hover:bg-pink-50 group-hover:scale-105 transition-all">
                      SHOP ONLINE
                    </button>
                  </Link>
                </div>
                <div className="absolute right-4 bottom-0 text-7xl opacity-20 group-hover:opacity-40 transition-opacity">✨</div>
              </div>
            </div>

            {/* Full-width banner */}
            <div className="mt-5 relative rounded-3xl overflow-hidden h-36 flex items-center px-10 shadow-lg group cursor-pointer hover:shadow-2xl transition-all duration-500"
              style={{ background: "linear-gradient(90deg,#29b6f6 0%,#0288d1 50%,#01579b 100%)" }}>
              <div className="absolute inset-0 bg-brand-mesh opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="relative z-10">
                <p className="text-white/70 font-black text-xs uppercase tracking-widest mb-1">New Arrivals</p>
                <h3 className="text-3xl md:text-4xl font-black text-white">Kids Collection {new Date().getFullYear()}</h3>
              </div>
              <Link href="/shop" className="ml-6 relative z-10">
                <button className="bg-yellow-400 text-blue-900 font-black text-xs uppercase tracking-widest px-6 py-3 rounded-full hover:bg-yellow-300 group-hover:scale-105 transition-all shadow-lg active:scale-95">
                  SHOP NOW →
                </button>
              </Link>
              <div className="absolute right-10 top-0 bottom-0 flex items-center opacity-10 group-hover:opacity-30 transition-opacity">
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
            {[
              { name: "Summer Vibes", img: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=600", link: "/shop?category=summer" },
              { name: "Party Wear", img: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=600", link: "/shop?category=party" },
              { name: "Tiny Steps", img: "https://images.unsplash.com/photo-1519241047957-be31d7379a5d?auto=format&fit=crop&q=80&w=600", link: "/shop?category=footwear" },
              { name: "Accessories", img: "https://images.unsplash.com/photo-1529604278261-8bfcb381165f?auto=format&fit=crop&q=80&w=600", link: "/shop?category=accessories" }
            ].map((cat, i) => (
              <AnimatedSection key={i} animation="fade-up" delay={i * 100}>
                <Link href={cat.link}>
                  <div className="group relative rounded-3xl overflow-hidden aspect-[4/5] shadow-md hover:shadow-xl transition-all duration-300">
                    <Image
                      src={cat.img}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                      <h3 className="text-white font-black text-xl tracking-wide group-hover:text-pink-300 transition-colors">{cat.name}</h3>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
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
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" placeholder="your@email.com"
                className="flex-1 h-14 px-6 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 text-sm font-bold focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all shadow-inner" />
              <Button className="h-14 px-8 rounded-full font-black text-sm border-0 text-white whitespace-nowrap shadow-md hover:shadow-lg transition-all"
                style={{ background: "linear-gradient(135deg,#e91e63,#f44336)" }}>
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

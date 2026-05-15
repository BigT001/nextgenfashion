import Link from "next/link";
import {
  ArrowRight, Star, Sparkles, ShieldCheck, Truck,
  ChevronRight, Gift, Award, Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GetProductsService } from "@/modules/products/services/get-products.service";
import { LiveBrandPulse } from "@/modules/brand/components/live-brand-pulse";
import { ProductCard } from "@/modules/products/components/product-card";
import { AnimatedSection } from "@/components/ui/animated-section";

export default async function LandingPage() {
  let featuredProducts: any[] = [];
  try {
    featuredProducts = await GetProductsService.findFeatured(8);
  } catch {
    featuredProducts = [];
  }

  const categories = [
    { name: "Boys Collection", tag: "NEW SEASON", emoji: "🧢", bg: "from-sky-400 to-blue-600", items: "32 Styles" },
    { name: "Girls Collection", tag: "TRENDING", emoji: "🎀", bg: "from-rose-400 to-pink-600", items: "45 Styles" },
    { name: "Mini Ones", tag: "0–3 YRS", emoji: "🍭", bg: "from-amber-400 to-orange-500", items: "28 Styles" },
    { name: "School Ready", tag: "ESSENTIALS", emoji: "📚", bg: "from-emerald-400 to-teal-600", items: "18 Styles" },
  ];

  const perks = [
    { icon: Truck, title: "Fast Delivery", desc: "Next-day shipping across Nigeria — from Lagos to your door.", col: "bg-sky-50 text-sky-600" },
    { icon: ShieldCheck, title: "Safe & Certified", desc: "All fabrics are child-safe, allergy-tested & compliant.", col: "bg-emerald-50 text-emerald-600" },
    { icon: Gift, title: "Gift Wrapping", desc: "Make every moment special with our free premium gift wrap.", col: "bg-rose-50 text-rose-600" },
    { icon: Award, title: "Best Quality", desc: "Premium stitching & durable materials built for playtime.", col: "bg-amber-50 text-amber-600" },
  ];

  const testimonials = [
    { name: "Adaeze O.", city: "Lagos", text: "My daughter refuses to wear anything else! The quality is amazing.", stars: 5, color: "#f472b6" },
    { name: "Emeka P.", city: "Abuja", text: "Fast delivery and the clothes look even better in person. 10/10!", stars: 5, color: "#38bdf8" },
    { name: "Fatima K.", city: "Kano", text: "My twins love their outfits. Great colours, great quality!", stars: 5, color: "#fbbf24" },
  ];

  return (
    <div className="flex flex-col bg-white overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════
          HERO — brand-navy dark bg + Cloudinary kids image mosaic
      ═══════════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-[95vh] flex items-center overflow-hidden"
        style={{ backgroundColor: "#0B1E3F" }}
      >
        {/* Subtle radial glow - brand colour, not purple */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full blur-[140px] opacity-20 animate-blob-1"
          style={{ background: "radial-gradient(circle, #1e4080, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-15 animate-blob-2"
          style={{ background: "radial-gradient(circle, #f472b6, transparent 70%)" }} />

        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="container mx-auto px-6 md:px-12 relative z-10 py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* ── LEFT: Copy ── */}
            <div className="space-y-8 animate-hero-left">
              <div className="inline-flex items-center gap-2 border border-white/15 rounded-full px-5 py-2.5"
                style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
                <Sparkles className="size-4 text-yellow-400 animate-pulse" />
                <span className="text-white text-[11px] font-black uppercase tracking-widest">New Season 2025 — Just Dropped</span>
              </div>

              <h1 className="text-5xl md:text-[4.5rem] lg:text-7xl font-black text-white leading-[0.88] tracking-tighter">
                WHERE KIDS<br />
                <span className="hero-gradient-text">DRESS BOLD</span><br />
                &amp; PLAY FREE.
              </h1>

              <p className="text-blue-200/70 text-lg md:text-xl leading-relaxed max-w-lg font-medium">
                Premium kidswear that keeps up with every adventure — designed to spark joy, built to last.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/shop">
                  <Button size="lg" className="h-16 px-10 rounded-2xl font-black text-base border-0 shadow-2xl btn-gradient active:scale-95 transition-all">
                    SHOP THE COLLECTION
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline"
                    className="h-16 px-10 rounded-2xl font-black text-base border-white/20 text-white hover:bg-white/10 active:scale-95 transition-all"
                    style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
                    OUR STORY
                  </Button>
                </Link>
              </div>

              {/* Social proof row */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["#f472b6","#38bdf8","#fbbf24","#4ade80"].map((c, i) => (
                      <div key={i} className="size-9 rounded-full border-2 border-white/30 flex items-center justify-center text-xs font-black text-white"
                        style={{ background: c }}>
                        {["E","A","F","K"][i]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex gap-0.5">{[...Array(5)].map((_,i)=><Star key={i} className="size-3 fill-yellow-400 text-yellow-400"/>)}</div>
                    <p className="text-blue-200/60 text-xs font-bold mt-0.5">12,000+ happy parents</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div><p className="text-white font-black text-lg">₦0</p><p className="text-blue-200/50 text-[10px] font-bold uppercase tracking-widest">Delivery on ₦15k+</p></div>
                <div className="w-px h-8 bg-white/10" />
                <div><p className="text-white font-black text-lg">100%</p><p className="text-blue-200/50 text-[10px] font-bold uppercase tracking-widest">Child-Safe</p></div>
              </div>
            </div>

            {/* ── RIGHT: Kids Image Mosaic ── */}
            <div className="relative h-[520px] hidden lg:block animate-hero-right">

              {/* Main large image — top left */}
              <div className="absolute top-0 left-0 w-[52%] h-[62%] rounded-[2rem] overflow-hidden shadow-2xl animate-float ring-4 ring-white/10">
                {/* Cloudinary: happy kid in colourful outfit, transformed to face-crop */}
                <img
                  src="https://res.cloudinary.com/dzkcu4tqf/image/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/samples/upscale-face-1.jpg"
                  alt="Happy kid"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/40 to-transparent" />
              </div>

              {/* Second image — bottom right */}
              <div className="absolute bottom-0 right-0 w-[55%] h-[60%] rounded-[2rem] overflow-hidden shadow-2xl animate-float-delay-2 ring-4 ring-white/10">
                <img
                  src="https://res.cloudinary.com/dzkcu4tqf/image/upload/w_500,h_420,c_fill,g_face,q_auto,f_auto/samples/woman-on-a-football-field.jpg"
                  alt="Kids playing"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/40 to-transparent" />
              </div>

              {/* Third image — small, overlapping centre */}
              <div className="absolute top-[30%] right-[5%] w-[38%] h-[44%] rounded-[1.5rem] overflow-hidden shadow-2xl animate-float-delay-1 ring-4 ring-white/10 z-10">
                <img
                  src={featuredProducts[0]?.images?.[0]
                    ? `https://res.cloudinary.com/dzkcu4tqf/image/upload/w_300,h_360,c_fill,q_auto,f_auto/${featuredProducts[0].images[0].split('/upload/')[1]}`
                    : "https://res.cloudinary.com/dzkcu4tqf/image/upload/w_300,h_360,c_fill,q_auto,f_auto/nextgenfashion/products/jg50ca0bnyd5byuqcr4p.jpg"
                  }
                  alt="Featured product"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="bg-white/90 backdrop-blur-md text-zinc-900 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    🔥 Trending Now
                  </span>
                </div>
              </div>

              {/* Floating badge — top right */}
              <div className="absolute top-4 right-4 bg-white rounded-2xl px-4 py-3 shadow-2xl z-20 animate-float-delay-3 flex items-center gap-2">
                <div className="flex gap-0.5">{[...Array(5)].map((_,i)=><Star key={i} className="size-3 fill-yellow-400 text-yellow-400"/>)}</div>
                <span className="text-xs font-black text-zinc-900">4.9 Rating</span>
              </div>

              {/* Floating badge — bottom left */}
              <div className="absolute bottom-4 left-4 bg-white rounded-2xl px-4 py-3 shadow-2xl z-20 animate-float-delay-2 flex items-center gap-3">
                <div className="size-8 rounded-xl flex items-center justify-center text-lg bg-rose-50">❤️</div>
                <div><p className="font-black text-sm text-zinc-900">12,000+</p><p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Happy Families</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave — white */}
        <div className="absolute bottom-0 inset-x-0 pointer-events-none">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L60 66.7C120 53.3 240 26.7 360 20C480 13.3 600 26.7 720 33.3C840 40 960 40 1080 33.3C1200 26.7 1320 13.3 1380 6.7L1440 0V80H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ═══════════════════ STATS TICKER ════════════════════════════════════ */}
      <LiveBrandPulse />

      {/* ═══════════════════ CATEGORIES ══════════════════════════════════════ */}
      <section className="py-28 bg-zinc-50">
        <div className="container mx-auto px-6 md:px-12">
          <AnimatedSection className="text-center mb-16 space-y-3" animation="fade-up">
            <Badge className="bg-brand-navy/10 text-brand-navy border-0 font-black text-xs uppercase tracking-widest px-4 py-1.5 rounded-full">
              Shop by Category
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900">
              Something for{" "}
              <span className="hero-gradient-text">every kid.</span>
            </h2>
            <p className="text-zinc-500 text-lg font-medium max-w-xl mx-auto">
              From the playground to the party — we have them covered.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <AnimatedSection key={i} animation="fade-up" delay={i * 100}>
                <Link href="/shop" className="group block">
                  <div className={`relative h-72 rounded-[2rem] bg-gradient-to-br ${cat.bg} overflow-hidden shadow-xl transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-2xl`}>
                    <div className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: "radial-gradient(circle,white 1.5px,transparent 1.5px)", backgroundSize: "18px 18px" }} />
                    <div className="absolute top-5 left-5">
                      <span className="bg-white/25 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/30">
                        {cat.tag}
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-[90px] group-hover:scale-110 transition-transform duration-500">
                      {cat.emoji}
                    </div>
                    <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/45 to-transparent">
                      <h3 className="text-white font-black text-xl tracking-tight">{cat.name}</h3>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{cat.items}</p>
                        <div className="size-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white transition-all duration-300">
                          <ChevronRight className="size-4 text-white group-hover:text-zinc-900 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURED PRODUCTS ═══════════════════════════════ */}
      <section className="py-28 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <AnimatedSection className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6" animation="fade-up">
            <div className="space-y-3">
              <Badge className="bg-rose-100 text-rose-600 border-0 font-black text-xs uppercase tracking-widest px-4 py-1.5 rounded-full">
                ✨ New Arrivals
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900">Fresh off the rack.</h2>
              <p className="text-zinc-500 font-medium max-w-md">Limited pieces dropped weekly — grab yours before they&apos;re gone.</p>
            </div>
            <Link href="/shop" className="group flex items-center gap-2 text-brand-navy font-black text-sm uppercase tracking-widest hover:gap-4 transition-all whitespace-nowrap">
              VIEW ALL <ArrowRight className="size-4" />
            </Link>
          </AnimatedSection>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product, i) => (
                <AnimatedSection key={product.id} animation="zoom-in" delay={i * 80}>
                  <ProductCard product={product} />
                </AnimatedSection>
              ))}
            </div>
          ) : (
            <AnimatedSection className="text-center py-20 space-y-4" animation="fade-up">
              <div className="text-7xl">🛍️</div>
              <h3 className="font-black text-2xl text-zinc-900">New drops coming soon!</h3>
              <p className="text-zinc-500 font-medium">Our team is curating the best pieces for your little ones.</p>
              <Link href="/shop"><Button className="bg-brand-navy text-white rounded-2xl px-8 h-12 font-black mt-2">EXPLORE SHOP</Button></Link>
            </AnimatedSection>
          )}

          {featuredProducts.length > 0 && (
            <AnimatedSection className="text-center mt-16" animation="fade-up">
              <Link href="/shop">
                <Button size="lg" className="h-14 px-12 rounded-2xl font-black text-sm tracking-widest border-2 border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 hover:shadow-xl transition-all">
                  VIEW FULL COLLECTION <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </AnimatedSection>
          )}
        </div>
      </section>

      {/* ═══════════════════ BRAND BANNER ════════════════════════════════════ */}
      <AnimatedSection animation="fade-up">
        <section className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#f472b6 0%,#fb923c 50%,#fbbf24 100%)" }}>
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle,white 2px,transparent 2px)", backgroundSize: "40px 40px" }} />
          {/* Floating emojis */}
          <span className="absolute top-6 left-[10%] text-4xl animate-float opacity-40">🎈</span>
          <span className="absolute top-10 right-[12%] text-3xl animate-float-delay-2 opacity-40">⭐</span>
          <span className="absolute bottom-8 left-[20%] text-3xl animate-float-delay-3 opacity-40">🎉</span>
          <span className="absolute bottom-4 right-[20%] text-4xl animate-float-delay-1 opacity-40">🌈</span>

          <div className="container mx-auto px-6 md:px-12 relative z-10 text-center">
            <div className="text-7xl mb-6 animate-bounce">🎉</div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
              Kids deserve the best.<br />
              <span className="text-white/80 text-3xl md:text-4xl font-black">So do their parents.</span>
            </h2>
            <p className="text-white/80 text-lg font-medium mb-10 max-w-xl mx-auto">
              Free delivery on orders over ₦15,000. Easy returns. No stress — just happy kids.
            </p>
            <Link href="/shop">
              <Button size="lg" className="h-16 px-14 rounded-2xl font-black text-base bg-white text-zinc-900 hover:bg-zinc-100 shadow-2xl active:scale-95 transition-all border-0">
                START SHOPPING NOW <ArrowRight className="ml-2 size-5" />
              </Button>
            </Link>
          </div>
        </section>
      </AnimatedSection>

      {/* ═══════════════════ PERKS ════════════════════════════════════════════ */}
      <section className="py-28 bg-zinc-50">
        <div className="container mx-auto px-6 md:px-12">
          <AnimatedSection className="text-center mb-16" animation="fade-up">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 mb-3">Why parents love us.</h2>
            <p className="text-zinc-500 font-medium">We go above and beyond so you don&apos;t have to worry.</p>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map((perk, i) => (
              <AnimatedSection key={i} animation="fade-up" delay={i * 100}>
                <div className="bg-white rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-zinc-100 h-full">
                  <div className={`size-14 rounded-2xl ${perk.col} flex items-center justify-center mb-6`}>
                    <perk.icon className="size-7" />
                  </div>
                  <h3 className="font-black text-lg text-zinc-900 mb-3">{perk.title}</h3>
                  <p className="text-zinc-500 font-medium text-sm leading-relaxed">{perk.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS ════════════════════════════════════ */}
      <section className="py-28 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <AnimatedSection className="text-center mb-16 space-y-3" animation="fade-up">
            <Badge className="bg-amber-100 text-amber-600 border-0 font-black text-xs uppercase tracking-widest px-4 py-1.5 rounded-full">
              ⭐ Reviews
            </Badge>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900">12,000+ happy families.</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <AnimatedSection key={i} animation="fade-up" delay={i * 120}>
                <div className="bg-zinc-50 rounded-[2rem] p-8 border border-zinc-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                  <div className="flex gap-1 mb-5">
                    {[...Array(t.stars)].map((_,j)=><Star key={j} className="size-4 fill-amber-400 text-amber-400"/>)}
                  </div>
                  <p className="text-zinc-700 font-medium text-base leading-relaxed flex-1 mb-6">&quot;{t.text}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full flex items-center justify-center font-black text-white text-sm"
                      style={{ background: t.color }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-black text-sm text-zinc-900">{t.name}</p>
                      <p className="text-xs text-zinc-400 font-bold">{t.city}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ NEWSLETTER ══════════════════════════════════════ */}
      <AnimatedSection animation="fade-up">
        <section className="py-28" style={{ background: "linear-gradient(135deg,#0B1E3F 0%,#1a3a7c 100%)" }}>
          <div className="container mx-auto px-6 md:px-12 text-center">
            <div className="text-6xl mb-6">💌</div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Be the first to know.</h2>
            <p className="text-zinc-400 font-medium mb-10 max-w-lg mx-auto">
              Exclusive drops, seasonal sales and style guides — straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" placeholder="your@email.com"
                className="flex-1 h-14 px-6 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-zinc-500 text-sm font-bold focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all" />
              <Button className="h-14 px-8 rounded-2xl font-black text-sm border-0 btn-gradient active:scale-95 transition-all whitespace-nowrap">
                JOIN THE CLUB
              </Button>
            </div>
            <p className="text-zinc-600 text-xs font-bold mt-4 uppercase tracking-widest">No spam. Unsubscribe anytime.</p>
          </div>
        </section>
      </AnimatedSection>

    </div>
  );
}

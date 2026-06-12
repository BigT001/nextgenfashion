"use client";

import Link from "next/link";
import {
  ShoppingCart, Search, User, Menu, X, Phone,
  Globe, Share2, MessageSquare, Sparkles,
  Home, ShoppingBag, Info, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useCartStore } from "@/modules/cart/store/cart.store";
import { CartDrawer } from "@/modules/cart/components/cart-drawer";
import { StoreSearch } from "@/modules/products/components/store-search";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SmoothScroll } from "@/components/providers/smooth-scroll";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Boys", href: "/boys" },
  { label: "Girls", href: "/girls" },
  { label: "Contact", href: "/contact" },
  { label: "About", href: "/about" },
];

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { getItemCount, openCart, setOpenCart } = useCartStore();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    // Throttle scroll event to every 150ms for better mobile performance
    let lastCall = 0;
    const throttledScroll = () => {
      const now = Date.now();
      if (now - lastCall >= 150) {
        handleScroll();
        lastCall = now;
      }
    };
    
    window.addEventListener("scroll", throttledScroll, { passive: true });
    return () => window.removeEventListener("scroll", throttledScroll);
  }, []);


  const itemCount = mounted ? getItemCount() : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CartDrawer open={openCart} onOpenChange={setOpenCart} />
      <StoreSearch open={isSearchOpen} setOpen={setIsSearchOpen} />

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex items-center justify-between px-8 py-2 text-white text-[11px] font-bold"
        style={{ background: "#0B1E3F" }}>
        <div className="flex items-center gap-6">
          {/* Social icons with better visibility */}
          <a href="https://www.facebook.com/share/1ESMAQhQjd/" target="_blank" rel="noopener noreferrer" className="text-white hover:scale-110 transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
          </a>
          <a href="https://www.instagram.com/nextgenfashion_official?igsh=MWlzbWV3bG1iZHc4eg==" target="_blank" rel="noopener noreferrer" className="text-white hover:scale-110 transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </a>
          <a href="https://t.me/+yhEgNe0Ir4tkMTgx" target="_blank" rel="noopener noreferrer" className="text-white hover:scale-110 transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </a>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-white font-black tracking-widest"><Phone className="size-3.5" /> 07040913003</span>
        </div>
      </div>

      {/* ── MAIN HEADER ─────────────────────────────────────────────────────── */}
      <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 bg-white shadow-sm"
      )}>
        {/* Logo + Search + Cart row */}
        <div className="flex items-center justify-between px-6 md:px-10 py-3 gap-4 max-w-[1400px] mx-auto">

          {/* LEFT — Search Button + Nav Links */}
          <div className="flex items-center gap-6 flex-1">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="bg-brand-navy text-white rounded-full p-2.5 shadow-md hover:scale-110 transition-all flex-shrink-0 active:scale-95"
            >
              <Search className="size-5" strokeWidth={2.5} />
            </button>
            <nav className="hidden lg:flex items-center gap-6 text-[11px] font-black uppercase text-zinc-700 tracking-widest">
              {[
                { label: "Home", href: "/" },
                { label: "Shop", href: "/shop" },
                { label: "Boys", href: "/boys" },
                { label: "Girls", href: "/girls" }
              ].map((link) => (
                <Link 
                  key={link.label}
                  href={link.href} 
                  className={cn(
                    "relative py-2 flex flex-col items-center transition-colors hover:text-brand-navy group",
                    (pathname === link.href || (link.href !== "/" && pathname.includes(link.href))) && "text-brand-navy"
                  )}
                >
                  {link.label}
                  <span className={cn(
                    "absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 rounded-full bg-brand-navy transition-all duration-300",
                    (pathname === link.href || (link.href !== "/" && pathname.includes(link.href))) ? "w-4 opacity-100" : "w-0 opacity-0 group-hover:w-2 group-hover:opacity-50"
                  )} />
                </Link>
              ))}
            </nav>
          </div>

          {/* CENTRE — Logo */}
          <Link href="/" className="flex flex-col items-center group flex-shrink-0 mx-4">
            <Image
              src="/images/logonextgen.png"
              alt="NextGen Fashion"
              width={160}
              height={56}
              className="object-contain h-8 md:h-12 w-auto group-hover:scale-105 transition-transform"
              priority
            />
          </Link>

          {/* RIGHT — Nav Links + Cart */}
          <div className="flex items-center gap-6 flex-1 justify-end">
            <nav className="hidden lg:flex items-center gap-6 text-[11px] font-black uppercase text-zinc-700 tracking-widest">
              {[
                { label: "Contact", href: "/contact" },
                { label: "About", href: "/about" }
              ].map((link) => (
                <Link 
                  key={link.label}
                  href={link.href} 
                  className={cn(
                    "relative py-2 flex flex-col items-center transition-colors hover:text-brand-navy group",
                    pathname.includes(link.href) && "text-brand-navy"
                  )}
                >
                  {link.label}
                  <span className={cn(
                    "absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 rounded-full bg-brand-navy transition-all duration-300",
                    pathname.includes(link.href) ? "w-4 opacity-100" : "w-0 opacity-0 group-hover:w-2 group-hover:opacity-50"
                  )} />
                </Link>
              ))}

              <Link href={status === "authenticated" ? "/account" : "/auth/login"}>
                <button className="bg-brand-navy hover:bg-brand-navy/90 text-white text-[11px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full transition-all shadow-md hover:scale-105 active:scale-95 ml-2">
                  MY ACCOUNT
                </button>
              </Link>
            </nav>

            <button
              onClick={() => setOpenCart(true)}
              className="relative flex items-center justify-center bg-brand-navy text-white rounded-full p-2.5 shadow-md hover:scale-110 transition-all flex-shrink-0 active:scale-95"
            >
              <ShoppingCart className="size-5" strokeWidth={2.5} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-6" />
            </button>
          </div>
        </div>

        {/* Mobile Nav - Slide-out Drawer from Left */}
        {mounted && (
          <>
            {/* Backdrop overlay */}
            <div 
              className={cn(
                "fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 pointer-events-none opacity-0",
                mobileOpen && "pointer-events-auto opacity-100"
              )}
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer Container */}
            <div 
              className={cn(
                "fixed top-0 bottom-0 left-0 z-[101] w-[300px] sm:w-[340px] bg-white lg:hidden transition-all duration-300 ease-out transform shadow-2xl flex flex-col -translate-x-full",
                mobileOpen && "translate-x-0"
              )}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center">
                  <Image
                    src="/images/logonextgen.png"
                    alt="NextGen Fashion"
                    width={110}
                    height={40}
                    className="object-contain h-8 w-auto"
                  />
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                
                {/* Visual Category Blocks: Boys & Girls */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Shop by Category</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Boys Box */}
                    <Link
                      href="/boys"
                      onClick={() => setMobileOpen(false)}
                      className="relative overflow-hidden rounded-2xl h-24 flex flex-col justify-end p-3 shadow-md hover:shadow-lg transition-all group"
                      style={{ background: "linear-gradient(135deg, #ffd600 0%, #ff6f00 100%)" }}
                    >
                      <div className="absolute top-2 right-2 text-2xl group-hover:scale-110 transition-transform">🧢</div>
                      <div className="relative z-10">
                        <span className="text-[10px] font-black text-white/80 uppercase tracking-wider block">Shop</span>
                        <span className="text-base font-black text-white leading-tight">Boys</span>
                      </div>
                    </Link>

                    {/* Girls Box */}
                    <Link
                      href="/girls"
                      onClick={() => setMobileOpen(false)}
                      className="relative overflow-hidden rounded-2xl h-24 flex flex-col justify-end p-3 shadow-md hover:shadow-lg transition-all group"
                      style={{ background: "linear-gradient(135deg, #ff8a80 0%, #e91e63 100%)" }}
                    >
                      <div className="absolute top-2 right-2 text-2xl group-hover:scale-110 transition-transform">👗</div>
                      <div className="relative z-10">
                        <span className="text-[10px] font-black text-white/80 uppercase tracking-wider block">Shop</span>
                        <span className="text-base font-black text-white leading-tight">Girls</span>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Primary Navigation Links */}
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1 mb-2">Explore</h4>
                  {[
                    { label: "Home", href: "/", icon: Home },
                    { label: "All Products", href: "/shop", icon: ShoppingBag },
                    { label: "About Us", href: "/about", icon: Info },
                    { label: "Contact Us", href: "/contact", icon: Phone },
                  ].map((link, idx) => {
                    const LinkIcon = link.icon;
                    const isActive = pathname === link.href || (link.href !== "/" && pathname.includes(link.href));
                    return (
                      <Link
                        key={idx}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center justify-between py-3.5 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-transparent",
                          isActive 
                            ? "text-[#0B1E3F] bg-zinc-50 border-zinc-100 font-extrabold" 
                            : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <LinkIcon className={cn("size-4", isActive ? "text-[#0B1E3F]" : "text-zinc-400")} />
                          <span>{link.label}</span>
                        </div>
                        <ChevronRight className="size-4 text-zinc-400" />
                      </Link>
                    );
                  })}
                </div>

                {/* Call & Support Section */}
                <div className="pt-2 border-t border-zinc-100">
                  <div className="bg-zinc-50 rounded-2xl p-4 flex items-center gap-3">
                    <div className="bg-[#0B1E3F] text-white p-2.5 rounded-xl shadow-md">
                      <Phone className="size-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Need Assistance?</p>
                      <a href="tel:07040913003" className="text-xs font-black text-[#0B1E3F] hover:underline">07040913003</a>
                    </div>
                  </div>
                </div>

                {/* Socials Section */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Connect With Us</h4>
                  <div className="flex gap-3 px-1">
                    <a 
                      href="https://www.facebook.com/share/1ESMAQhQjd/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="size-9 rounded-xl bg-zinc-50 hover:bg-[#0B1E3F] hover:text-white text-zinc-600 flex items-center justify-center transition-all shadow-sm border border-zinc-100 active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                    </a>
                    <a 
                      href="https://www.instagram.com/nextgenfashion_official?igsh=MWlzbWV3bG1iZHc4eg==" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="size-9 rounded-xl bg-zinc-50 hover:bg-[#0B1E3F] hover:text-white text-zinc-600 flex items-center justify-center transition-all shadow-sm border border-zinc-100 active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    </a>
                    <a 
                      href="https://t.me/+yhEgNe0Ir4tkMTgx" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="size-9 rounded-xl bg-zinc-50 hover:bg-[#0B1E3F] hover:text-white text-zinc-600 flex items-center justify-center transition-all shadow-sm border border-zinc-100 active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    </a>
                  </div>
                </div>

              </div>

              {/* Drawer Footer Account CTA */}
              <div className="p-5 border-t border-zinc-100">
                <Link
                  href={status === "authenticated" ? "/account" : "/auth/login"}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2.5 py-4 px-4 text-xs font-black uppercase tracking-widest text-white bg-[#0B1E3F] rounded-xl transition-all text-center shadow-lg hover:bg-[#0b1e3f]/90 active:scale-95 w-full"
                >
                  <User className="size-4" />
                  <span>{status === "authenticated" ? "My Account" : "Sign In / Register"}</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </header>

      <SmoothScroll>
        {/* ── PAGE CONTENT ────────────────────────────────────────────────────── */}
        <main className="flex-1 relative">{children}</main>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      {(pathname === "/" || pathname === "/about" || pathname === "/contact") && (
        <footer style={{ background: "#0B1E3F" }} className="text-white pt-12 pb-8 relative overflow-hidden border-t border-white/5">
          <div className="absolute inset-0 bg-brand-mesh opacity-5" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-6 mb-10">
              {/* Brand Logo */}
              <Link href="/" className="flex items-center gap-3 justify-center">
                <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-white shadow-md p-1.5">
                  <Image src="/images/logonextgen.png" alt="NextGen Logo" width={28} height={28} className="object-contain" />
                </div>
                <span className="font-black text-xl tracking-tight text-white uppercase">NEXTGEN KIDDIES</span>
              </Link>

              {/* Description */}
              <p className="text-zinc-400 font-medium leading-relaxed text-sm max-w-lg">
                Premium kids' essentials, toys, and fashion designed for play and built to last. Making every child feel confident and comfortable.
              </p>

              {/* Social Icons */}
              <div className="flex gap-4 items-center justify-center pt-2">
                <a 
                  href="https://www.facebook.com/share/1ESMAQhQjd/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="size-11 rounded-full bg-white/10 hover:bg-white hover:text-[#0B1E3F] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-md border border-white/10"
                  aria-label="Facebook"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a 
                  href="https://www.instagram.com/nextgenfashion_official?igsh=MWlzbWV3bG1iZHc4eg==" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="size-11 rounded-full bg-white/10 hover:bg-white hover:text-[#0B1E3F] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-md border border-white/10"
                  aria-label="Instagram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a 
                  href="https://t.me/+yhEgNe0Ir4tkMTgx" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="size-11 rounded-full bg-white/10 hover:bg-white hover:text-[#0B1E3F] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-md border border-white/10"
                  aria-label="Telegram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </a>
              </div>
            </div>

            {/* Bottom Copyright bar */}
            <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3 text-brand-silver" />
                POWERED BY NEXTGEN KIDDIES OS
              </div>
              <p className="text-zinc-600">
                © {mounted ? new Date().getFullYear() : "2026"} NEXTGEN KIDDIES. ALL RIGHTS RESERVED.
              </p>
            </div>
          </div>
        </footer>
      )}
      </SmoothScroll>
    </div>
  );
}

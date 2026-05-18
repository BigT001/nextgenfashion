"use client";

import Link from "next/link";
import {
  ShoppingCart, Search, User, Menu, X, Phone,
  Globe, Share2, MessageSquare, Sparkles,
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getItemCount } = useCartStore();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const itemCount = mounted ? getItemCount() : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
      <StoreSearch open={isSearchOpen} setOpen={setIsSearchOpen} />

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex items-center justify-between px-8 py-2 text-white text-[11px] font-bold"
        style={{ background: "#0B1E3F" }}>
        <div className="flex items-center gap-6">
          {/* Social icons with better visibility */}
          <a href="#" className="text-white hover:scale-110 transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
          </a>
          <a href="#" className="text-white hover:scale-110 transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
          </a>
          <a href="#" className="text-white hover:scale-110 transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </a>
          <a href="#" className="text-white hover:scale-110 transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
          </a>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-white font-black tracking-widest"><Phone className="size-3.5" /> +234 800 NEXTGEN</span>
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
                <button className="bg-pink-500 hover:bg-pink-600 text-white text-[11px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full transition-all shadow-md hover:scale-105 active:scale-95 ml-2">
                  MY ACCOUNT
                </button>
              </Link>
            </nav>

            <button
              onClick={() => setIsCartOpen(true)}
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
                "fixed top-0 bottom-0 left-0 z-[101] w-[280px] bg-white lg:hidden transition-all duration-300 ease-out transform shadow-2xl flex flex-col -translate-x-full",
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
                  className="p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  <X className="size-6" />
                </button>
              </div>

              {/* Drawer Links */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2">
                {navLinks.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block py-3 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                      pathname === link.href 
                        ? "text-white bg-[#0B1E3F] shadow-md shadow-[#0B1E3F]/20" 
                        : "text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Drawer Footer Account CTA */}
              <div className="p-6 border-t border-zinc-100">
                <Link
                  href={status === "authenticated" ? "/account" : "/auth/login"}
                  onClick={() => setMobileOpen(false)}
                  className="block py-4 px-4 text-xs font-black uppercase tracking-widest text-white bg-pink-500 rounded-xl transition-all text-center shadow-lg hover:bg-pink-600 active:scale-95"
                >
                  MY ACCOUNT
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
      {pathname !== "/account" && (
        <footer style={{ background: "#0B1E3F" }} className="text-white pt-20 pb-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-mesh opacity-10" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
              <div className="space-y-6">
                <Link href="/" className="flex items-center gap-3">
                  <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-white shadow-xl p-1">
                    <Image src="/images/logonextgen.png" alt="NextGen Logo" width={32} height={32} className="object-contain" />
                  </div>
                  <span className="font-black text-lg tracking-tight text-white">NEXTGEN KIDDIES</span>
                </Link>
                <p className="text-zinc-400 font-medium leading-relaxed max-w-xs text-sm">
                  Premium kidswear designed for play and built to last. Making every child feel confident and comfortable.
                </p>
                <div className="flex gap-3">
                  {[Globe, Share2, MessageSquare].map((Icon, i) => (
                    <Button key={i} variant="ghost" size="icon" className="size-10 rounded-2xl bg-white/10 border border-white/10 hover:bg-pink-500 hover:border-pink-500 transition-all">
                      <Icon className="size-4" />
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-6 text-pink-400">SHOP</h4>
                <ul className="space-y-3 text-sm font-bold text-zinc-400">
                  {["Boys Collection", "Girls Collection", "Baby Wear", "School Essentials", "Sale"].map((item) => (
                    <li key={item}><Link href="/shop" className="hover:text-white transition-colors">{item}</Link></li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-6 text-pink-400">HELP</h4>
                <ul className="space-y-3 text-sm font-bold text-zinc-400">
                  {["Shipping Info", "Returns & Refunds", "Size Guide", "Track Order", "Contact Us"].map((item) => (
                    <li key={item}><Link href="/contact" className="hover:text-white transition-colors">{item}</Link></li>
                  ))}
                </ul>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-pink-400">NEWSLETTER</h4>
                <p className="text-sm font-medium text-zinc-400 leading-relaxed">Get exclusive deals and new arrivals straight to your inbox.</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Your email..."
                    className="flex-1 h-11 px-4 rounded-full bg-white/10 border border-white/10 text-xs font-bold focus:ring-1 focus:ring-pink-500 outline-none text-white placeholder:text-zinc-500"
                  />
                  <Button className="h-11 px-4 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-black text-xs border-0">
                    JOIN
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                <Sparkles className="size-3 text-pink-400" />
                POWERED BY NEXTGEN KIDDIES OS
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                © 2025 NEXTGEN KIDDIES. ALL RIGHTS RESERVED.
              </p>
            </div>
          </div>
        </footer>
      )}
      </SmoothScroll>
    </div>
  );
}

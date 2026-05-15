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
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Boys", href: "/shop?category=boys" },
  { label: "Girls", href: "/shop?category=girls" },
  { label: "Baby", href: "/shop?category=baby" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getItemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex items-center justify-between px-8 py-2 text-white text-[11px] font-bold"
        style={{ background: "#0B1E3F" }}>
        <div className="flex items-center gap-4">
          {/* Social icons without background */}
          <a href="#" className="hover:text-white/80 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
          </a>
          <a href="#" className="hover:text-white/80 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
          </a>
          <a href="#" className="hover:text-white/80 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </a>
          <a href="#" className="hover:text-white/80 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
          </a>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1 opacity-80"><Phone className="size-3" /> +234 800 NEXTGEN</span>
          <Link href="/dashboard">
            <button className="bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-colors shadow-sm">
              My Account
            </button>
          </Link>
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
            <button className="bg-yellow-400 text-yellow-900 rounded-full p-2.5 shadow-sm hover:bg-yellow-300 transition-colors flex-shrink-0">
              <Search className="size-5" strokeWidth={2.5} />
            </button>
            <nav className="hidden lg:flex items-center gap-6 text-[11px] font-black uppercase text-zinc-700 tracking-widest">
              <Link href="/" className="hover:text-pink-500 transition-colors">Home</Link>
              <Link href="/shop" className="hover:text-pink-500 transition-colors">Shop</Link>
              <Link href="/collections" className="hover:text-pink-500 transition-colors">Collection</Link>
              <Link href="/shop?category=boys" className="hover:text-pink-500 transition-colors">Kids</Link>
            </nav>
          </div>

          {/* CENTRE — Logo */}
          <Link href="/" className="flex flex-col items-center group flex-shrink-0 mx-4">
            <Image
              src="/images/logonextgen.png"
              alt="NextGen Fashion"
              width={160}
              height={56}
              className="object-contain h-12 w-auto group-hover:scale-105 transition-transform"
              priority
            />
          </Link>

          {/* RIGHT — Nav Links + Cart */}
          <div className="flex items-center gap-6 flex-1 justify-end">
            <nav className="hidden lg:flex items-center gap-6 text-[11px] font-black uppercase text-zinc-700 tracking-widest">
              <Link href="/shop?category=girls" className="hover:text-pink-500 transition-colors">Girls</Link>
              <Link href="/contact" className="hover:text-pink-500 transition-colors">Contact</Link>
              <Link href="/shop?category=baby" className="hover:text-pink-500 transition-colors">Baby</Link>
              <Link href="/about" className="hover:text-pink-500 transition-colors">About</Link>
            </nav>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center bg-yellow-400 text-yellow-900 rounded-full p-2.5 shadow-sm hover:bg-yellow-300 transition-colors flex-shrink-0"
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
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-zinc-100 bg-white px-6 py-4 space-y-1 shadow-inner">
            {navLinks.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 px-4 text-sm font-black uppercase tracking-widest text-zinc-700 hover:text-white hover:bg-[#0B1E3F] rounded-xl transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* ── PAGE CONTENT ────────────────────────────────────────────────────── */}
      <main className="flex-1 relative">{children}</main>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#0B1E3F" }} className="text-white pt-20 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-mesh opacity-10" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-white shadow-xl p-1">
                  <Image src="/images/logonextgen.png" alt="NextGen Logo" width={32} height={32} className="object-contain" />
                </div>
                <span className="font-black text-lg tracking-tight text-white">NEXTGEN FASHION</span>
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
              POWERED BY NEXTGEN FASHION OS
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
              © 2025 NEXTGEN FASHION. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ShoppingCart, Search, User, Menu, Zap, Globe, Share2, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useCartStore } from "@/modules/cart/store/cart.store";
import { CartDrawer } from "@/modules/cart/components/cart-drawer";
import { StoreSearch } from "@/modules/products/components/store-search";
import { cn } from "@/lib/utils";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getItemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const itemCount = mounted ? getItemCount() : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-brand-navy/30">
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
      
      {/* Storefront Navbar - High-Fidelity Glassmorphism */}
      <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500",
        isScrolled 
          ? "h-16 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-b border-border/30 shadow-2xl shadow-black/5" 
          : "h-24 bg-transparent border-none"
      )}>
        <div className="w-full px-6 md:px-12 h-full flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center group">
              <div className="flex items-center justify-center transition-transform duration-500">
                <Image 
                    src="/images/logonextgen.png" 
                    alt="NextGen Logo" 
                    width={200} 
                    height={66} 
                    className={cn(
                        "object-contain transition-all duration-500",
                        isScrolled ? "h-8" : "h-11"
                    )}
                />
              </div>
            </Link>
 
            <nav className="hidden lg:flex items-center gap-12 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              <Link href="/shop" className="hover:text-brand-navy transition-colors relative group">
                SHOP
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-navy transition-all group-hover:w-full" />
              </Link>
              <Link href="/about" className="hover:text-brand-navy transition-colors relative group">
                ABOUT US
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-navy transition-all group-hover:w-full" />
              </Link>
              <Link href="/contact" className="hover:text-brand-navy transition-colors relative group">
                CONTACT
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-navy transition-all group-hover:w-full" />
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <StoreSearch />
            
            <Link href="/dashboard" className="hidden md:flex">
              <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-brand-navy/5 hover:text-brand-navy transition-colors">
                <User className="size-5" />
              </Button>
            </Link>

            <Button 
              onClick={() => setIsCartOpen(true)}
              className="relative bg-zinc-950 dark:bg-white dark:text-zinc-950 text-white hover:bg-brand-navy hover:dark:bg-brand-navy hover:dark:text-white rounded-2xl h-12 px-6 gap-3 shadow-xl transition-all active:scale-95 group"
            >
              <ShoppingCart className="size-5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest hidden md:inline">BAG</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-navy text-white text-[10px] font-black h-6 w-6 rounded-xl flex items-center justify-center border-2 border-white shadow-lg animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </Button>

            <Button variant="ghost" size="icon" className="lg:hidden size-10 rounded-xl">
              <Menu className="size-6" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        {children}
      </main>

      {/* Storefront Footer - High-Fidelity Luxury Branding */}
      <footer className="bg-zinc-950 text-white pt-32 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-mesh opacity-10" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-32">
            <div className="space-y-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-white shadow-xl shadow-brand-navy/5 p-1 ring-1 ring-border/20">
                  <Image 
                    src="/images/logonextgen.png" 
                    alt="NextGen Logo" 
                    width={32} 
                    height={32} 
                    className="object-contain"
                  />
                </div>
                <span className="font-black text-2xl tracking-tighter text-white">NEXTGEN FASHION</span>
              </Link>
              <p className="text-zinc-500 font-medium leading-relaxed max-w-xs">
                Sustainably engineered fashion architecture for the next generation of style icons. World-class quality, global logistics.
              </p>
              <div className="flex gap-4">
                  {[Globe, Share2, MessageSquare].map((Icon, i) => (
                      <Button key={i} variant="ghost" size="icon" className="size-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-brand-navy hover:border-brand-navy transition-all">
                          <Icon className="size-5" />
                      </Button>
                  ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-10 text-brand-navy">ARCHIVES</h4>
              <ul className="space-y-4 text-sm font-black text-zinc-400">
                <li><Link href="/shop" className="hover:text-white transition-colors">FULL CATALOGUE</Link></li>
                <li><Link href="/shop" className="hover:text-white transition-colors">SEASON 01: AURORA</Link></li>
                <li><Link href="/shop" className="hover:text-white transition-colors">LIMITED EDITIONS</Link></li>
                <li><Link href="/shop" className="hover:text-white transition-colors">EDITORIALS</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-10 text-brand-navy">CONCIERGE</h4>
              <ul className="space-y-4 text-sm font-black text-zinc-400">
                <li><Link href="#" className="hover:text-white transition-colors">LOGISTICS TRACKING</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">RETURNS & REFUNDS</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">QUALITY ASSURANCE</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">SECURE TRANSACTIONS</Link></li>
              </ul>
            </div>

            <div className="space-y-8">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-brand-navy">INTELLIGENCE</h4>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed">Join our elite circle for priority access to new collection drops and fashion tech insights.</p>
              <div className="flex gap-2">
                <input 
                    type="email" 
                    placeholder="EMAIL SIGNATURE" 
                    className="flex-1 h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-xs font-black tracking-widest focus:ring-1 focus:ring-brand-navy outline-none" 
                />
                <Button className="bg-white text-zinc-950 hover:bg-brand-navy hover:text-white h-14 px-6 rounded-2xl shadow-xl transition-all font-black text-xs">
                    JOIN
                </Button>
              </div>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                <Sparkles className="size-4 text-brand-navy" />
                POWERED BY NEXTGEN FASHION OS
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                © 2024 NEXTGEN FASHION ARCHITECTURE. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

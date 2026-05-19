"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShopFilters({ categories, category, targetGender }: { categories: any[], category?: string, targetGender?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize maxPrice from URL or default to 100k
  const initialMaxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice') as string) : 100000;
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);

  // Sync state if URL changes externally
  useEffect(() => {
    const urlMaxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice') as string) : 100000;
    if (urlMaxPrice !== maxPrice) {
      setMaxPrice(urlMaxPrice);
    }
  }, [searchParams]);

  // Debounce slider updates to URL
  useEffect(() => {
    const urlMaxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice') as string) : 100000;
    
    // Guard: Only navigate if the value has actually changed from what is in the URL
    if (maxPrice === urlMaxPrice) return;

    const handler = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams.toString());
      if (maxPrice < 100000) {
        newParams.set('maxPrice', maxPrice.toString());
      } else {
        newParams.delete('maxPrice');
      }
      
      const newQuery = newParams.toString();
      const newUrl = `${pathname}${newQuery ? `?${newQuery}` : ''}`;
      
      router.push(newUrl, { scroll: false });
    }, 400);

    return () => clearTimeout(handler);
  }, [maxPrice, pathname, router, searchParams]);

  const clearHref = targetGender ? `/${targetGender.toLowerCase()}` : "/shop";

  return (
    <div className="space-y-8 pb-8">
      {/* Header aligned properly, CLEAR is styled like a button instead of raw text */}
      <div className="flex items-center justify-between pb-4 border-b border-border/30 pr-8 lg:pr-0">
        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <SlidersHorizontal className="size-4" />
          Filters
        </h3>
        <Link 
          href={clearHref}
          className="text-[10px] font-black text-white bg-zinc-900 px-3 py-1.5 rounded-md uppercase tracking-widest hover:bg-zinc-800 transition-colors"
        >
          Clear
        </Link>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Categories</h4>
        <div className="flex flex-col gap-2">
          <Link
            href={clearHref}
            className={cn(
              "whitespace-nowrap text-left py-3 px-5 rounded-2xl text-sm font-bold transition-all shrink-0 block",
              !category ? "bg-brand-navy/5 text-brand-navy glass-card shadow-none border-none" : "bg-transparent text-zinc-600 hover:bg-accent hover:translate-x-1"
            )}
          >
            All Products
          </Link>
          {categories.map((cat) => {
            const catHref = `${targetGender ? `/${targetGender.toLowerCase()}` : "/shop"}?category=${cat.id}`;
            const isActive = category === cat.id || category?.toLowerCase() === cat.name.toLowerCase();
            return (
              <Link
                key={cat.id}
                href={catHref}
                className={cn(
                  "whitespace-nowrap text-left py-3 px-5 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group shrink-0 gap-2 block",
                  isActive ? "bg-brand-navy/5 text-brand-navy glass-card shadow-none border-none" : "bg-transparent text-zinc-600 hover:bg-accent hover:translate-x-1"
                )}
              >
                {cat.name}
                <span className={cn("text-[10px]", isActive ? "text-brand-navy" : "opacity-40 group-hover:opacity-100")}>{cat._count.products}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Price Range</h4>
          <span className="text-xs font-bold text-brand-navy">
            {maxPrice === 100000 ? "Any Price" : `Up to ₦${maxPrice.toLocaleString()}`}
          </span>
        </div>
        <div className="pt-2">
          <input 
            type="range" 
            min="0" 
            max="100000" 
            step="1000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-navy transition-all"
            style={{
              background: `linear-gradient(to right, #0B1E3F ${(maxPrice / 100000) * 100}%, #e4e4e7 ${(maxPrice / 100000) * 100}%)`
            }}
          />
          <div className="flex justify-between text-[10px] font-black tracking-widest uppercase text-zinc-400 mt-3">
            <span>₦0</span>
            <span>₦100,000+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

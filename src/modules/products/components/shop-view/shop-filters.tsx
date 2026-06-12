"use client";

import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShopFilters({ categories, category, targetGender }: { categories: any[], category?: string, targetGender?: string }) {

  const clearHref = targetGender ? `/${targetGender.toLowerCase()}` : "/shop";

  return (
    <div className="pb-6">
      {/* Minimal Header */}
      <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-foreground mb-4 pb-3 border-b border-brand-navy/10">
        <SlidersHorizontal className="size-4 text-brand-navy" />
        <span>Categories</span>
      </h3>

      {/* Categories — Compact Layout */}
      <div className="flex flex-col gap-1.5">
        {/* All Products */}
        <Link
          href={clearHref}
          className={cn(
            "w-full text-left py-2.5 px-3.5 rounded-lg text-sm font-semibold transition-all duration-200 border",
            !category 
              ? "bg-brand-navy text-white shadow-sm hover:shadow-md border-brand-navy" 
              : "bg-white/40 hover:bg-white/60 text-foreground border-brand-navy/5 hover:border-brand-navy/15"
          )}
        >
          All Products
        </Link>

        {/* Category Items */}
        {categories.map((cat) => {
          const catHref = `${targetGender ? `/${targetGender.toLowerCase()}` : "/shop"}?category=${cat.id}`;
          const isActive = category === cat.id || category?.toLowerCase() === cat.name.toLowerCase();
          return (
            <Link
              key={cat.id}
              href={catHref}
              className={cn(
                "w-full text-left py-2.5 px-3.5 rounded-lg text-sm font-semibold transition-all duration-200 border truncate",
                isActive
                  ? "bg-brand-navy text-white shadow-sm hover:shadow-md border-brand-navy"
                  : "bg-white/40 hover:bg-white/60 text-foreground border-brand-navy/5 hover:border-brand-navy/15"
              )}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

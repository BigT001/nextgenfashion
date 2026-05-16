"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart, Eye, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickViewModal } from "./quick-view-modal";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: any;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "group flex flex-col gap-6 animate-slow-fade",
          className
        )}
      >
        <div className="aspect-[3/4] bg-muted/30 rounded-[2.5rem] relative overflow-hidden glass-card border-none group-hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] transition-all duration-700">
          <Link href={`/products/${product.id}`} className="absolute inset-0 z-0">
            {product.images && product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-1000"
              />
            ) : (
              <div className="flex items-center justify-center h-full opacity-10">
                <Zap className="size-20" />
              </div>
            )}
          </Link>

          <div className="absolute top-6 right-6 flex flex-col gap-3 z-10">
            <Button size="icon" className="size-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
              <Heart className="size-5" />
            </Button>
            <Button
              onClick={() => setIsQuickViewOpen(true)}
              size="icon"
              className="size-12 rounded-2xl bg-white text-black opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-75 shadow-xl"
            >
              <Eye className="size-5" />
            </Button>
            <Button size="icon" className="size-12 rounded-2xl bg-brand-navy text-white opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-150 shadow-xl shadow-brand-navy/30">
              <ShoppingCart className="size-5" />
            </Button>
          </div>
          <div className="absolute bottom-6 left-6 z-10">
            <Badge className="bg-white/90 backdrop-blur-xl text-black border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest rounded-lg">
              {product.category?.name || "COLLECTION"}
            </Badge>
          </div>
        </div>

        <Link href={`/products/${product.id}`} className="px-2 space-y-2">
          <h3 className="font-black text-xl tracking-tight line-clamp-1 group-hover:text-brand-navy transition-colors">{product.name}</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black tracking-tighter">₦{Number(product.basePrice).toLocaleString()}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="size-3 fill-amber-400 stroke-amber-400" />)}
            </div>
          </div>
        </Link>
      </div>

      <QuickViewModal
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
}

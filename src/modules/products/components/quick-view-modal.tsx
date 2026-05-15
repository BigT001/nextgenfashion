"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap, Star, X, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "./product-actions";
import { cn } from "@/lib/utils";

interface QuickViewModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden border-none glass-card shadow-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl rounded-[3rem]">
        <div className="grid grid-cols-1 md:grid-cols-2 h-[80vh] md:h-[600px]">
            {/* Left: Visual Showcase */}
            <div className="relative h-full bg-muted/20 border-r border-border/30 overflow-hidden group">
                <div className="absolute inset-0 bg-brand-mesh opacity-5 z-0" />
                {product.images?.[0] ? (
                    <Image 
                        src={product.images[0]} 
                        alt={product.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full opacity-10">
                        <Zap className="size-24" />
                    </div>
                )}
                <div className="absolute top-8 left-8 z-10">
                    <Badge className="bg-white/90 backdrop-blur-xl text-black border-none font-black text-[10px] px-4 py-1.5 uppercase tracking-widest rounded-xl">
                        {product.category?.name || "EXCLUSIVE"}
                    </Badge>
                </div>
            </div>

            {/* Right: Product Intelligence & Actions */}
            <div className="p-12 flex flex-col justify-between overflow-y-auto scrollbar-hide">
                <div className="space-y-8">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-amber-400">
                                {[1,2,3,4,5].map(i => <Star key={i} className="size-3 fill-current" />)}
                                <span className="text-[10px] text-muted-foreground font-bold ml-2">4.8 (128)</span>
                            </div>
                            <h2 className="text-4xl font-black tracking-tight leading-none">{product.name}</h2>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-brand-navy/5 hover:text-brand-navy">
                            <X className="size-5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-3xl font-black tracking-tighter text-brand-navy">
                            ₦{Number(product.basePrice).toLocaleString()}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-black border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-3 py-1 uppercase tracking-widest">
                            In Stock
                        </Badge>
                    </div>

                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                        {product.description || "An exquisite piece of fashion tech architecture, designed for the next generation of style icons."}
                    </p>

                    <div className="py-6 border-y border-border/30">
                        <ProductActions product={product} />
                    </div>
                </div>

                <div className="pt-8 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                        <Sparkles className="size-4 text-brand-navy" />
                        NextGen Exclusive Line
                    </div>
                    <Button variant="ghost" className="font-black text-[10px] uppercase tracking-widest hover:text-brand-navy transition-all group">
                        FULL DETAILS
                        <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

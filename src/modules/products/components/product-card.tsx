"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Zap } from "lucide-react";
import { useCartStore } from "@/modules/cart/store/cart.store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: any;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {

  const addItem = useCartStore((state) => state.addItem);
  const setOpenCart = useCartStore((state) => state.setOpenCart);
  const items = useCartStore((state) => state.items);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const variant = product.variants?.[0];
    const variantId = variant?.id || product.id;
    const price = variant?.price ? Number(variant.price) : Number(product.basePrice || 0);
    const stock = variant?.inventory?.quantity ?? 0;

    if (stock <= 0) {
      toast.error(`${product.name} is out of stock.`);
      return;
    }
    const exists = items.find((it: any) => it.variantId === variantId);
    if (exists) {
      toast.error(`${product.name} is already in your cart.`);
      return;
    }

    const item = {
      id: product.id,
      variantId,
      name: product.name,
      price,
      quantity: 1,
      image: product.images?.[0],
      availableStock: stock,
    };
    addItem(item);
    setOpenCart(true);
  };

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

          <div className="absolute top-6 right-6 z-10">
            <Button size="icon" onClick={handleAddToCart} className="size-12 rounded-2xl bg-brand-navy text-white shadow-xl shadow-brand-navy/30">
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
          </div>
        </Link>
      </div>

      {/* Quick view removed from hover actions to simplify UX */}
    </>
  );
}

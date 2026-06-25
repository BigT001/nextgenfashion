"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Zap } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/modules/cart/store/cart.store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProductVariant = {
  id?: string | null;
  price?: unknown;
  inventory?: {
    quantity?: number | null;
  } | null;
};

interface ProductCardProduct {
  id: string;
  name: string;
  basePrice: unknown;
  category?: {
    name?: string | null;
  } | null;
  categories?: Array<{ name?: string | null }> | null;
  images?: unknown;
  resolvedImage?: string | null;
  variants?: ProductVariant[] | null;
}

interface ProductCardProps {
  product: ProductCardProduct;
  className?: string;
}

interface CartItem {
  variantId: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const productImages = Array.isArray(product.images)
    ? product.images.filter((image): image is string => typeof image === "string" && image.trim().length > 0)
    : [];

  const imageSrc = productImages[0]
    || (typeof product.resolvedImage === "string" && product.resolvedImage.trim().length > 0 ? product.resolvedImage : "")
    || "/images/product-placeholder.svg";

  const displayImageSrc = imageFailed ? "/images/product-placeholder.svg" : imageSrc;

  const categoryLabel = product.categories?.length
    ? product.categories.map((cat) => cat.name).filter(Boolean).join(", ")
    : product.category?.name || "COLLECTION";

  const addItem = useCartStore((state) => state.addItem);
  const setOpenCart = useCartStore((state) => state.setOpenCart);
  const items = useCartStore((state) => state.items);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const variant = product.variants?.[0];
    const variantId = typeof variant?.id === "string" ? variant.id : null;
    const price = Number(variant?.price ?? product.basePrice) || 0;
    const stock = typeof variant?.inventory?.quantity === "number"
      ? variant.inventory.quantity
      : 0;

    if (!variantId) {
      toast.error(`Unable to add ${product.name} to cart. Missing product variant.`);
      return;
    }

    if (stock <= 0) {
      toast.error(`${product.name} is out of stock.`);
      return;
    }
    const exists = items.find((it: CartItem) => it.variantId === variantId);
    if (exists) {
      toast.error(`${product.name} is already in your cart.`);
      return;
    }

    // Resolve weight: Product weight > Category weight fallback > Default 0.5kg
    let resolvedWeight = Number((product as any).weight);
    if (!resolvedWeight && product.categories && Array.isArray(product.categories)) {
      const catWeights = product.categories
        .map((c: any) => Number(c.weight))
        .filter((w: number) => !Number.isNaN(w) && w > 0);
      if (catWeights.length > 0) {
        resolvedWeight = Math.max(...catWeights);
      }
    }
    if (!resolvedWeight) {
      resolvedWeight = 0.5; // fallback default
    }

    const item = {
      id: product.id,
      variantId,
      name: product.name,
      price,
      quantity: 1,
      image: productImages[0],
      availableStock: stock,
      weight: resolvedWeight,
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
            {displayImageSrc ? (
              <Image
                src={displayImageSrc}
                alt={product.name}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                onError={() => setImageFailed(true)}
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
        </div>

        <Link href={`/products/${product.id}`} className="px-2 space-y-2">
          <h3 className="font-black text-sm md:text-base tracking-tight line-clamp-1 group-hover:text-brand-navy transition-colors">{product.name}</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black tracking-tighter">₦{Number(product.basePrice).toLocaleString()}</span>
          </div>
        </Link>
      </div>

      {/* Quick view removed from hover actions to simplify UX */}
    </>
  );
}

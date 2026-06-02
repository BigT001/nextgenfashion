"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
}

export function ProductImageGallery({ images, alt }: ProductImageGalleryProps) {
  const validImages = useMemo(
    () => images.filter((image) => typeof image === "string" && image.trim().length > 0),
    [images]
  );

  const [activeImage, setActiveImage] = useState(validImages[0] || "/images/product-placeholder.svg");

  useEffect(() => {
    if (validImages.length > 0) {
      setActiveImage(validImages[0]);
    }
  }, [validImages]);

  if (validImages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="aspect-square rounded-3xl overflow-hidden bg-slate-200 border border-slate-200/80" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden bg-slate-100 border border-slate-200 shadow-[0_28px_80px_-32px_rgba(15,23,42,0.35)]">
        <Image
          src={activeImage}
          alt={alt}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1280px) 60vw, 40vw"
          className="object-cover transition-all duration-500"
          priority
        />

        {validImages.length > 1 ? (
          <div className="absolute bottom-4 left-0 right-0 px-4">
            <div className="overflow-x-auto">
              <div className="inline-flex gap-3">
                {validImages.map((image, index) => {
                  const isSelected = activeImage === image;
                  return (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(image)}
                      className={cn(
                        "relative flex-shrink-0 aspect-square overflow-hidden rounded-3xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 w-16 h-16",
                        isSelected
                          ? "border-white shadow-xl ring-2 ring-white/70"
                          : "border-white/40 bg-white/10 hover:border-white/70"
                      )}
                    >
                      <Image
                        src={image}
                        alt={`${alt} thumbnail ${index + 1}`}
                        fill
                        unoptimized
                        sizes="64px"
                        className="object-cover"
                      />
                      {isSelected ? <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

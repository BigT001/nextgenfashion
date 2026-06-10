"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

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
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (validImages.length > 0) {
      setActiveImage(validImages[0]);
    }
  }, [validImages]);

  // Lock scroll when image is zoomed
  useEffect(() => {
    if (isZoomed) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isZoomed]);

  // Close zoomed view on escape keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsZoomed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (validImages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="aspect-[3/4] rounded-[2rem] overflow-hidden bg-slate-200 border border-slate-200/80" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* Main product image */}
      <div 
        onClick={() => setIsZoomed(true)}
        className="relative aspect-[3/4] w-full rounded-[2rem] overflow-hidden bg-slate-100 border border-slate-200 shadow-[0_28px_80px_-32px_rgba(15,23,42,0.35)] cursor-zoom-in group/main transition-all duration-300 hover:shadow-[0_35px_90px_-25px_rgba(15,23,42,0.45)]"
      >
        <Image
          src={activeImage}
          alt={alt}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1280px) 60vw, 40vw"
          className="object-cover transition-all duration-500 group-hover/main:scale-[1.02]"
          priority
        />
      </div>

      {/* Thumbnail row — outside and below the main image */}
      {validImages.length > 1 ? (
        <div className="mt-4 overflow-x-auto">
          <div className="flex gap-3">
            {validImages.map((image, index) => {
              const isSelected = activeImage === image;
              return (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  className={cn(
                    "relative flex-shrink-0 aspect-[3/4] overflow-hidden rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-navy/30 w-16 sm:w-20",
                    isSelected
                      ? "border-brand-navy shadow-lg ring-2 ring-brand-navy/20"
                      : "border-slate-200 hover:border-brand-navy/40 bg-slate-50"
                  )}
                >
                  <Image
                    src={image}
                    alt={`${alt} thumbnail ${index + 1}`}
                    fill
                    unoptimized
                    sizes="80px"
                    className="object-cover"
                  />
                  {isSelected ? <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-brand-navy rounded-full" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Fullscreen zoomed image overlay */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsZoomed(false)}
        >
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(false);
            }}
            className="absolute top-4 right-4 z-50 size-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10 shadow-lg active:scale-95"
            aria-label="Close image view"
          >
            <X className="size-6" />
          </button>
          
          <div className="relative w-full h-full max-h-[90vh] max-w-4xl p-4 flex items-center justify-center">
            <Image
              src={activeImage}
              alt={alt}
              fill
              unoptimized
              className="object-contain animate-in zoom-in-95 duration-300 ease-out select-none"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </div>
  );
}

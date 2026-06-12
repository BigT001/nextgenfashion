"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-left" | "fade-right" | "zoom-in" | "fade-down";
  delay?: number;
  threshold?: number;
  once?: boolean;
}

export function AnimatedSection({
  children,
  className,
  animation = "fade-up",
  delay = 0,
  threshold = 0.12,
  once = true,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile on mount
    setIsMobile(window.innerWidth < 768);

    const el = ref.current;
    if (!el) return;

    // On mobile, show content immediately without animation
    if (isMobile) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once, isMobile]);

  const hiddenClass: Record<string, string> = {
    "fade-up":    "opacity-0 translate-y-10",
    "fade-down":  "opacity-0 -translate-y-10",
    "fade-left":  "opacity-0 -translate-x-10",
    "fade-right": "opacity-0 translate-x-10",
    "zoom-in":    "opacity-0 scale-90",
  };

  const visibleClass = "opacity-100 translate-y-0 translate-x-0 scale-100";

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all ease-out",
        visible ? visibleClass : hiddenClass[animation],
        className
      )}
      style={{
        transitionDuration: isMobile ? "0ms" : "700ms",
        transitionDelay: visible ? `${delay}ms` : "0ms",
        willChange: isMobile ? "auto" : "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-left" | "fade-right" | "zoom-in";
  delay?: number;
}

export function AnimatedSection({
  children,
  className,
  animation = "fade-up",
  delay = 0,
}: AnimatedSectionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Smooth transition on client mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const baseHidden: Record<string, string> = {
    "fade-up":    "opacity-0 translate-y-4",
    "fade-left":  "opacity-0 -translate-x-4",
    "fade-right": "opacity-0 translate-x-4",
    "zoom-in":    "opacity-0 scale-95",
  };

  const baseVisible = "opacity-100 translate-y-0 translate-x-0 scale-100";

  return (
    <div
      className={cn(
        "transition-all duration-700 ease-out",
        mounted ? baseVisible : baseHidden[animation],
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

"use client";

import { useScrollAnimation } from "@/hooks/use-scroll-animation";
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
  const { ref, visible } = useScrollAnimation(0.1);

  const baseHidden: Record<string, string> = {
    "fade-up":    "opacity-0 translate-y-12",
    "fade-left":  "opacity-0 -translate-x-12",
    "fade-right": "opacity-0 translate-x-12",
    "zoom-in":    "opacity-0 scale-90",
  };

  const baseVisible = "opacity-100 translate-y-0 translate-x-0 scale-100";

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? baseVisible : baseHidden[animation],
        className
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

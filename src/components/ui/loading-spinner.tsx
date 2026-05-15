"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "pink" | "blue" | "white";
}

export function LoadingSpinner({
  className,
  size = "md",
  variant = "pink"
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "size-4 border-2",
    md: "size-8 border-3",
    lg: "size-12 border-4",
    xl: "size-16 border-4",
  };

  const variantClasses = {
    pink: "border-brand-navy/20 border-t-brand-navy",
    blue: "border-brand-silver/20 border-t-brand-silver",
    white: "border-white/20 border-t-white",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "rounded-full animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl animate-slow-fade">
      <LoadingSpinner size="xl" />
      <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
        Optimizing Style...
      </p>
    </div>
  );
}

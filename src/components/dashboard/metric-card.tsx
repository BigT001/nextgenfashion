"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  description?: string;
  className?: string;
  variant?: "pink" | "blue" | "slate" | "emerald";
  compact?: boolean;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
  variant = "pink",
  compact = false
}: MetricCardProps) {
  const variantStyles = {
    pink: "border-l-brand-navy text-brand-navy bg-brand-navy/5",
    blue: "border-l-brand-silver text-brand-silver bg-brand-silver/5",
    slate: "border-l-slate-400 text-slate-400 bg-slate-400/5",
    emerald: "border-l-emerald-500 text-emerald-500 bg-emerald-500/5",
  };

  return (
    <Card className={cn("glass-card border-none border-l-4 shadow-sm group hover:scale-[1.02] transition-all duration-300", variantStyles[variant], className)}>
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-inherit transition-colors">
              {title}
            </p>
            <h3 className={cn("font-bold tracking-tight text-foreground", compact ? "text-xl" : "text-2xl")}>
              {value}
            </h3>
          </div>
          <div className={cn("rounded-2xl transition-all duration-500 group-hover:rotate-12", compact ? "p-2" : "p-3", {
            "bg-brand-navy/10": variant === "pink",
            "bg-brand-silver/10": variant === "blue",
            "bg-slate-400/10": variant === "slate",
            "bg-emerald-500/10": variant === "emerald",
          })}>
            <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} />
          </div>
        </div>
        
        {(trend || description) && (
          <div className="mt-4 flex items-center gap-2">
            {trend && (
              <div className={cn("flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full", {
                "bg-emerald-500/10 text-emerald-600": trend.isUp,
                "bg-rose-500/10 text-rose-600": !trend.isUp,
              })}>
                {trend.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend.value}%
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground font-medium">
                {description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
  variant = "pink"
}: MetricCardProps) {
  const variantStyles = {
    pink: "border-l-brand-navy text-brand-navy bg-brand-navy/5",
    blue: "border-l-brand-silver text-brand-silver bg-brand-silver/5",
    slate: "border-l-slate-400 text-slate-400 bg-slate-400/5",
    emerald: "border-l-emerald-500 text-emerald-500 bg-emerald-500/5",
  };

  return (
    <Card className={cn("glass-card border-none border-l-4 shadow-sm group hover:scale-[1.02] transition-all duration-300", variantStyles[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-inherit transition-colors">
              {title}
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {value}
            </h3>
          </div>
          <div className={cn("p-3 rounded-2xl transition-all duration-500 group-hover:rotate-12", {
            "bg-brand-navy/10": variant === "pink",
            "bg-brand-silver/10": variant === "blue",
            "bg-slate-400/10": variant === "slate",
            "bg-emerald-500/10": variant === "emerald",
          })}>
            <Icon className="h-6 w-6" />
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

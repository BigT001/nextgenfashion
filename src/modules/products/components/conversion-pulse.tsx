"use client";

import { useEffect, useState } from "react";
import { Eye, Zap, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConversionPulse() {
  const [viewers, setViewers] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initial random viewers between 12 and 48
    setViewers(Math.floor(Math.random() * (48 - 12 + 1)) + 12);

    // Occasional pulse changes
    const interval = setInterval(() => {
        setViewers(prev => {
            const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
            return Math.max(8, prev + change);
        });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-6 animate-slow-fade">
        {/* Social Proof: Viewers */}
        <div className="flex items-center gap-3 glass-card border-none bg-white/50 dark:bg-zinc-900/50 px-5 py-2.5 rounded-2xl shadow-sm group">
            <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                <div className="relative size-2 bg-emerald-500 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
                <Eye className="size-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {viewers} <span className="opacity-50">Curators Viewing</span>
                </span>
            </div>
        </div>

        {/* Urgency: Trending */}
        <div className="flex items-center gap-3 glass-card border-none bg-white/50 dark:bg-zinc-900/50 px-5 py-2.5 rounded-2xl shadow-sm group">
            <div className="relative">
                <div className="absolute inset-0 bg-brand-navy/20 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
                <div className="relative size-2 bg-brand-navy rounded-full" />
            </div>
            <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-muted-foreground group-hover:text-brand-navy transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Limited Batch <span className="opacity-50">• Selling Fast</span>
                </span>
            </div>
        </div>
    </div>
  );
}

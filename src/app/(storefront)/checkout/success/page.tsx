"use client";

import Link from "next/link";
import { CheckCircle2, Package, ArrowRight, ShoppingBag, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

export default function OrderSuccessPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fire celebratory confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white selection:bg-brand-navy/30 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute inset-0 bg-brand-mesh opacity-5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] bg-brand-navy/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-2xl w-full text-center space-y-12 animate-slow-fade relative z-10">
        <div className="relative inline-block">
            <div className="absolute inset-0 bg-brand-navy/20 blur-3xl rounded-full animate-pulse" />
            <div className="relative size-32 bg-brand-navy rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-brand-navy/40 animate-in zoom-in duration-700">
                <CheckCircle2 className="size-16" />
            </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
            ACQUISITION <span className="text-gradient">COMPLETE</span>.
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
            Your selection has been secured. Our architectural fulfillment team is preparing your luxury pieces for express logistics.
          </p>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border-none shadow-2xl space-y-8 max-w-md mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-mesh opacity-5" />
            <div className="flex items-center justify-center gap-4 text-brand-navy">
                <Sparkles className="size-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">NextGen Integrity Standard</span>
            </div>
            
            <div className="space-y-4">
                <div className="flex justify-between items-center px-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Status</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] px-3 py-1">VERIFIED</Badge>
                </div>
                <div className="flex justify-between items-center px-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logistics</span>
                    <span className="text-xs font-black tracking-widest uppercase">EXPRESS READY</span>
                </div>
            </div>

            <Link href="/shop" className="block w-full">
                <Button className="w-full h-16 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl group transition-all active:scale-95">
                    RETURN TO CATALOGUE
                    <ArrowRight className="ml-3 size-4 group-hover:translate-x-1 transition-transform" />
                </Button>
            </Link>
        </div>

        <div className="flex items-center justify-center gap-8 opacity-40">
            {[Package, ShoppingBag, Zap].map((Icon, i) => (
                <Icon key={i} className="size-6" />
            ))}
        </div>
      </div>
    </div>
  );
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
            {children}
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}

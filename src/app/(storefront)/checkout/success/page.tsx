"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, ArrowRight, ShoppingBag, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const totalAmount = searchParams.get("totalAmount");

  useEffect(() => {
    // Fire celebratory confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        window.clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white selection:bg-brand-navy/30 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute inset-0 bg-brand-mesh opacity-5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] bg-brand-navy/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-4xl w-full text-center space-y-6 sm:space-y-8 animate-slow-fade relative z-10">
        <div className="inline-flex items-center justify-center gap-5 rounded-full bg-brand-navy/5 px-6 py-4 shadow-lg shadow-brand-navy/10 mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-navy text-white shadow-sm">
            <CheckCircle2 className="size-6" />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.45em] text-brand-navy">ORDER CONFIRMED</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-950">
            CONGRATULATIONS <span className="text-brand-navy">🎉</span>
          </h1>
          <p className="mx-auto max-w-xl sm:max-w-2xl text-sm sm:text-base text-slate-600 font-medium leading-7 sm:leading-8">
            Your payment was successful and your order is confirmed. We’ve emailed your receipt and delivery details — you can track the status anytime from your dashboard.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.06)] p-4 sm:p-5">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-brand-navy/10 blur-3xl opacity-70" />
          <div className="relative space-y-5">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-900/5 p-4 text-left">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">What happens next</p>
              <ul className="mt-3 space-y-2 text-xs leading-6 text-slate-700">
                <li>• Confirmation email delivered to your inbox.</li>
                <li>• Order progress will appear in your account.</li>
                <li>• Our logistics team starts processing immediately.</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link href="/account" className="block w-full">
                <Button className="w-full h-10 bg-brand-navy text-white rounded-lg font-black text-xs uppercase tracking-[0.3em] shadow-md group transition-all active:scale-95">
                  VIEW ACCOUNT
                  <ArrowRight className="ml-3 size-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/shop" className="block w-full">
                <Button variant="outline" className="w-full h-10 border-2 border-brand-navy text-brand-navy rounded-lg font-black text-xs uppercase tracking-[0.3em] shadow-none group transition-all active:scale-95">
                  CONTINUE SHOPPING
                  <ArrowRight className="ml-3 size-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-slate-400">
          Need help? Contact support at <a href="tel:07040913003" className="font-semibold text-brand-navy">07040913003</a>
        </p>
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

function cn(...inputs: Array<string | number | boolean | undefined | null>) {
    return inputs.filter(Boolean).join(" ");
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OrderSuccessClient />
    </Suspense>
  );
}

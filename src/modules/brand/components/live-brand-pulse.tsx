"use client";

import { useEffect, useState } from "react";

const STATS = [
  { value: "12,000+", label: "Happy Families" },
  { value: "100+", label: "New Styles" },
  { value: "4.9★", label: "Parent Rating" },
  { value: "48hrs", label: "Fast Delivery" },
  { value: "100%", label: "Child-Safe Fabrics" },
  { value: "₦0", label: "On Orders ₦15k+" },
];

export function LiveBrandPulse() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section className="py-6 border-y border-zinc-100 bg-white overflow-hidden relative">
      <div className="flex animate-marquee whitespace-nowrap gap-0">
        {[...STATS, ...STATS, ...STATS].map((stat, i) => (
          <div key={i} className="flex items-center gap-3 px-10">
            <span
              className="text-base font-black"
              style={{
                background: "linear-gradient(90deg, #f472b6, #fb923c, #fbbf24)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {stat.value}
            </span>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {stat.label}
            </span>
            <span className="text-zinc-200 text-lg ml-4">✦</span>
          </div>
        ))}
      </div>
    </section>
  );
}

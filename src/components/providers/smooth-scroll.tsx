"use client";

import { useEffect, ReactNode } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";

interface SmoothScrollProps {
  children: ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Reset window scroll to top instantly on page change
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    // Manually add the classes to the html element to override global styling
    document.documentElement.classList.add("lenis", "lenis-smooth");

    let animationFrameId: number;

    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    // Sync scroll to top on path change inside Lenis too
    lenis.scrollTo(0, { immediate: true });

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
      document.documentElement.classList.remove("lenis", "lenis-smooth");
    };
  }, [pathname]);

  return <>{children}</>;
}

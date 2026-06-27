"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPixelEvent } from "@/lib/meta-pixel";

function TrackerComponent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Dispatch PageView event to Meta Pixel on route/params change
    trackPixelEvent("PageView");
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixelTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerComponent />
    </Suspense>
  );
}

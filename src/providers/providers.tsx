"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { MetaPixelTracker } from "@/components/meta-pixel-tracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MetaPixelTracker />
      {children}
      <Toaster position="top-center" richColors closeButton />
    </SessionProvider>
  );
}

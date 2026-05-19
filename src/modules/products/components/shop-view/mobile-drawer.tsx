"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

export function MobileDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  // Close the drawer whenever the URL search params change (e.g. category selected)
  useEffect(() => {
    setOpen(false);
  }, [searchParams]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger 
        render={<Button variant="outline" className="h-10 rounded-xl glass-card border-none text-xs font-bold px-4 flex items-center gap-2" />}
      >
        <SlidersHorizontal className="size-4" />
        Filters
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] pt-12 overflow-y-auto">
        {children}
      </SheetContent>
    </Sheet>
  );
}

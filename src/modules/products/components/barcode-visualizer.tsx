"use client";

import { useState } from "react";
import { Barcode as BarcodeIcon, Download, Eye, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getVariantBarcodeAction } from "../actions/barcode.actions";
import Image from "next/image";

interface BarcodeVisualizerProps {
  variantId: string;
  sku: string;
}

export function BarcodeVisualizer({ variantId, sku }: BarcodeVisualizerProps) {
  const [barcodeData, setBarcodeData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    const result = await getVariantBarcodeAction(variantId);
    if (result.success) {
      setBarcodeData(result.data || null);
    }
    setIsLoading(false);
  };

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-brand-navy/5 hover:text-brand-navy" onClick={handleGenerate} />}>
        <BarcodeIcon className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-w-md glass-card border-none p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
        <div className="p-10 bg-brand-mesh border-b border-border/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gradient">Identity Signature</DialogTitle>
            <DialogDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">
                SKU: {sku} • Code128 Standard
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-10 flex flex-col items-center justify-center space-y-10">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center gap-4">
                <Loader2 className="size-10 text-brand-navy animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Orchestrating Signature...</p>
            </div>
          ) : barcodeData ? (
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-border/10 group">
              <div className="relative w-64 h-32 group-hover:scale-105 transition-transform duration-500">
                <Image 
                    src={barcodeData} 
                    alt="Product Barcode" 
                    fill 
                    className="object-contain"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm font-bold text-muted-foreground">Failed to generate identity.</p>
          )}

          <div className="flex gap-4 w-full pt-4">
              <Button className="flex-1 h-14 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-navy/20 transition-all active:scale-95">
                <Printer className="mr-2 size-4" />
                PRINT TAG
              </Button>
              <Button variant="outline" className="flex-1 h-14 glass-card border-none rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95">
                <Download className="mr-2 size-4" />
                DOWNLOAD
              </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

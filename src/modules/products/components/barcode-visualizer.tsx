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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function BarcodeVisualizer({ variantId, sku, open, onOpenChange, trigger }: BarcodeVisualizerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [barcodeData, setBarcodeData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const handleGenerate = async () => {
    setIsLoading(true);
    const result = await getVariantBarcodeAction(variantId, sku);
    if (result.success) {
      setBarcodeData(result.data || null);
    }
    setIsLoading(false);
  };

  const handlePrint = () => {
    if (!barcodeData) return;
    
    // Create a hidden iframe for printing
    let iframe = document.getElementById("barcode-print-iframe") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "barcode-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
    }
    
    const iframeWindow = iframe.contentWindow;
    const iframeDoc = iframeWindow?.document || iframe.contentDocument;
    if (iframeDoc && iframeWindow) {
      iframeDoc.open();
      iframeDoc.write(`
        <html>
          <head>
            <title>Print Barcode - ${sku}</title>
            <style>
              @page { size: auto; margin: 0; }
              body { 
                margin: 0; 
                display: flex; 
                flex-direction: column; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                font-family: system-ui, -apple-system, sans-serif; 
                background: white;
              }
              img { max-width: 90%; max-height: 70vh; height: auto; object-contain: fit; }
              .sku { font-size: 20px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 10px; }
            </style>
          </head>
          <body>
            <img src="${barcodeData}" id="barcode-img" />
            <div class="sku">${sku}</div>
            <script>
              document.getElementById('barcode-img').onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 100);
              };
            </script>
          </body>
        </html>
      `);
      iframeDoc.close();
    }
  };

  const handleDownload = () => {
    if (!barcodeData) return;
    const a = document.createElement("a");
    a.href = barcodeData;
    a.download = `barcode-${sku}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) handleGenerate();
      }}
    >
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} nativeButton={false}>
        </DialogTrigger>
      ) : (
        <DialogTrigger render={
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:bg-brand-navy/10 hover:text-brand-navy rounded-lg transition-colors"
          />
        }>
          <BarcodeIcon className="h-4 w-4" />
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md glass-card border-none overflow-hidden rounded-[2rem] shadow-2xl p-0">
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
              <Button 
                onClick={handlePrint}
                className="flex-1 h-14 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-navy/20 transition-all active:scale-95"
              >
                <Printer className="mr-2 size-4" />
                PRINT TAG
              </Button>
              <Button 
                onClick={handleDownload}
                variant="outline" 
                className="flex-1 h-14 glass-card border-none rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
              >
                <Download className="mr-2 size-4" />
                DOWNLOAD
              </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

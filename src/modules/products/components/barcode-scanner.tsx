"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X, Camera, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.777778 // 16:9
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear(); // Stop scanning after success
        onClose();
      },
      (error) => {
        // Handle scan error (can be noisy, so we usually ignore it)
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="relative w-full max-w-md aspect-video rounded-3xl overflow-hidden glass-card border-none bg-zinc-950 flex items-center justify-center">
        <div id="reader" className="w-full h-full" />
        
        {/* Overlay Decoration */}
        <div className="absolute inset-0 pointer-events-none border-2 border-brand-navy/20 rounded-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-0.5 bg-brand-navy animate-scan-y opacity-50" />
        
        <div className="absolute top-4 right-4 z-50">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-black/50 text-white hover:bg-black/70">
            <X className="size-5" />
          </Button>
        </div>
      </div>
      
      <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-brand-navy">
              <ScanLine className="size-5 animate-pulse" />
              <span className="font-black text-sm uppercase tracking-widest">Scanning Active</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Position the barcode within the frame to capture.</p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  setMetaPixelIdSetting, 
  setMetaConversionsApiTokenSetting, 
  setMetaTrackingEnabledSetting 
} from "../actions/settings.actions";

interface MetaSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPixelId: string;
  initialCapiToken: string;
  initialTrackingEnabled: boolean;
  onSaveSuccess: (pixelId: string, capiToken: string, enabled: boolean) => void;
}

export function MetaSettingsDialog({
  open,
  onOpenChange,
  initialPixelId,
  initialCapiToken,
  initialTrackingEnabled,
  onSaveSuccess
}: MetaSettingsDialogProps) {
  const [pixelId, setPixelId] = useState(initialPixelId);
  const [capiToken, setCapiToken] = useState(initialCapiToken);
  const [trackingEnabled, setTrackingEnabled] = useState(initialTrackingEnabled);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state with props when dialog opens
  useEffect(() => {
    if (open) {
      setPixelId(initialPixelId);
      setCapiToken(initialCapiToken);
      setTrackingEnabled(initialTrackingEnabled);
    }
  }, [open, initialPixelId, initialCapiToken, initialTrackingEnabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Run the setting saves in parallel
      await Promise.all([
        setMetaPixelIdSetting(pixelId),
        setMetaConversionsApiTokenSetting(capiToken),
        setMetaTrackingEnabledSetting(trackingEnabled)
      ]);

      toast.success("Meta tracking configurations saved successfully.");
      onSaveSuccess(pixelId, capiToken, trackingEnabled);
      onOpenChange(false);
    } catch (error) {
      console.error("[MetaSettingsDialog] Error saving settings:", error);
      toast.error("Failed to save Meta settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 bg-white shadow-2xl border border-zinc-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-black text-brand-navy tracking-tight uppercase">
            Meta Ads & Pixel
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed">
            Configure your Meta Pixel ID and Conversions API Access Token. This enables client-side and server-side tracking to optimize your Facebook & Instagram advertising campaigns.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100 shadow-inner">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-brand-navy">Meta Ads Tracking</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Enable or disable all Meta tracking events.</p>
            </div>

            <button
              type="button"
              onClick={() => setTrackingEnabled(!trackingEnabled)}
              className={cn(
                "relative inline-flex h-10 w-16 rounded-full transition-colors duration-300 focus:outline-none shrink-0 shadow-inner",
                trackingEnabled ? "bg-emerald-500" : "bg-zinc-300"
              )}
            >
              <span className={cn(
                "absolute left-1 top-1 h-8 w-8 rounded-full bg-white shadow-sm transition-transform duration-300",
                trackingEnabled ? "translate-x-6" : "translate-x-0"
              )} />
              <span className="sr-only">Toggle Meta Ads Tracking</span>
            </button>
          </div>

          {/* Pixel ID Input */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-brand-navy/85">
              Meta Pixel ID
            </label>
            <Input
              placeholder="e.g. 123456789012345"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              className="h-12 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus-visible:ring-brand-navy text-sm font-semibold text-brand-navy shadow-inner"
              disabled={isSubmitting}
            />
            <p className="text-[10px] text-muted-foreground/60 leading-normal font-semibold">
              The unique identifier for your Meta Pixel. Found in Meta Events Manager.
            </p>
          </div>

          {/* Conversions API Token Input */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-brand-navy/85">
              Conversions API Access Token
            </label>
            <textarea
              placeholder="EAAGz..."
              value={capiToken}
              onChange={(e) => setCapiToken(e.target.value)}
              rows={4}
              className="w-full p-3 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus-visible:ring-brand-navy text-xs font-semibold text-brand-navy shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-navy"
              disabled={isSubmitting}
            />
            <p className="text-[10px] text-muted-foreground/60 leading-normal font-semibold">
              Your server-to-server Conversions API (CAPI) Access Token. Generated under the Settings tab in Meta Events Manager.
            </p>
          </div>

          {/* Informational Warning */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[10px] leading-relaxed font-semibold text-amber-800">
            ⚠️ <strong>Deduplication Notice:</strong> This integration automatically matches browser-side Pixel events with server-side CAPI events using a unique Order ID. Do not use external plugins that inject a second Pixel, or events may be double-counted.
          </div>

          {/* Footer actions */}
          <DialogFooter className="pt-4 flex gap-3 -mx-6 -mb-6 bg-zinc-50/50 p-4 border-t border-zinc-100 rounded-b-3xl mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="h-11 rounded-xl font-bold flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="h-11 rounded-xl bg-brand-navy hover:bg-brand-navy/90 text-white font-black uppercase tracking-wider text-xs flex-1"
            >
              {isSubmitting ? "Saving..." : "Save Config"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

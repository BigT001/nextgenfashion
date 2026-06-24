"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSpeedafSettingsAction,
  updateSpeedafSettingsAction,
  getProvincesAction,
  getCitiesAction,
  getAreasAction,
} from "../actions/actions";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface SpeedafSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SpeedafSettingsDialog({
  open,
  onOpenChange,
  onSuccess,
}: SpeedafSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Geo lists
  const [provinces, setProvinces] = useState<Array<{ code: string; name: string }>>([]);
  const [cities, setCities] = useState<Array<{ code: string; name: string }>>([]);
  const [areas, setAreas] = useState<Array<{ code: string; name: string }>>([]);

  // Fetch initial settings & provinces
  useEffect(() => {
    if (!open) return;

    async function loadData() {
      setLoading(true);
      try {
        const [settingsRes, provincesRes] = await Promise.all([
          getSpeedafSettingsAction(),
          getProvincesAction(),
        ]);

        if (settingsRes.success) {
          setSettings(settingsRes.data);
          
          // Preload cities and areas if codes are set
          const provCode = settingsRes.data?.senderProvince;
          const cityCode = settingsRes.data?.senderCity;
          
          if (provCode) {
            const citiesRes = await getCitiesAction(provCode);
            if (citiesRes.success) setCities(citiesRes.data || []);
          }
          if (provCode && cityCode) {
            const areasRes = await getAreasAction(provCode, cityCode);
            if (areasRes.success) setAreas(areasRes.data || []);
          }
        } else {
          toast.error("Failed to load Speedaf settings.");
        }

        if (provincesRes.success) {
          setProvinces(provincesRes.data || []);
        }
      } catch (err) {
        console.error(err);
        toast.error("Connection error loading Speedaf data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [open]);

  // Handle province change
  const handleProvinceChange = async (provCode: string) => {
    setSettings((prev: any) => ({
      ...prev,
      senderProvince: provCode,
      senderCity: "",
      senderDistrict: "",
    }));
    setCities([]);
    setAreas([]);
    if (!provCode) return;

    try {
      const res = await getCitiesAction(provCode);
      if (res.success) {
        setCities(res.data || []);
      }
    } catch (err) {
      toast.error("Failed to fetch cities.");
    }
  };

  // Handle city change
  const handleCityChange = async (cityCode: string) => {
    setSettings((prev: any) => ({
      ...prev,
      senderCity: cityCode,
      senderDistrict: "",
    }));
    setAreas([]);
    if (!settings.senderProvince || !cityCode) return;

    try {
      const res = await getAreasAction(settings.senderProvince, cityCode);
      if (res.success) {
        setAreas(res.data || []);
      }
    } catch (err) {
      toast.error("Failed to fetch areas.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const payload: Record<string, string> = {
        speedafEnabled: String(settings.enabled),
        speedafUatMode: String(settings.uatMode),
        speedafAppCode: settings.appCode || "",
        speedafSecretKey: settings.secretKey || "",
        speedafCustomerCode: settings.customerCode || "",
        speedafPlatformSource: settings.platformSource || "",
        speedafSenderName: settings.senderName || "",
        speedafSenderPhone: settings.senderPhone || "",
        speedafSenderCountry: "NG",
        speedafSenderProvince: settings.senderProvince || "",
        speedafSenderCity: settings.senderCity || "",
        speedafSenderDistrict: settings.senderDistrict || "",
        speedafSenderAddress: settings.senderAddress || "",
      };

      const res = await updateSpeedafSettingsAction(payload);
      if (res.success) {
        toast.success("Speedaf logistics configuration updated.");
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(res.error || "Failed to update configuration.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected save error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-8 border-none glass-card shadow-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl rounded-[2.5rem]">
        <DialogHeader className="space-y-2 mb-6">
          <DialogTitle className="text-2xl font-black text-brand-navy">
            Speedaf Express Logistics Integration
          </DialogTitle>
          <DialogDescription className="text-xs">
            Manage your Speedaf Express API credentials, operating environment, and sender warehouse configurations.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="h-[40vh] flex flex-col items-center justify-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
              Retrieving encrypted credentials...
            </p>
          </div>
        ) : settings ? (
          <form onSubmit={handleSave} className="space-y-8">
            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50 dark:bg-zinc-900/40 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-brand-navy">Enable Speedaf Logistics</p>
                  <p className="text-[10px] text-muted-foreground">Calculate shipping tariffs on checkout.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings((s: any) => ({ ...s, enabled: !s.enabled }))}
                  className={cn(
                    "relative inline-flex h-8 w-14 rounded-full transition-colors duration-300 focus:outline-none shrink-0 shadow-inner",
                    settings.enabled ? "bg-emerald-500" : "bg-zinc-300"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300",
                      settings.enabled ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-brand-navy">UAT Sandbox Mode</p>
                  <p className="text-[10px] text-muted-foreground">Use Sandbox (uat-api.speedaf.com).</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings((s: any) => ({ ...s, uatMode: !s.uatMode }))}
                  className={cn(
                    "relative inline-flex h-8 w-14 rounded-full transition-colors duration-300 focus:outline-none shrink-0 shadow-inner",
                    settings.uatMode ? "bg-amber-500" : "bg-zinc-300"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300",
                      settings.uatMode ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Credentials */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-brand-navy/80">API Access keys</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">App Code (appCode)</Label>
                  <Input
                    value={settings.appCode}
                    onChange={(e) => setSettings((s: any) => ({ ...s, appCode: e.target.value }))}
                    placeholder="e.g. NG000025"
                    className="h-12 bg-zinc-50 border border-zinc-200 rounded-2xl focus-visible:ring-brand-navy font-bold px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Secret Key (secretKey)</Label>
                  <Input
                    type="text"
                    value={settings.secretKey}
                    onChange={(e) => setSettings((s: any) => ({ ...s, secretKey: e.target.value }))}
                    placeholder="Speedaf private signature key"
                    className="h-12 bg-zinc-50 border border-zinc-200 rounded-2xl focus-visible:ring-brand-navy font-bold px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Customer Code (customerCode)</Label>
                  <Input
                    value={settings.customerCode}
                    onChange={(e) => setSettings((s: any) => ({ ...s, customerCode: e.target.value }))}
                    placeholder="Merchant identification code"
                    className="h-12 bg-zinc-50 border border-zinc-200 rounded-2xl focus-visible:ring-brand-navy font-bold px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Platform Source (platformSource)</Label>
                  <Input
                    value={settings.platformSource}
                    onChange={(e) => setSettings((s: any) => ({ ...s, platformSource: e.target.value }))}
                    placeholder="e.g. TEST 345"
                    className="h-12 bg-zinc-50 border border-zinc-200 rounded-2xl focus-visible:ring-brand-navy font-bold px-4"
                  />
                </div>
              </div>
            </div>

            {/* Sender warehouse address */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-brand-navy/80">Warehouse Dispatch Details (Sender)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Contact/Sender Name</Label>
                  <Input
                    value={settings.senderName}
                    onChange={(e) => setSettings((s: any) => ({ ...s, senderName: e.target.value }))}
                    placeholder="Warehouse manager or company name"
                    className="h-12 bg-zinc-50 border border-zinc-200 rounded-2xl focus-visible:ring-brand-navy font-bold px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Contact Phone</Label>
                  <Input
                    value={settings.senderPhone}
                    onChange={(e) => setSettings((s: any) => ({ ...s, senderPhone: e.target.value }))}
                    placeholder="e.g. 08000000000"
                    className="h-12 bg-zinc-50 border border-zinc-200 rounded-2xl focus-visible:ring-brand-navy font-bold px-4"
                  />
                </div>

                {/* Dropdowns */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Province/State</Label>
                  <select
                    value={settings.senderProvince}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="flex h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-brand-navy text-sm"
                  >
                    <option value="">Select State</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">City/LGA</Label>
                  <select
                    value={settings.senderCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    disabled={!settings.senderProvince}
                    className="flex h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-brand-navy text-sm disabled:opacity-50"
                  >
                    <option value="">Select City</option>
                    {cities.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">District/Area</Label>
                  <select
                    value={settings.senderDistrict}
                    onChange={(e) => setSettings((s: any) => ({ ...s, senderDistrict: e.target.value }))}
                    disabled={!settings.senderCity}
                    className="flex h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-brand-navy text-sm disabled:opacity-50"
                  >
                    <option value="">Select Area</option>
                    {areas.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Country</Label>
                  <Input
                    value="Nigeria"
                    disabled
                    className="h-12 bg-zinc-50/50 border border-zinc-200 rounded-2xl font-bold px-4 opacity-75"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Street & Warehouse Address</Label>
                  <Input
                    value={settings.senderAddress}
                    onChange={(e) => setSettings((s: any) => ({ ...s, senderAddress: e.target.value }))}
                    placeholder="e.g. No. 12 Allen Avenue, Ikeja"
                    className="h-12 bg-zinc-50 border border-zinc-200 rounded-2xl focus-visible:ring-brand-navy font-bold px-4"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <DialogFooter className="pt-6 -mx-8 -mb-8 bg-zinc-50/50 dark:bg-zinc-900/30 p-6 border-t border-zinc-100 dark:border-zinc-800/50 rounded-b-[2.5rem]">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-12 px-6 rounded-xl font-bold"
              >
                Abort
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-12 px-8 rounded-xl bg-brand-navy hover:bg-brand-navy/90 text-white font-black uppercase tracking-wider text-xs"
              >
                {saving && <LoadingSpinner size="sm" className="mr-2" />}
                Save Configurations
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Loader2, Activity, PackagePlus, PackageMinus, Ban, AlertCircle } from "lucide-react";
import { getAuditLogsAction } from "../actions/inventory.actions";

import { cn } from "@/lib/utils";

interface InventoryHistoryViewerProps {
  variantId: string;
  refreshTrigger?: number;
}

export function InventoryHistoryViewer({ variantId, refreshTrigger = 0 }: InventoryHistoryViewerProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      const res = await getAuditLogsAction(variantId);
      if (res.success) {
        setLogs(res.data);
      }
      setIsLoading(false);
    }
    fetchLogs();
  }, [variantId, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32 w-full bg-brand-navy/5 rounded-2xl">
        <Loader2 className="animate-spin text-brand-navy size-6 opacity-50" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-32 w-full bg-brand-navy/5 rounded-2xl gap-3">
        <Activity className="size-6 text-muted-foreground opacity-50" />
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">No Activity History</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-brand-navy/5 rounded-2xl w-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-black uppercase tracking-widest text-brand-navy flex items-center gap-2">
          <Activity className="size-4" /> Movement History
        </h4>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white/50 px-2 py-1 rounded-md border border-border/50 shadow-sm">
          {logs.length} Activity Events
        </span>
      </div>
      <div className="max-h-[650px] overflow-y-auto pr-2 space-y-3 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/50 before:to-transparent custom-scrollbar">
        {logs.map((log) => {
          const isDecrement = log.action === "STOCK_DECREMENT";
          const isIncrement = log.action === "STOCK_INCREMENT";
          const isSuspend = log.action === "PRODUCT_SUSPENDED";
          const isActivate = log.action === "PRODUCT_ACTIVATED";
          const isSale = log.action === "SALE_COMPLETED";

          return (
            <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-8 h-8 rounded-full border-[3px] border-brand-navy/5 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                {isIncrement && <PackagePlus className="size-3 text-emerald-500" />}
                {isDecrement && <PackageMinus className="size-3 text-amber-500" />}
                {isSuspend && <Ban className="size-3 text-rose-500" />}
                {isActivate && <Activity className="size-3 text-emerald-500" />}
                {isSale && <AlertCircle className="size-3 text-brand-navy" />}
                {(!isIncrement && !isDecrement && !isSuspend && !isActivate && !isSale) && <Activity className="size-3 text-muted-foreground" />}
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] glass-card border border-brand-navy/10 p-3 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className={cn(
                    "font-black text-[9px] uppercase tracking-widest",
                    isIncrement ? "text-emerald-600" : "",
                    isDecrement ? "text-amber-600" : "",
                    isSuspend ? "text-rose-600" : "",
                    isActivate ? "text-emerald-600" : "",
                    isSale ? "text-brand-navy" : "",
                    (!isIncrement && !isDecrement && !isSuspend && !isActivate && !isSale) ? "text-muted-foreground" : ""
                  )}>
                    {log.action.replace("_", " ")}
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground opacity-70">
                    {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(log.createdAt))}
                  </span>
                </div>
                <div className="text-xs font-bold text-foreground line-clamp-1">
                  {log.details?.reason || log.details?.message || "Stock update logged"}
                </div>
                {log.details?.change && (
                  <div className="mt-1.5 text-[10px] font-black text-muted-foreground flex gap-2 items-center">
                    <span className="opacity-50">CHANGE:</span>
                    <span className={cn("px-1.5 py-0.5 rounded-sm", isDecrement ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600")}>
                      {log.details.change > 0 ? "+" : ""}{log.details.change}
                    </span>
                    <span className="opacity-50 ml-1">STOCK:</span>
                    <span className="bg-brand-navy/5 text-brand-navy px-1.5 py-0.5 rounded-sm">
                      {log.details.newQuantity}
                    </span>
                  </div>
                )}
                {/* Audit Author Detail */}
                <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Executed By</span>
                  <span className="text-[9px] font-bold text-brand-navy/80">{log.userId}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

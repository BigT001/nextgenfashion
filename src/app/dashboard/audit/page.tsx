"use client";

import { useEffect, useState } from "react";
import { 
  History, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle,
  Clock,
  User as UserIcon,
  Tag
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getAuditLogsAction } from "@/modules/inventory/actions/inventory.actions";

// We need an action to fetch audit logs
export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      const result = await getAuditLogsAction();
      if (result.success) {
        setLogs(result.data);
      }
      setIsLoading(false);
    }
    loadLogs();
  }, []);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "createdAt",
      header: "TIMESTAMP",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          <Clock className="size-3" />
          {new Date(row.original.createdAt).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: "OPERATION",
      cell: ({ row }) => {
        const action = row.original.action;
        const isIncrement = action === "STOCK_INCREMENT";
        return (
          <Badge className={isIncrement ? "bg-emerald-500/10 text-emerald-600 border-none" : "bg-rose-500/10 text-rose-600 border-none"}>
            {isIncrement ? <ArrowUpRight className="mr-1 size-3" /> : <ArrowDownLeft className="mr-1 size-3" />}
            {action}
          </Badge>
        );
      },
    },
    {
      accessorKey: "details",
      header: "ARCHITECTURAL CONTEXT",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-bold text-sm">
            {row.original.details?.reason || "System Adjustment"}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">
            DELTA: {row.original.details?.change > 0 ? "+" : ""}{row.original.details?.change} UNITS
          </div>
        </div>
      ),
    },
    {
      accessorKey: "userId",
      header: "AUTHORITY",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-brand-navy/10 flex items-center justify-center">
            <UserIcon className="size-3 text-brand-navy" />
          </div>
          <span className="font-bold text-xs uppercase tracking-tight">{row.original.userId}</span>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Retrieving System Forensics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-slow-fade">
      <div className="space-y-1">
        <h2 className="text-4xl font-black tracking-tight text-gradient">Audit Intelligence</h2>
        <p className="text-muted-foreground font-medium">Complete immutable ledger of all architectural stock movements.</p>
      </div>

      <div className="glass-card border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
        <DataTable 
          columns={columns} 
          data={logs} 
          searchKey="action"
        />
      </div>
    </div>
  );
}

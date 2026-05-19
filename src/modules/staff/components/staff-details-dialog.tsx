"use client";

import { useEffect, useState } from "react";
import { UserRole } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Activity,
  Loader2,
  UserCircle,
  ShieldAlert,
  Ban,
  ShieldCheck,
  Edit,
  Trash2,
  Calendar,
  Lock
} from "lucide-react";
import { getStaffLogsAction } from "../actions/staff.actions";

interface StaffMember {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  image: string | null;
  isSuspended: boolean;
  category: string | null;
  permissions: string[];
}

interface StaffDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember | null;
  onEdit: (staff: StaffMember) => void;
  onToggleSuspend: (staff: StaffMember) => void;
  onDelete: (staffId: string) => void;
}

export function StaffDetailsDialog({
  open,
  onOpenChange,
  staff,
  onEdit,
  onToggleSuspend,
  onDelete
}: StaffDetailsDialogProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    if (!open || !staff) return;

    async function loadLogs() {
      if (!staff) return;
      setIsLoadingLogs(true);
      try {
        const res = await getStaffLogsAction(
          staff.id,
          staff.name || undefined,
          staff.email || undefined
        );
        if (res.success && res.data) {
          setLogs(res.data);
        }
      } catch (err) {
        console.error("Failed to load staff activities:", err);
      } finally {
        setIsLoadingLogs(false);
      }
    }

    loadLogs();
  }, [open, staff]);

  if (!staff) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] max-h-[95vh] overflow-hidden flex flex-col p-0 rounded-2xl border-zinc-200/80 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Top Header Card */}
        <div className="bg-zinc-900 text-white p-6 relative overflow-hidden flex-shrink-0">
          <div className="absolute right-0 top-0 w-64 h-64 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center overflow-hidden">
                {staff.image ? (
                  <img
                    src={staff.image}
                    alt={staff.name || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-10 w-10 text-zinc-300" />
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-white">
                  {staff.name || "Unknown Staff"}
                </DialogTitle>
                <DialogDescription className="text-zinc-400 mt-1 flex items-center gap-2 font-medium">
                  {staff.email}
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs uppercase tracking-wider font-semibold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                    {staff.category || "Staff"}
                  </span>
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {staff.isSuspended ? (
                <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  SUSPENDED
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  ACTIVE
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white flex-1 overflow-y-auto min-h-0">
          
          {/* Left Panel: Profile and Security Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> Security Clearance & Role
              </h3>
              <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">System Role:</span>
                  <Badge className="bg-zinc-900 text-white font-bold uppercase tracking-wider px-2.5 py-0.5 border-none">
                    {staff.role}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">Department / Category:</span>
                  <span className="font-bold text-zinc-800">{staff.category || "Unassigned"}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">
                Module Permissions
              </h3>
              <div className="flex flex-wrap gap-2">
                {staff.permissions && staff.permissions.length > 0 ? (
                  staff.permissions.map((p) => {
                    const label = p === "POS" ? "Point of Sale (POS)"
                                : p === "PRODUCTS" ? "Product Management"
                                : p === "INVENTORY" ? "Inventory Management"
                                : p === "ORDERS" ? "Order Management"
                                : p === "CUSTOMERS" ? "Customer Relations"
                                : p === "STAFF" ? "Staff Management"
                                : p === "ANALYTICS" ? "Analytics & Audit"
                                : p;
                    return (
                      <Badge
                        key={p}
                        className="bg-zinc-100 text-zinc-800 border-none font-semibold px-3 py-1 text-xs hover:bg-zinc-200"
                      >
                        {label}
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-xs text-zinc-500 italic bg-zinc-50 p-3 rounded-lg border w-full block">
                    No administrative permissions assigned (Standard Dashboard access only)
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-xl space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> Monitoring Notice
              </h4>
              <p className="text-xs text-amber-700/90 leading-relaxed font-medium">
                This account is active within an audited environment. Every action—including sales, inventory adjustments, and account modification attempts—is tied to this profile and recorded permanently.
              </p>
            </div>
          </div>

          {/* Right Panel: Activity Audit Logs */}
          <div className="space-y-4 border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-8 border-zinc-100 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-zinc-500 animate-pulse" /> Activity Journal
              </h3>
              <span className="text-[10px] font-black text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                Last 30 actions
              </span>
            </div>

            {isLoadingLogs ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 animate-pulse">
                  Hydrating Action Ledger...
                </span>
              </div>
            ) : logs.length > 0 ? (
              <div className="overflow-y-auto space-y-2.5 pr-2 scrollbar-thin flex-1 min-h-0 pb-6">
                {logs.map((log) => {
                  let description = log.action;
                  if (log.action === "SALE_COMPLETED") {
                    description = `Completed sale of ${log.details?.totalAmount ? `₦${Number(log.details.totalAmount).toLocaleString()}` : "items"}`;
                  } else if (log.action === "STOCK_INCREMENT") {
                    description = `Incremented stock of ${log.details?.productName || "Product"} by ${log.details?.change || "some"} units`;
                  } else if (log.action === "STOCK_DECREMENT") {
                    description = `Decremented stock of ${log.details?.productName || "Product"} by ${Math.abs(log.details?.change || 0)} units`;
                  } else if (log.action === "STAFF_INVITED") {
                    description = `Invited new staff member: ${log.details?.email || ""}`;
                  } else if (log.action === "STAFF_UPDATED") {
                    description = `Updated staff: ${log.details?.name || ""}`;
                  } else if (log.action === "STAFF_SUSPENDED") {
                    description = `Suspended staff account`;
                  } else if (log.action === "STAFF_ACTIVATED") {
                    description = `Activated staff account`;
                  } else if (log.action === "PRODUCT_SUSPENDED") {
                    description = `Suspended product variant`;
                  } else if (log.action === "PRODUCT_ACTIVATED") {
                    description = `Activated product variant`;
                  }

                  const logDate = new Date(log.createdAt);
                  const formattedDateTime = `${logDate.toLocaleDateString()} ${logDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

                  return (
                    <div
                      key={log.id}
                      className="text-xs p-3 bg-zinc-50 border border-zinc-100 rounded-xl space-y-1.5 hover:border-zinc-200 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <Badge
                          variant="outline"
                          className="text-[9px] uppercase px-1.5 py-0 border-none bg-zinc-100 text-zinc-600 font-semibold"
                        >
                          {log.action.replace("_", " ")}
                        </Badge>
                        <span className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formattedDateTime}
                        </span>
                      </div>
                      <p className="font-semibold text-zinc-700 leading-normal">
                        {description}
                      </p>
                      
                      {log.action === "SALE_COMPLETED" && log.details?.items && log.details.items.length > 0 && (
                        <div className="mt-2 pl-3 border-l-2 border-zinc-200 space-y-1 text-[11px] text-zinc-500 font-medium">
                          {log.details.items.map((item: any, idx: number) => (
                            <div key={idx}>
                              • {item.productName} ({item.size || ""}{item.color ? ` / ${item.color}` : ""}) x{item.quantity} @ ₦{Number(item.price).toLocaleString()}
                            </div>
                          ))}
                        </div>
                      )}

                      {(log.action === "STOCK_INCREMENT" || log.action === "STOCK_DECREMENT") && (
                        <div className="mt-2 pl-3 border-l-2 border-zinc-200 space-y-1 text-[11px] text-zinc-500 font-medium">
                          {log.details?.sku && (
                            <div>SKU: <span className="font-semibold text-zinc-600">{log.details.sku}</span></div>
                          )}
                          {log.details?.change !== undefined && (
                            <div>Adjustment: <span className={`font-semibold ${log.details.change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{log.details.change > 0 ? `+${log.details.change}` : log.details.change} units</span></div>
                          )}
                          {log.details?.newQuantity !== undefined && (
                            <div>Resulting Stock: <span className="font-semibold text-zinc-600">{log.details.newQuantity} units</span></div>
                          )}
                        </div>
                      )}

                      {log.details?.reason && (
                        <p className="text-[10px] text-zinc-400 italic">
                          Reason: {log.details.reason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-50/50 rounded-xl border border-dashed p-4 flex-1">
                <Clock className="h-8 w-8 text-zinc-300 mb-2" />
                <span className="text-xs text-zinc-400 font-medium italic">
                  No recent activities recorded on ledger
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="bg-zinc-50 border-t border-zinc-100 px-6 py-4 flex flex-wrap justify-between items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(staff);
              }}
              className="text-zinc-700 font-semibold text-xs rounded-lg flex items-center gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" /> Edit Profile
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onToggleSuspend(staff);
              }}
              className="text-zinc-700 font-semibold text-xs rounded-lg flex items-center gap-1.5"
            >
              {staff.isSuspended ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Activate Account
                </>
              ) : (
                <>
                  <Ban className="h-3.5 w-3.5 text-rose-600" /> Suspend Account
                </>
              )}
            </Button>

            {staff.role !== "SUPERADMIN" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onDelete(staff.id);
                }}
                className="font-semibold text-xs rounded-lg flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Staff
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-zinc-500 font-bold text-xs hover:bg-zinc-100 rounded-lg"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Truck,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  TrendingUp,
  History,
  Printer,
  XCircle,
  Play,
  RotateCcw,
  Copy,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  dispatchOrderToSpeedafAction,
  cancelWaybillAction,
  getLogisticsSalesAction,
  getSpeedafSettingsAction
} from "@/modules/delivery/actions/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

type ActiveTab = "ALL" | "PENDING_DISPATCH" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export default function LogisticsClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState<any[]>(initialData || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("ALL");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Modals state
  const [trajectoryModalOpen, setTrajectoryModalOpen] = useState(false);
  const [activeTrajectory, setActiveTrajectory] = useState<any[]>([]);
  const [activeOrderNum, setActiveOrderNum] = useState("");
  const [activeWaybill, setActiveWaybill] = useState("");

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelSaleId, setCancelSaleId] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [labelOrder, setLabelOrder] = useState<any>(null);

  // Fetch Speedaf settings and load latest data
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getLogisticsSalesAction();
      if (res.success && res.data) {
        setData(res.data);
      }
      
      const configRes = await getSpeedafSettingsAction();
      if (configRes.success && configRes.data) {
        setSettings(configRes.data);
      }
    } catch (err) {
      console.error("Failed to load logistics workspace:", err);
      toast.error("Failed to reload logistics dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Copy to clipboard helper
  const handleCopy = (text: string, subject: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${subject} copied to clipboard!`);
  };

  // Dispatch Waybill action
  const handleDispatch = async (saleId: string, orderNumber: string) => {
    const toastId = toast.loading(`Requesting Speedaf waybill for Order ${orderNumber}...`);
    try {
      const res = await dispatchOrderToSpeedafAction(saleId);
      if (res.success) {
        toast.success(`Waybill created successfully: ${res.waybillNumber}`, { id: toastId });
        loadData();
      } else {
        toast.error(res.error || "Failed to dispatch waybill.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during dispatch.", { id: toastId });
    }
  };

  // Cancel Waybill Action
  const triggerCancelDialog = (saleId: string) => {
    setCancelSaleId(saleId);
    setCancelReason("Customer request");
    setCancelModalOpen(true);
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation.");
      return;
    }

    setCancelModalOpen(false);
    const toastId = toast.loading("Canceling waybill with Speedaf...");
    try {
      const res = await cancelWaybillAction(cancelSaleId, cancelReason);
      if (res.success) {
        toast.success("Waybill cancelled successfully.", { id: toastId });
        loadData();
      } else {
        toast.error(res.error || "Failed to cancel waybill.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel waybill.", { id: toastId });
    }
  };

  // Trigger View Scan/Trajectory history
  const handleViewTrajectory = (sale: any) => {
    setActiveOrderNum(sale.orderNumber);
    setActiveWaybill(sale.waybillNumber || "N/A");
    
    // Parse scan history
    let history: any[] = [];
    if (sale.deliveryHistory) {
      if (Array.isArray(sale.deliveryHistory)) {
        history = sale.deliveryHistory;
      } else {
        try {
          history = JSON.parse(sale.deliveryHistory as string);
        } catch (e) {
          history = [sale.deliveryHistory];
        }
      }
    }
    setActiveTrajectory(history);
    setTrajectoryModalOpen(true);
  };

  // Trigger packing slip print
  const handlePrintLabel = (sale: any) => {
    setLabelOrder(sale);
    setLabelModalOpen(true);
  };

  const handlePrintAction = () => {
    const printContent = document.getElementById("printable-label")?.innerHTML;
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>NextGen Kiddies Shipping Label - ${labelOrder?.orderNumber}</title>
            <style>
              body { font-family: monospace; padding: 20px; color: #000; }
              .label-card { border: 2px solid #000; padding: 15px; width: 400px; margin: 0 auto; }
              .header { text-align: center; font-weight: bold; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
              .section { margin-bottom: 10px; font-size: 12px; }
              .section-title { font-weight: bold; text-transform: uppercase; margin-bottom: 3px; }
              .row { display: flex; justify-content: space-between; }
              .barcode { text-align: center; margin: 15px 0; font-size: 24px; letter-spacing: 5px; font-weight: bold; }
              .dashed-line { border-bottom: 1px dashed #000; margin: 10px 0; }
              .item-list { font-size: 11px; width: 100%; border-collapse: collapse; }
              .item-list th, .item-list td { text-align: left; padding: 3px; }
              @media print {
                body { padding: 0; }
                .label-card { border: 2px solid #000; width: 100%; box-sizing: border-box; }
              }
            </style>
          </head>
          <body>
            <div class="label-card">
              ${printContent}
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Metrics Orchestration
  const metrics = useMemo(() => {
    let totalWaybills = 0;
    let pendingDispatch = 0;
    let inTransit = 0;
    let delivered = 0;

    data.forEach((sale) => {
      const hasWaybill = !!sale.waybillNumber;
      const status = sale.deliveryStatus || "";

      if (hasWaybill) {
        totalWaybills++;
        // Speedaf delivered status codes are typically 200 or "DELIVERED"
        if (status === "200" || status === "DELIVERED" || sale.status === "COMPLETED") {
          delivered++;
        } else if (status === "CANCELLED") {
          // not counted as in-transit
        } else {
          inTransit++;
        }
      } else {
        if (sale.status === "PENDING" || sale.status === "PAID" || sale.status === "COMPLETED" || sale.status === "PROCESSING") {
          pendingDispatch++;
        }
      }
    });

    return { totalWaybills, pendingDispatch, inTransit, delivered };
  }, [data]);

  // Billing Statistics Orchestration
  const billingStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    let totalBilled = 0;
    let thisMonthBilled = 0;
    let lastMonthBilled = 0;

    const monthlyMap: Record<string, number> = {};

    data.forEach((sale) => {
      if (!sale.waybillNumber || !sale.deliveryFee) return;

      const fee = Number(sale.deliveryFee) || 0;
      totalBilled += fee;

      const saleDate = new Date(sale.createdAt);
      const saleYear = saleDate.getFullYear();
      const saleMonth = saleDate.getMonth();

      const monthKey = `${saleYear}-${String(saleMonth + 1).padStart(2, "0")}`;
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + fee;

      if (saleYear === currentYear && saleMonth === currentMonth) {
        thisMonthBilled += fee;
      } else {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        if (saleYear === lastMonthYear && saleMonth === lastMonth) {
          lastMonthBilled += fee;
        }
      }
    });

    const breakdown = Object.entries(monthlyMap)
      .map(([month, amount]) => {
        const [year, m] = month.split("-");
        const date = new Date(Number(year), Number(m) - 1, 1);
        const name = date.toLocaleString("default", { month: "long", year: "numeric" });
        return { name, amount, rawMonth: month };
      })
      .sort((a, b) => b.rawMonth.localeCompare(a.rawMonth));

    return { totalBilled, thisMonthBilled, lastMonthBilled, breakdown };
  }, [data]);

  // Filtering data
  const filteredData = useMemo(() => {
    return data.filter((sale) => {
      // 1. Search filter
      const searchStr = `${sale.orderNumber} ${sale.waybillNumber || ""} ${sale.Customer?.name || ""} ${sale.Customer?.phone || ""}`.toLowerCase();
      if (searchQuery && !searchStr.includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 2. Tab filter
      const hasWaybill = !!sale.waybillNumber;
      const status = sale.deliveryStatus || "";

      if (activeTab === "PENDING_DISPATCH") {
        return !hasWaybill && (sale.status === "PENDING" || sale.status === "PAID" || sale.status === "COMPLETED" || sale.status === "PROCESSING");
      }
      if (activeTab === "IN_TRANSIT") {
        return hasWaybill && status !== "200" && status !== "DELIVERED" && status !== "CANCELLED" && sale.status !== "COMPLETED";
      }
      if (activeTab === "DELIVERED") {
        return hasWaybill && (status === "200" || status === "DELIVERED" || sale.status === "COMPLETED");
      }
      if (activeTab === "CANCELLED") {
        return status === "CANCELLED";
      }

      return true;
    });
  }, [data, searchQuery, activeTab]);

  // Define Columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "orderNumber",
      header: "ORDER ID",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="size-9 bg-brand-navy/10 rounded-lg flex items-center justify-center text-brand-navy shrink-0">
            <Truck className="size-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tight text-brand-navy hover:underline cursor-pointer" onClick={() => handlePrintLabel(row.original)}>
              {row.original.orderNumber}
            </span>
            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">
              {new Date(row.original.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "Customer.name",
      header: "PATRON",
      cell: ({ row }) => {
        const customer = row.original.Customer;
        return (
          <div className="flex flex-col max-w-[200px]">
            <span className="font-black text-xs tracking-tight text-zinc-950 truncate">
              {customer?.name || "Patron Guest"}
            </span>
            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest truncate">
              {customer?.phone || "No Mobile Identity"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "waybillNumber",
      header: "WAYBILL / CARRIER",
      cell: ({ row }) => {
        const waybill = row.original.waybillNumber;
        const carrier = row.original.carrier || "SPEEDAF";
        return (
          <div className="flex flex-col">
            {waybill ? (
              <div className="flex items-center gap-1.5 group">
                <span className="font-black text-xs tracking-tight text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                  {waybill}
                </span>
                <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 size-6" onClick={() => handleCopy(waybill, "Waybill number")}>
                  <Copy className="size-3.5" />
                </Button>
              </div>
            ) : (
              <Badge variant="outline" className="w-fit font-black text-[9px] text-amber-600 bg-amber-50 border-amber-200 py-0.5">
                PENDING DISPATCH
              </Badge>
            )}
            <span className="text-[9px] font-black tracking-widest uppercase text-muted-foreground mt-0.5">
              {carrier}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "destination",
      header: "DESTINATION",
      cell: ({ row }) => {
        const province = row.original.deliveryProvinceName || "";
        const city = row.original.deliveryCityName || "";
        const district = row.original.deliveryDistrictName || "";
        return (
          <div className="flex flex-col max-w-[220px]">
            <span className="font-black text-xs text-zinc-900 truncate">
              {city ? `${city}, ${province}` : row.original.Customer?.address || "Lagos, Nigeria"}
            </span>
            <span className="text-[9px] text-muted-foreground font-bold tracking-tight truncate">
              {district ? `${district}` : ""}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "totalWeight",
      header: "PARCEL",
      cell: ({ row }) => {
        let weight = 0;
        if (row.original.SaleItem) {
          row.original.SaleItem.forEach((item: any) => {
            const itemWeight = Number(item.ProductVariant?.weight) || Number(item.ProductVariant?.Product?.weight) || 0.5;
            weight += itemWeight * item.quantity;
          });
        }
        return (
          <div className="flex flex-col">
            <span className="font-black text-xs tracking-tight">
              {weight.toFixed(1)} kg
            </span>
            <span className="text-[9px] text-muted-foreground font-bold">
              {row.original.SaleItem?.length || 0} line items
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "deliveryFee",
      header: "DELIVERY FEE",
      cell: ({ row }) => (
        <div className="font-black text-zinc-950 tracking-tighter text-sm">
          ₦{(Number(row.original.deliveryFee) || 0).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "deliveryStatus",
      header: "SPEEDAF STATUS",
      cell: ({ row }) => {
        const status = row.original.deliveryStatus;
        const scanMsg = row.original.deliveryHistory?.[row.original.deliveryHistory.length - 1]?.msgEng || "Order Registered";

        let badgeStyle = "bg-zinc-100 text-zinc-600";
        if (status === "200" || status === "DELIVERED") {
          badgeStyle = "bg-emerald-500/10 text-emerald-600";
        } else if (status === "CANCELLED") {
          badgeStyle = "bg-rose-500/10 text-rose-600";
        } else if (status === "PENDING") {
          badgeStyle = "bg-amber-500/10 text-amber-600";
        } else if (status) {
          badgeStyle = "bg-sky-500/10 text-sky-600";
        }

        return (
          <div className="flex flex-col max-w-[150px]">
            <Badge className={cn("w-fit font-black text-[9px] py-0.5 tracking-wider border-none shadow-sm uppercase", badgeStyle)}>
              {status || "READY TO BOOK"}
            </Badge>
            {row.original.waybillNumber && (
              <span className="text-[9px] text-muted-foreground font-bold tracking-tight truncate mt-0.5">
                {scanMsg}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const sale = row.original;
        const hasWaybill = !!sale.waybillNumber;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center hover:bg-brand-navy/5 hover:text-brand-navy rounded-xl transition-colors text-muted-foreground focus:outline-none">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card p-1.5 border-zinc-200">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-2 py-1">Shipment Operations</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-100" />
                {!hasWaybill && (
                  <DropdownMenuItem className="gap-2 font-bold cursor-pointer rounded-lg px-2" onClick={() => handleDispatch(sale.id, sale.orderNumber)}>
                    <Play className="size-3.5 text-emerald-600" />
                    <span>Dispatch Waybill</span>
                  </DropdownMenuItem>
                )}
                {hasWaybill && (
                  <DropdownMenuItem className="gap-2 font-bold cursor-pointer rounded-lg px-2" onClick={() => handleViewTrajectory(sale)}>
                    <History className="size-3.5 text-blue-600" />
                    <span>Scan Trajectory</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="gap-2 font-bold cursor-pointer rounded-lg px-2" onClick={() => handlePrintLabel(sale)}>
                  <Printer className="size-3.5 text-indigo-600" />
                  <span>Packing / Shipping Label</span>
                </DropdownMenuItem>
                {hasWaybill && sale.deliveryStatus !== "CANCELLED" && (
                  <DropdownMenuItem className="gap-2 font-bold cursor-pointer rounded-lg px-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50" onClick={() => triggerCancelDialog(sale.id)}>
                    <XCircle className="size-3.5" />
                    <span>Cancel Waybill</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-20 animate-slow-fade">
      
      {/* Settings warning header */}
      {settings && !settings.enabled && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl shadow-sm">
          <AlertCircle className="size-5 shrink-0 text-rose-600" />
          <div className="text-sm font-semibold">
            Speedaf Logistics is disabled in configuration. Auto-dispatches are offline, and manual bookings will result in errors. Enable it in settings.
          </div>
        </div>
      )}

      {/* Header Segment */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">Logistics Suite</h1>
          <p className="text-sm text-zinc-500 font-medium">Orchestrate parcel deliveries, track scan trajectories, and cancel waybills.</p>
        </div>
        <Button onClick={loadData} disabled={loading} className="rounded-xl font-bold bg-brand-navy hover:bg-brand-navy/90 text-white gap-2 flex items-center">
          <RotateCcw className={cn("size-4", loading && "animate-spin")} />
          Reload Data
        </Button>
      </div>

      {/* Overview Analytics metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Dispatched Shipments"
          value={metrics.totalWaybills.toLocaleString()}
          icon={Truck}
          description="Total Speedaf bookings generated"
        />
        <MetricCard
          title="Pending Dispatch"
          value={metrics.pendingDispatch.toLocaleString()}
          icon={Clock}
          description="Awaiting Speedaf waypoint generation"
        />
        <MetricCard
          title="In Transit"
          value={metrics.inTransit.toLocaleString()}
          icon={TrendingUp}
          description="En-route packages scanned in hubs"
        />
        <MetricCard
          title="Delivered Successfully"
          value={metrics.delivered.toLocaleString()}
          icon={CheckCircle2}
          description="Arrived and completed packages"
        />
      </div>

      {/* Billing & Statements Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Financial summaries */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl border-none shadow-lg bg-zinc-950 text-white flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">This Month's Invoice (Est.)</span>
              <TrendingUp className="size-4.5 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight">₦{billingStats.thisMonthBilled.toLocaleString()}</h2>
              <p className="text-[9px] font-semibold text-white/40 uppercase tracking-widest">Billed current calendar month</p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl border-none shadow-lg bg-white border border-zinc-200 text-zinc-950 flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Last Month's Invoice</span>
              <Clock className="size-4.5 text-zinc-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight text-brand-navy">₦{billingStats.lastMonthBilled.toLocaleString()}</h2>
              <p className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">Completed previous cycle</p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl border-none shadow-lg bg-white border border-zinc-200 text-zinc-950 flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Total Cumulative Bill</span>
              <Truck className="size-4.5 text-brand-navy" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight text-brand-navy">₦{billingStats.totalBilled.toLocaleString()}</h2>
              <p className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">All dispatched waybills</p>
            </div>
          </div>
        </div>

        {/* Right: Monthly Statement breakdown list */}
        <div className="lg:col-span-4 glass-card p-6 rounded-3xl border-none shadow-lg bg-white border border-zinc-200 text-zinc-950 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-800">Monthly Statements</h3>
              <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-tighter bg-zinc-50 border-zinc-200">Ledger</Badge>
            </div>
            <div className="space-y-3 max-h-[110px] overflow-y-auto pr-1">
              {billingStats.breakdown.length > 0 ? (
                billingStats.breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1.5 border-b border-zinc-100 last:border-b-0">
                    <span className="text-xs font-bold text-zinc-700">{item.name}</span>
                    <span className="text-sm font-black text-brand-navy">₦{item.amount.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-zinc-400 font-bold py-6 text-center">No billing cycles recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls: Search, Tabs, Data Table */}
      <div className="glass-card p-6 rounded-[2rem] border-none shadow-xl space-y-6">
        
        {/* Search & Tabs */}
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          
          {/* Tabs switcher */}
          <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-zinc-100 p-1.5 border border-zinc-200 w-fit">
            {(["ALL", "PENDING_DISPATCH", "IN_TRANSIT", "DELIVERED", "CANCELLED"] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                  activeTab === tab
                    ? "bg-brand-navy text-white shadow-md"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-zinc-400" />
            <Input
              type="search"
              placeholder="Search ID, waybill, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-brand-navy"
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable columns={columns} data={filteredData} />
      </div>

      {/* MODAL 1: Trajectory Scan History Timeline */}
      <Dialog open={trajectoryModalOpen} onOpenChange={setTrajectoryModalOpen}>
        <DialogContent className="max-w-lg p-6 rounded-3xl bg-white border-zinc-200">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-base font-black text-brand-navy uppercase tracking-wider">Tracking History</DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
              Order: {activeOrderNum} | Waybill: {activeWaybill}
            </DialogDescription>
          </DialogHeader>

          {/* Scan updates tree */}
          <div className="my-2 max-h-[60vh] overflow-y-auto pr-2 space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-200">
            {activeTrajectory && activeTrajectory.length > 0 ? (
              activeTrajectory.map((scan, idx) => {
                const isLatest = idx === activeTrajectory.length - 1;
                return (
                  <div key={idx} className="flex gap-4 relative">
                    <div className={cn(
                      "size-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm border border-white",
                      isLatest ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-500"
                    )}>
                      {isLatest ? <Truck className="size-4" /> : <Clock className="size-4" />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={cn("text-xs font-black", isLatest ? "text-zinc-950" : "text-zinc-600")}>
                        {scan.msgEng || scan.actionName || "Hub Check-in"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {scan.facilityName || scan.siteName || "Logistics Terminal"}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold mt-0.5">
                        {scan.createTime ? new Date(scan.createTime).toLocaleString() : new Date().toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <AlertCircle className="size-8 text-zinc-400" />
                <p className="text-sm font-bold text-zinc-500">No trajectory records scanned yet.</p>
                <p className="text-xs text-zinc-400">Scan details appear once Speedaf checks in the package.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Cancel Waybill Prompt */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="max-w-md p-6 sm:p-8 rounded-3xl bg-white border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-rose-600">Cancel Waybill Shipment</DialogTitle>
            <DialogDescription className="text-sm font-medium">
              This will request order cancellation on Speedaf servers. Provide a reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason" className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Cancellation Reason</Label>
              <Input
                id="cancel-reason"
                type="text"
                placeholder="Reason for cancellation (e.g. Customer request)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
                className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-brand-navy"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-zinc-100 gap-2">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setCancelModalOpen(false)}>
              Abort
            </Button>
            <Button className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white" onClick={handleCancelSubmit}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Print Packing & Shipping Label */}
      <Dialog open={labelModalOpen} onOpenChange={setLabelModalOpen}>
        <DialogContent className="max-w-2xl p-6 rounded-3xl bg-white border-zinc-200">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
            <div>
              <DialogTitle className="text-xl font-black text-brand-navy uppercase tracking-wider">Shipping Label</DialogTitle>
            </div>
            <div className="flex items-center gap-2 pr-6">
              <Button 
                className="rounded-xl font-bold bg-brand-navy hover:bg-brand-navy/90 text-white flex items-center gap-2 h-10 px-4" 
                onClick={handlePrintAction}
              >
                <Printer className="size-4" />
                Print Label
              </Button>
            </div>
          </DialogHeader>

          {/* Packing label mock */}
          <div className="py-2 overflow-y-auto max-h-[70vh]">
            <div id="printable-label" className="bg-white p-8 border-2 border-zinc-950 font-mono text-zinc-950 max-w-lg mx-auto shadow-[0_0_10px_rgba(0,0,0,0.05)] rounded-lg">
              <div className="header text-center border-b-2 border-zinc-900 pb-4 mb-4">
                <h3 className="font-bold text-lg m-0 uppercase tracking-tighter">NEXTGEN KIDDIES SHIPPING LABEL</h3>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase">NextGen Kiddies Storefront</p>
              </div>

              {/* Waybill Code and barcode */}
              <div className="section text-center my-4">
                <div className="barcode text-2xl font-bold tracking-[0.3em] uppercase py-2 border-2 border-zinc-900 rounded-lg inline-block px-4">
                  {labelOrder?.waybillNumber || "*PENDING DISPATCH*"}
                </div>
                <div className="text-[10px] font-black uppercase mt-1">Waybill code</div>
              </div>

              <div className="dashed-line border-b border-dashed border-zinc-900 my-4" />

              {/* Sender info */}
              <div className="section">
                <div className="section-title text-xs font-black uppercase mb-1">FROM (SENDER):</div>
                <div className="text-sm font-bold">{settings?.senderName || "NextGen Fashion"}</div>
                <div className="text-xs text-zinc-700">{settings?.senderPhone || "08000000000"}</div>
                <div className="text-xs text-zinc-700">
                  {settings?.senderAddress || "Lagos Warehouse Hub, Ikeja"}
                </div>
              </div>

              <div className="dashed-line border-b border-dashed border-zinc-900 my-4" />

              {/* Receiver info */}
              <div className="section">
                <div className="section-title text-xs font-black uppercase mb-1">TO (RECEIVER / PATRON):</div>
                <div className="text-sm font-bold">{labelOrder?.Customer?.name || "Patron Guest"}</div>
                <div className="text-xs text-zinc-700">{labelOrder?.Customer?.phone || "No Mobile"}</div>
                <div className="text-xs text-zinc-700">
                  {labelOrder?.Customer?.address || "Address Not Logged"}
                </div>
                <div className="text-xs text-zinc-700 mt-0.5 font-black uppercase">
                  Destination: {labelOrder?.deliveryDistrictName ? `${labelOrder.deliveryDistrictName}, ` : ""}{labelOrder?.deliveryCityName ? `${labelOrder.deliveryCityName}, ` : ""}{labelOrder?.deliveryProvinceName || ""}
                </div>
              </div>

              <div className="dashed-line border-b border-dashed border-zinc-900 my-4" />

              {/* Items checklist */}
              <div className="section">
                <div className="section-title text-xs font-black uppercase mb-2">Item checklist:</div>
                <table className="item-list w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 font-black">
                      <th className="py-1">DESCRIPTION</th>
                      <th className="py-1 text-right">QTY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labelOrder?.SaleItem?.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-zinc-100">
                        <td className="py-1 truncate max-w-[200px]">{item.ProductVariant?.Product?.name || "Luxury Apparel"}</td>
                        <td className="py-1 text-right">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="dashed-line border-b border-dashed border-zinc-900 my-4" />

              <div className="section text-xs font-bold">
                <div className="row flex justify-between">
                  <span>ORDER NUMBER:</span>
                  <span>{labelOrder?.orderNumber}</span>
                </div>
                <div className="row flex justify-between mt-1">
                  <span>WEIGHT:</span>
                  <span>
                    {labelOrder?.SaleItem?.reduce((sum: number, item: any) => sum + (Number(item.ProductVariant?.weight || item.ProductVariant?.Product?.weight || 0.5) * item.quantity), 0).toFixed(1)} kg
                  </span>
                </div>
                <div className="row flex justify-between mt-1">
                  <span>SHIPMENT FEE:</span>
                  <span>₦{(Number(labelOrder?.deliveryFee) || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

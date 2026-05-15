"use client";

import { useEffect, useState } from "react";
import { 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  User, 
  MapPin, 
  Calendar, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Package,
  ArrowRight,
  ShieldCheck,
  MoreHorizontal,
  Download,
  Printer
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getOrderDetailAction, updateOrderStatusAction } from "../actions/order.actions";
import { OrderReceipt } from "./order-receipt";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";

interface OrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
}

export function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    async function loadData() {
      setIsLoading(true);
      const result = await getOrderDetailAction(orderId!);
      if (result.success) {
        setData(result.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [orderId]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!orderId) return;
    setIsUpdating(true);
    const result = await updateOrderStatusAction(orderId, newStatus as any);
    if (result.success) {
        setData((prev: any) => ({ ...prev, status: newStatus }));
        toast.success(`Fulfillment state updated to ${newStatus}`);
    } else {
        toast.error("Failed to update fulfillment state");
    }
    setIsUpdating(false);
  };

  return (
    <Dialog open={!!orderId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden border-none glass-card shadow-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl rounded-[3rem]">
        {isLoading ? (
          <div className="h-[600px] flex flex-col items-center justify-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Auditing Fulfillment Signature...</p>
          </div>
        ) : data ? (
          <div className="flex flex-col h-[85vh] md:h-[700px]">
            {/* Header: Identity & Global Status */}
            <div className="p-8 md:p-10 bg-brand-mesh border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-zinc-950/20" />
                <div className="flex items-center gap-6 relative z-10">
                    <div className="size-16 bg-white shadow-2xl rounded-2xl flex items-center justify-center text-brand-navy group">
                        <ShoppingBag className="size-8 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-white tracking-tighter leading-none">{data.orderNumber}</h2>
                        <div className="flex items-center gap-3">
                            <Badge className="bg-white/10 text-white border-none font-black text-[10px] px-3 tracking-widest uppercase">
                                {data.paymentMethod}
                            </Badge>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{new Date(data.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <Select defaultValue={data.status} onValueChange={handleStatusUpdate} disabled={isUpdating}>
                        <SelectTrigger className="w-[180px] h-14 rounded-2xl bg-white/10 border-white/20 text-white font-black text-[10px] uppercase tracking-widest outline-none focus:ring-0">
                            <SelectValue placeholder="STATUS" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-none bg-zinc-900 text-white p-2 rounded-2xl">
                            <SelectItem value="PENDING" className="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest">PENDING</SelectItem>
                            <SelectItem value="COMPLETED" className="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest">COMPLETED</SelectItem>
                            <SelectItem value="CANCELLED" className="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest">CANCELLED</SelectItem>
                            <SelectItem value="REFUNDED" className="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest">REFUNDED</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setShowReceipt(true)}
                        className="size-14 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                        <Printer className="size-5" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-zinc-950">
                {/* Left: Itemized Ledger */}
                <div className="flex-1 p-8 md:p-10 overflow-y-auto scrollbar-hide border-r border-border/30">
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-navy">ACQUISITION LEDGER</h4>
                            <Package className="size-4 text-brand-navy/30" />
                        </div>
                        
                        <div className="space-y-4">
                            {data.items.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-6 p-5 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 transition-all group">
                                    <div className="size-20 rounded-2xl bg-white dark:bg-zinc-800 relative overflow-hidden flex-shrink-0 shadow-sm border border-border/10 group-hover:scale-105 transition-transform duration-500">
                                        {item.variant.product.images?.[0] ? (
                                            <Image src={item.variant.product.images[0]} alt={item.variant.product.name} fill className="object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full opacity-10"><Zap className="size-6" /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1">
                                        <h5 className="font-black text-sm tracking-tight group-hover:text-brand-navy transition-colors line-clamp-1">{item.variant.product.name}</h5>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="text-[8px] font-black border-none bg-muted/50 px-2 tracking-tighter uppercase">QTY: {item.quantity}</Badge>
                                            <Badge variant="outline" className="text-[8px] font-black border-none bg-muted/50 px-2 tracking-tighter uppercase">SIZE: {item.variant.size}</Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-sm tracking-tighter">₦{(Number(item.price) * item.quantity).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Logistics & Patron Intel */}
                <div className="md:w-[320px] p-8 md:p-10 bg-zinc-50/50 dark:bg-zinc-900/30 overflow-y-auto scrollbar-hide space-y-10">
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-silver">PATRON INTEL</h4>
                        <div className="flex items-center gap-4 group">
                            <div className="size-12 rounded-2xl bg-brand-silver/10 flex items-center justify-center text-brand-silver shadow-inner group-hover:rotate-12 transition-transform">
                                <User className="size-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-sm tracking-tight">{data.customer?.name || "Walk-in Curator"}</span>
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate max-w-[120px]">{data.customer?.email || "No Email"}</span>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border/30" />

                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">DESTINATION LOGISTICS</h4>
                        <div className="flex gap-4">
                            <MapPin className="size-5 text-emerald-500/30 shrink-0 mt-1" />
                            <p className="text-xs font-bold leading-relaxed text-muted-foreground italic">
                                {data.customer?.address || "Physical Outlet Acquisition"}
                            </p>
                        </div>
                    </div>

                    <Separator className="bg-border/30" />

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Settled Revenue</span>
                            <span className="text-3xl font-black text-foreground tracking-tighter">₦{Number(data.totalAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] pt-4">
                            <ShieldCheck className="size-4" />
                            NextGen Logistics Standard
                        </div>
                    </div>
                </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Order Intel Not Found.</p>
          </div>
        )}
      </DialogContent>
      {showReceipt && (
        <OrderReceipt 
            orderId={orderId} 
            onClose={() => setShowReceipt(false)} 
        />
      )}
    </Dialog>
  );
}

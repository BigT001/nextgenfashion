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

const DUMMY_ORDER_DETAILS: Record<string, any> = {};
/*
  "dummy-1": {
    orderNumber: "NG-WEB-73A",
    paymentMethod: "CARD",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    totalAmount: 280000,
    customer: {
      name: "Adora Nwosu",
      email: "adora@nextgen.com",
      phone: "+234 812 345 6789",
      address: "No. 12 Joel Ogunnaike Street, Ikeja GRA, Lagos, Nigeria"
    },
    items: [
      {
        id: "item-1",
        quantity: 1,
        price: 180000,
        variant: {
          size: "M",
          sku: "NG-TX-001",
          product: {
            name: "NextGen Luxury Velvet Tuxedo",
            images: []
          }
        }
      },
      {
        id: "item-2",
        quantity: 2,
        price: 50000,
        variant: {
          size: "L",
          sku: "NG-PS-002",
          product: {
            name: "Classic Silk Pocket Square",
            images: []
          }
        }
      }
    ]
  },
  "dummy-2": {
    orderNumber: "NG-WEB-92B",
    paymentMethod: "TRANSFER",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: "PENDING",
    totalAmount: 145000,
    customer: {
      name: "Chinedu Okafor",
      email: "chinedu@luxury.io",
      phone: "+234 809 876 5432",
      address: "Penthouse B, Eko Atlantic Towers, Victoria Island, Lagos, Nigeria"
    },
    items: [
      {
        id: "item-3",
        quantity: 1,
        price: 145000,
        variant: {
          size: "XL",
          sku: "NG-SW-002",
          product: {
            name: "Signature Cashmere Wool Sweater",
            images: []
          }
        }
      }
    ]
  },
  "dummy-3": {
    orderNumber: "NG-WEB-45C",
    paymentMethod: "CARD",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    totalAmount: 420000,
    customer: {
      name: "Zara Bello",
      email: "zara.b@couture.com",
      phone: "+234 901 234 5678",
      address: "Maitama Heights, Block 4, Abuja, Nigeria"
    },
    items: [
      {
        id: "item-4",
        quantity: 1,
        price: 270000,
        variant: {
          size: "S",
          sku: "NG-GW-003",
          product: {
            name: "Premium Satin Evening Gown",
            images: []
          }
        }
      },
      {
        id: "item-5",
        quantity: 1,
        price: 150000,
        variant: {
          size: "S",
          sku: "NG-BT-004",
          product: {
            name: "Monogrammed Leather Belt",
            images: []
          }
        }
      }
    ]
  },
  "dummy-4": {
    orderNumber: "NG-WEB-11D",
    paymentMethod: "TRANSFER",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    status: "CANCELLED",
    totalAmount: 890000,
    customer: {
      name: "Tunde Folawiyo",
      email: "tunde@folawiyogroup.com",
      phone: "+234 803 111 2222",
      address: "Folawiyo Towers, 22 Glover Road, Ikoyi, Lagos, Nigeria"
    },
    items: [
      {
        id: "item-6",
        quantity: 2,
        price: 445000,
        variant: {
          size: "XXL",
          sku: "NG-LF-005",
          product: {
            name: "Handcrafted Italian Leather Loafers",
            images: []
          }
        }
      }
    ]
  },
  "dummy-5": {
    orderNumber: "ORD-POS-88X",
    paymentMethod: "CASH",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    totalAmount: 75000,
    customer: null,
    items: [
      {
        id: "item-7",
        quantity: 1,
        price: 75000,
        variant: {
          size: "L",
          sku: "NG-SH-006",
          product: {
            name: "Classic Linen Summer Shirt",
            images: []
          }
        }
      }
    ]
  },
  "dummy-6": {
    orderNumber: "ORD-POS-54Y",
    paymentMethod: "CARD",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    totalAmount: 120000,
    customer: null,
    items: [
      {
        id: "item-8",
        quantity: 2,
        price: 60000,
        variant: {
          size: "M",
          sku: "NG-CH-007",
          product: {
            name: "Slim Fit Stretch Chino",
            images: []
          }
        }
      }
    ]
  },
  "dummy-7": {
    orderNumber: "ORD-POS-21Z",
    paymentMethod: "POS",
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    totalAmount: 310000,
    customer: null,
    items: [
      {
        id: "item-9",
        quantity: 1,
        price: 250000,
        variant: {
          size: "L",
          sku: "NG-BZ-008",
          product: {
            name: "Tailored Premium Blazer",
            images: []
          }
        }
      },
      {
        id: "item-10",
        quantity: 1,
        price: 60000,
        variant: {
          size: "L",
          sku: "NG-SH-009",
          product: {
            name: "Oxford Button-Down Cotton Shirt",
            images: []
          }
        }
      }
    ]
  }
};

*/

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

  const customer = data?.customer ?? data?.Customer ?? null;
  const items = data?.items ?? data?.SaleItem ?? [];
  const staffUser = data?.user ?? data?.User ?? null;
  const createdAt = data?.createdAt ? new Date(data.createdAt).toLocaleString() : "";
  const paymentRef = data?.paymentRef ?? "N/A";
  const customerName = customer?.name ?? "Guest Customer";
  const customerEmail = customer?.email ?? "No email available";
  const customerPhone = customer?.phone ?? "No phone available";
  const customerAddress = customer?.address ?? "Pickup at physical outlet.";

  return (
    <Dialog open={!!orderId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-7xl p-0 overflow-hidden border-none glass-card shadow-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl rounded-[3rem]">
        {isLoading ? (
          <div className="h-[84vh] md:h-[820px] flex flex-col items-center justify-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Auditing Fulfillment Signature...</p>
          </div>
        ) : data ? (
          <div className="flex flex-col h-[88vh] md:h-[820px]">
            <div className="p-4 md:p-6 bg-brand-navy bg-brand-mesh border-b border-white/5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />
              <div className="relative z-10 flex items-start gap-4">
                <div className="size-12 rounded-[1.5rem] bg-white shadow-2xl flex items-center justify-center text-brand-navy">
                  <ShoppingBag className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.45em] text-white/60">Fulfillment audit</p>
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">{data.orderNumber}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-white/70">
                    <Badge className="bg-white/10 text-white border-none font-black px-2 rounded-full text-[8px]">{data.status}</Badge>
                    <span className="text-[9px]">{createdAt}</span>
                  </div>
                </div>
                </div>

              <div className="relative z-10 flex items-center gap-3">
                <Select value={data.status} onValueChange={handleStatusUpdate} disabled={isUpdating}>
                  <SelectTrigger className="w-[160px] h-10 rounded-2xl bg-white/10 border-white/20 text-white font-black text-[9px] uppercase tracking-widest outline-none focus:ring-0">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="border border-border bg-popover text-popover-foreground p-2 rounded-2xl shadow-xl min-w-[190px]">
                    <SelectItem value="PENDING" className="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest">PENDING</SelectItem>
                    <SelectItem value="PROCESSING" className="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest">PROCESSING</SelectItem>
                    <SelectItem value="PAID" className="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest">PAID</SelectItem>
                    <SelectItem value="SHIPPED" className="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest">SHIPPED</SelectItem>
                    <SelectItem value="COMPLETED" className="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest">COMPLETED</SelectItem>
                    <SelectItem value="CANCELLED" className="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest">CANCELLED</SelectItem>
                    <SelectItem value="REFUNDED" className="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest">REFUNDED</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => setShowReceipt(true)} className="size-14 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all">
                  <Printer className="size-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 overflow-hidden bg-white dark:bg-zinc-950 md:flex-row">
              <div className="flex-1 overflow-y-auto scrollbar-hide p-10 md:p-12 border-b border-border/10 md:border-b-0 md:border-r md:border-border/10">
                <div className="grid gap-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/60 p-6 shadow-sm border border-border/50">
                      <div className="flex items-center gap-3 mb-4">
                        <CreditCard className="size-5 text-brand-navy" />
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">Order details</h3>
                      </div>
                      <div className="space-y-3 text-sm text-foreground">
                        <div className="flex justify-between gap-4">
                          <span className="font-black text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Order ID</span>
                          <span className="text-right">{data.orderNumber}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="font-black text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Created</span>
                          <span className="text-right">{new Date(data.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="font-black text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Items</span>
                          <span className="text-right">{items.length}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/60 p-6 shadow-sm border border-border/50">
                      <div className="flex items-center gap-3 mb-4">
                        <User className="size-5 text-brand-navy" />
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">Customer info</h3>
                      </div>
                      <div className="space-y-3 text-sm text-foreground">
                        <div>
                          <p className="font-black text-sm">{customerName}</p>
                          <p className="text-xs text-muted-foreground">{customerEmail}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p>{customerPhone}</p>
                          <p className="break-words">{customer?.address ? customerAddress : "No address available"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/60 p-6 shadow-sm border border-border/50">
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="size-5 text-emerald-500" />
                      <h3 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">Shipping / delivery</h3>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {customerAddress}
                    </p>
                  </div>

                  <div className="rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/60 p-6 shadow-sm border border-border/50">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">Acquisition ledger</p>
                        <p className="text-base font-black text-foreground">Product breakdown</p>
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Line totals shown</span>
                    </div>
                    <div className="space-y-4">
                      {items.map((item: any, index: number) => {
                        const variant = item.variant ?? item.ProductVariant ?? {};
                        const product = variant.product ?? variant.Product ?? {};
                        const key = item.id || item.variantId || index;

                        return (
                          <div key={key} className="grid gap-4 md:grid-cols-[auto_1fr_auto] items-center rounded-[1.5rem] bg-white dark:bg-zinc-950 p-4 border border-border/40">
                            <div className="relative h-28 w-28 rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                              {product.images?.[0] ? (
                                <Image src={product.images[0]} alt={product.name || "Product image"} fill className="object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground"><Zap className="size-6" /></div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <p className="font-black text-sm text-foreground">{product.name || variant.sku || "Unnamed product"}</p>
                              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{product.description ?? "No product description available."}</p>
                              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                {variant.sku ? <span className="rounded-full bg-muted/20 px-2 py-1">SKU: {variant.sku}</span> : null}
                                {variant.size ? <span className="rounded-full bg-muted/20 px-2 py-1">Size: {variant.size}</span> : null}
                                {variant.color ? <span className="rounded-full bg-muted/20 px-2 py-1">Color: {variant.color}</span> : null}
                              </div>
                            </div>
                            <div className="space-y-2 text-right">
                              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Qty {item.quantity}</p>
                              <p className="font-black text-sm">₦{Number(item.price).toLocaleString()}</p>
                              <p className="text-[11px] text-muted-foreground">Line total: ₦{(Number(item.price) * item.quantity).toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <aside className="md:w-[420px] p-8 md:p-10 overflow-y-auto scrollbar-hide bg-zinc-50/60 dark:bg-zinc-900/40 rounded-tr-[3rem] rounded-br-[3rem]">
                <div className="space-y-6">
                  <div className="rounded-[2rem] bg-white dark:bg-zinc-950 p-6 border border-border/40 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="size-5 text-emerald-500" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Revenue</p>
                        <p className="text-3xl font-black tracking-tight">₦{Number(data.totalAmount).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 text-sm text-foreground">
                      <div className="flex justify-between text-muted-foreground"><span>Order subtotal</span><span>₦{Number(data.totalAmount).toLocaleString()}</span></div>
                      <div className="flex justify-between text-muted-foreground"><span>Order count</span><span>{items.length}</span></div>
                      <div className="flex justify-between text-muted-foreground"><span>Customer</span><span>{customerName}</span></div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] bg-white dark:bg-zinc-950 p-6 border border-border/40 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Package className="size-5 text-brand-navy" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Order audit</p>
                        <p className="text-sm font-black text-foreground">Operations overview</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-foreground">
                      <div className="flex justify-between"><span className="text-muted-foreground">Source</span><span>{staffUser?.name ? `Staff - ${staffUser.name}` : "Storefront"}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Payment ref</span><span>{paymentRef}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{data.status}</span></div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] bg-white dark:bg-zinc-950 p-6 border border-border/40 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <ShieldCheck className="size-5 text-brand-silver" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Shipping priority</p>
                        <p className="text-sm font-black text-foreground">Standard nextgen logistics</p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">Deliver with extra care and confirm the customer address before packing. Use the SKU and size details above for inventory match.</p>
                  </div>
                </div>
              </aside>
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

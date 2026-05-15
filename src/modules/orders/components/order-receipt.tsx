"use client";

import { useEffect, useRef, useState } from "react";
import { Printer, Download, X, Zap, ShieldCheck, CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrderDetailAction } from "../actions/order.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface OrderReceiptProps {
  orderId: string | null;
  onClose: () => void;
}

export function OrderReceipt({ orderId, onClose }: OrderReceiptProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId) return;
    setIsLoading(true);
    getOrderDetailAction(orderId).then((result) => {
      if (result.success) setData(result.data);
      setIsLoading(false);
    });
  }, [orderId]);

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice — ${data?.orderNumber}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Arial', sans-serif; background: white; color: #09090b; }
            .receipt { max-width: 800px; margin: 0 auto; padding: 48px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 32px; border-bottom: 2px solid #f4f4f5; }
            .brand { display: flex; flex-direction: column; gap: 4px; }
            .brand-name { font-size: 28px; font-weight: 900; letter-spacing: -0.05em; }
            .brand-tag { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; color: #e11d48; }
            .invoice-id { text-align: right; }
            .invoice-label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; color: #a1a1aa; }
            .invoice-number { font-size: 20px; font-weight: 900; letter-spacing: -0.03em; }
            .invoice-date { font-size: 11px; color: #71717a; font-weight: 700; margin-top: 4px; }
            .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 48px; }
            .party-label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; color: #e11d48; margin-bottom: 12px; }
            .party-name { font-size: 16px; font-weight: 900; }
            .party-detail { font-size: 12px; color: #71717a; font-weight: 600; margin-top: 4px; }
            .items { margin-bottom: 32px; }
            .items-header { display: grid; grid-template-columns: 1fr auto auto; gap: 16px; padding: 12px 16px; background: #f4f4f5; border-radius: 8px; margin-bottom: 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #71717a; }
            .item-row { display: grid; grid-template-columns: 1fr auto auto; gap: 16px; padding: 16px; border-bottom: 1px solid #f4f4f5; }
            .item-name { font-size: 13px; font-weight: 900; }
            .item-variant { font-size: 10px; color: #71717a; font-weight: 700; margin-top: 2px; }
            .item-qty { font-size: 13px; font-weight: 900; text-align: center; min-width: 40px; }
            .item-price { font-size: 13px; font-weight: 900; text-align: right; }
            .totals { margin-left: auto; width: 300px; space-y: 8px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; font-weight: 700; }
            .total-row.grand { padding: 16px 0; border-top: 2px solid #09090b; margin-top: 8px; font-size: 18px; font-weight: 900; }
            .footer { text-align: center; margin-top: 48px; padding-top: 32px; border-top: 1px solid #f4f4f5; }
            .footer-text { font-size: 11px; color: #a1a1aa; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; }
            .status-badge { display: inline-block; padding: 4px 12px; background: #dcfce7; color: #16a34a; border-radius: 100px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="brand">
                <div class="brand-name">NEXTGEN OS</div>
                <div class="brand-tag">Fashion Architecture</div>
              </div>
              <div class="invoice-id">
                <div class="invoice-label">Invoice</div>
                <div class="invoice-number">${data?.orderNumber}</div>
                <div class="invoice-date">${new Date(data?.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" })}</div>
                <div class="status-badge">${data?.status}</div>
              </div>
            </div>

            <div class="parties">
              <div>
                <div class="party-label">Billed To</div>
                <div class="party-name">${data?.customer?.name || "Walk-in Customer"}</div>
                <div class="party-detail">${data?.customer?.email || ""}</div>
                <div class="party-detail">${data?.customer?.phone || ""}</div>
                <div class="party-detail">${data?.customer?.address || ""}</div>
              </div>
              <div>
                <div class="party-label">Payment</div>
                <div class="party-name">${data?.paymentMethod}</div>
                <div class="party-detail">Ref: ${data?.paymentRef || "N/A"}</div>
              </div>
            </div>

            <div class="items">
              <div class="items-header">
                <span>Item</span>
                <span style="text-align:center">Qty</span>
                <span style="text-align:right">Amount</span>
              </div>
              ${data?.items?.map((item: any) => `
                <div class="item-row">
                  <div>
                    <div class="item-name">${item.variant?.product?.name}</div>
                    <div class="item-variant">Size: ${item.variant?.size || "N/A"} · SKU: ${item.variant?.sku}</div>
                  </div>
                  <div class="item-qty">${item.quantity}</div>
                  <div class="item-price">₦${(Number(item.price) * item.quantity).toLocaleString()}</div>
                </div>
              `).join("")}
            </div>

            <div class="totals">
              <div class="total-row"><span>Subtotal</span><span>₦${(Number(data?.totalAmount) / 1.075).toLocaleString("en-NG", { maximumFractionDigits: 0 })}</span></div>
              <div class="total-row"><span>VAT (7.5%)</span><span>₦${(Number(data?.totalAmount) - Number(data?.totalAmount) / 1.075).toLocaleString("en-NG", { maximumFractionDigits: 0 })}</span></div>
              <div class="total-row"><span>Shipping</span><span>FREE</span></div>
              <div class="total-row grand"><span>TOTAL</span><span>₦${Number(data?.totalAmount).toLocaleString()}</span></div>
            </div>

            <div class="footer">
              <div class="footer-text">Thank you for your acquisition. NextGen Fashion Architecture · 2024</div>
              <div class="footer-text" style="margin-top:8px">For support: support@nextgenfashion.com</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-950 rounded-[3rem] shadow-[0_100px_200px_-50px_rgba(0,0,0,0.4)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Controls */}
        <div className="flex items-center justify-between p-8 border-b border-border/30">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-brand-navy/10 rounded-2xl flex items-center justify-center text-brand-navy">
              <Package className="size-6" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight">Invoice</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ACQUISITION RECEIPT</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handlePrint} className="h-12 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-navy/20 px-6">
              <Printer className="mr-2 size-4" />
              PRINT
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="size-12 rounded-2xl hover:bg-brand-navy/5 hover:text-brand-navy">
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : data ? (
          <div ref={receiptRef} className="flex-1 overflow-y-auto scrollbar-hide p-8 md:p-12 space-y-10">
            {/* Brand + Invoice ID */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 bg-brand-navy rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-navy/30">
                  <Zap className="size-6 fill-white" />
                </div>
                <div>
                  <p className="font-black text-xl tracking-tighter">NEXTGEN OS</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-navy">Fashion Architecture</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Invoice</p>
                <p className="text-2xl font-black tracking-tighter">{data.orderNumber}</p>
                <p className="text-xs font-bold text-muted-foreground">
                  {new Date(data.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                <span className={cn(
                  "inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                  data.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600" :
                  data.status === "PENDING" ? "bg-amber-500/10 text-amber-600" :
                  "bg-rose-500/10 text-rose-600"
                )}>
                  {data.status}
                </span>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-8 p-8 glass-card rounded-3xl border-none">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-navy">Billed To</p>
                <div>
                  <p className="font-black text-base">{data.customer?.name || "Walk-in Customer"}</p>
                  <p className="text-xs text-muted-foreground font-medium">{data.customer?.email}</p>
                  <p className="text-xs text-muted-foreground font-medium">{data.customer?.phone}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">{data.customer?.address}</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-silver">Payment</p>
                <div>
                  <p className="font-black text-base">{data.paymentMethod}</p>
                  <p className="text-xs text-muted-foreground font-medium">Ref: {data.paymentRef || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl">
                <span className="col-span-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Item</span>
                <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Qty</span>
                <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Unit Price</span>
                <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Total</span>
              </div>

              {data.items.map((item: any) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 px-4 py-5 border-b border-border/30 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors rounded-2xl">
                  <div className="col-span-6">
                    <p className="font-black text-sm tracking-tight">{item.variant?.product?.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">
                      {item.variant?.size && `Size: ${item.variant.size}`}
                      {item.variant?.color && ` · ${item.variant.color}`}
                      {` · SKU: ${item.variant?.sku}`}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="font-black text-sm">{item.quantity}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="font-bold text-sm text-muted-foreground">₦{Number(item.price).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="font-black text-sm">₦{(Number(item.price) * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-3">
                <div className="flex justify-between text-sm font-bold text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₦{(Number(data.totalAmount) / 1.075).toLocaleString("en-NG", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-muted-foreground">
                  <span>VAT (7.5%)</span>
                  <span>₦{(Number(data.totalAmount) - Number(data.totalAmount) / 1.075).toLocaleString("en-NG", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-600">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t-2 border-zinc-950 dark:border-white">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Grand Total</span>
                  <span className="text-3xl font-black tracking-tighter text-brand-navy">₦{Number(data.totalAmount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 pt-4 border-t border-border/30">
              <ShieldCheck className="size-4" />
              NextGen Fashion Architecture · Integrity Guaranteed
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Invoice not found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Mail, Send, Megaphone, PenSquare } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { getInboxMessagesAction, getSentMessagesAction, getCampaignsAction } from "@/modules/email/actions/email.actions";

export default function MailroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [inboxCount, setInboxCount] = useState<number | null>(null);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [campaignsCount, setCampaignsCount] = useState<number | null>(null);

  const fetchCounts = useCallback(async () => {
    try {
      const inboxRes = await getInboxMessagesAction();
      if (inboxRes.success && inboxRes.data) {
        setInboxCount(inboxRes.data.length);
      }
      const sentRes = await getSentMessagesAction();
      if (sentRes.success && sentRes.data) {
        setSentCount(sentRes.data.length);
      }
      const campaignsRes = await getCampaignsAction();
      if (campaignsRes.success && campaignsRes.data) {
        setCampaignsCount(campaignsRes.data.length);
      }
    } catch (error) {
      console.error("Failed to load mailroom metrics:", error);
    }
  }, []);

  useEffect(() => {
    fetchCounts();

    window.addEventListener("notifications_updated", fetchCounts);
    window.addEventListener("mailroom_updated", fetchCounts);

    return () => {
      window.removeEventListener("notifications_updated", fetchCounts);
      window.removeEventListener("mailroom_updated", fetchCounts);
    };
  }, [fetchCounts]);

  const tabs = [
    { name: "Inbox", href: "/dashboard/mailroom", icon: Mail },
    { name: "Sent", href: "/dashboard/mailroom/sent", icon: Send },
    { name: "Campaigns", href: "/dashboard/mailroom/campaigns", icon: Megaphone },
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-navy tracking-tight animate-fade-in">Mailroom</h1>
          <p className="text-sm text-zinc-500 font-medium">Manage customer communications and marketing broadcasts.</p>
        </div>
        <Link 
          href="/dashboard/mailroom/compose"
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl shadow"
        >
          <PenSquare className="mr-2 size-4" />
          Compose
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-brand-navy/5 shadow-sm flex items-center justify-between group hover:border-brand-navy/15 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Inbox Volume</p>
            <p className="text-3xl font-black text-brand-navy dark:text-white tracking-tight">
              {inboxCount !== null ? inboxCount.toLocaleString() : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground font-semibold">Incoming customer inquiries</p>
          </div>
          <div className="size-12 bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Mail className="size-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-brand-navy/5 shadow-sm flex items-center justify-between group hover:border-brand-navy/15 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Sent Broadcasts</p>
            <p className="text-3xl font-black text-brand-navy dark:text-white tracking-tight">
              {sentCount !== null ? sentCount.toLocaleString() : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground font-semibold">Outbound responses & receipts</p>
          </div>
          <div className="size-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Send className="size-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-brand-navy/5 shadow-sm flex items-center justify-between group hover:border-brand-navy/15 transition-all sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Campaigns Launched</p>
            <p className="text-3xl font-black text-brand-navy dark:text-white tracking-tight">
              {campaignsCount !== null ? campaignsCount.toLocaleString() : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground font-semibold">Newsletter & marketing campaigns</p>
          </div>
          <div className="size-12 bg-violet-500/10 text-violet-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Megaphone className="size-6" />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 bg-white p-1 rounded-xl shadow-sm border border-border w-fit">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                isActive
                  ? "bg-brand-navy text-white shadow-md"
                  : "text-zinc-500 hover:text-brand-navy hover:bg-zinc-100"
              )}
            >
              <tab.icon className={cn("mr-2 size-4", isActive ? "text-white" : "text-zinc-400")} />
              {tab.name}
            </Link>
          );
        })}
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        {children}
      </div>
    </div>
  );
}

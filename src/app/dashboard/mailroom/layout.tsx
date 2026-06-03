"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Mail, Send, Megaphone, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MailroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: "Inbox", href: "/dashboard/mailroom", icon: Mail },
    { name: "Sent", href: "/dashboard/mailroom/sent", icon: Send },
    { name: "Campaigns", href: "/dashboard/mailroom/campaigns", icon: Megaphone },
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-navy tracking-tight">Mailroom</h1>
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

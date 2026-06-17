"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Navbar } from "@/components/dashboard/navbar";
import { usePathname } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showNavbar = pathname === "/dashboard";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col flex-1 overflow-hidden">
        {showNavbar ? (
          <Navbar />
        ) : (
          <div className="h-14 shrink-0 flex items-center px-6 border-b border-brand-navy/5 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-2xl lg:hidden">
            <SidebarTrigger className="-ml-1 size-10 rounded-xl hover:bg-brand-navy/5 hover:text-brand-navy transition-colors" />
            <div className="size-1 bg-muted-foreground/20 rounded-full mx-3" />
            <span className="text-xs font-black tracking-widest text-foreground uppercase">
              {pathname.split("/").filter(Boolean).pop() || "Suite"}
            </span>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-slow-fade bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

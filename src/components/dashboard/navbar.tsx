"use client";

import { Bell, Search, User, Menu, Zap, Sparkles, Command, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Simple Breadcrumb Orchestration
  const paths = pathname.split("/").filter(Boolean);
  const currentPath = paths[paths.length - 1] || "Dashboard";

  return (
    <header className="h-20 w-full flex items-center gap-6 px-6 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-2xl border-b border-border/30 sticky top-0 z-40">
      <div className="flex flex-1 items-center gap-8">
        <SidebarTrigger className="-ml-1 size-10 rounded-xl hover:bg-brand-navy/5 hover:text-brand-navy transition-colors" />
        
        {/* Executive Breadcrumbs */}
        <div className="hidden md:flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">CORE</span>
            <div className="size-1 bg-muted-foreground/20 rounded-full" />
            <span className="text-sm font-black tracking-tight text-foreground uppercase tracking-widest">{currentPath}</span>
        </div>

        {/* Global Discovery Trigger (CMD+K) */}
        <div className="hidden lg:flex flex-1 max-w-md">
            <button 
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                className="w-full h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 px-5 flex items-center justify-between group hover:bg-zinc-100 transition-all border border-transparent hover:border-brand-navy/20"
            >
                <div className="flex items-center gap-4">
                    <Search className="size-4 text-muted-foreground group-hover:text-brand-navy transition-colors" />
                    <span className="text-xs font-bold text-muted-foreground/60">Search products, orders, curators...</span>
                </div>
                <kbd className="h-6 px-2 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 font-black text-[10px] flex items-center gap-1 text-muted-foreground/40">
                    <Command className="size-3" /> K
                </kbd>
            </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="size-11 rounded-xl relative hover:bg-brand-navy/5 hover:text-brand-navy transition-all">
          <Bell className="h-5 w-5" />
          <span className="absolute top-3 right-3 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-navy/50 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-navy"></span>
          </span>
        </Button>

        <div className="h-8 w-px bg-border/30 mx-2 hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-11 px-4 items-center gap-3 rounded-xl border border-border/30 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all group">
            <div className="size-7 bg-brand-navy/10 rounded-lg flex items-center justify-center text-brand-navy group-hover:rotate-12 transition-transform shadow-inner">
                <User className="h-4 w-4" />
            </div>
            <span className="text-xs font-black tracking-tight hidden sm:block">{session?.user?.name || "Executive"}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 glass-card border-none shadow-2xl p-2 rounded-2xl">
            <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">Executive Terminal</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/30" />
                <DropdownMenuItem className="rounded-xl h-11 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy">
                    <User className="size-4" /> My Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl h-11 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy">
                    <Settings className="size-4" /> System Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/30" />
                <DropdownMenuItem 
                    onClick={() => signOut({ callbackUrl: "/auth/login" })}
                    className="rounded-xl h-11 font-bold gap-3 text-destructive focus:bg-destructive/5"
                >
                    Log out
                </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

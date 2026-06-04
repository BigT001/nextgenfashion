"use client";

import { Bell, Search, User, Menu, Command, Settings, Mail, ShoppingBag, AlertTriangle, X, Package, ExternalLink, ChevronRight } from "lucide-react";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn, getSignOutRedirectUrl } from "@/lib/utils";
import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import { getNotificationsAction } from "@/modules/dashboard/actions/notifications.actions";
import { universalSearchAction } from "@/modules/search/actions/search.actions";
import Link from "next/link";

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  // Breadcrumb
  const paths = pathname.split("/").filter(Boolean);
  const currentPath = paths[paths.length - 1] || "Dashboard";

  // ─── Bell / Notifications ──────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [lastFetched, setLastFetched] = useState<number>(0);

  const fetchNotifications = useCallback(async () => {
    if (notifLoading) return;
    setNotifLoading(true);
    const res = await getNotificationsAction();
    if (res.success && res.data) {
      setNotifications(res.data.notifications);
      setNotifCount(res.data.total);
    }
    setLastFetched(Date.now());
    setNotifLoading(false);
  }, [notifLoading]);

  // Fetch on mount and every 60 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleBellOpen = (open: boolean) => {
    setNotifOpen(open);
    // Re-fetch if stale (> 30s since last fetch)
    if (open && Date.now() - lastFetched > 30_000) {
      fetchNotifications();
    }
  };

  // ─── Global Search ─────────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchPending, startSearchTransition] = useTransition();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback((q: string) => {
    if (q.length < 2) { setSearchResults(null); return; }
    startSearchTransition(async () => {
      const res = await universalSearchAction(q);
      if (res.success) setSearchResults(res.data);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  // Close search on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Open search on CMD+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const totalSearchResults =
    (searchResults?.products?.length || 0) +
    (searchResults?.orders?.length || 0) +
    (searchResults?.categories?.length || 0);

  return (
    <header className="h-20 w-full flex items-center gap-6 px-6 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-2xl border-b-2 border-brand-navy/5 shadow-sm sticky top-0 z-40">
      <div className="flex flex-1 items-center gap-8">
        <SidebarTrigger className="-ml-1 size-10 rounded-xl hover:bg-brand-navy/5 hover:text-brand-navy transition-colors" />

        {/* Breadcrumbs */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">CORE</span>
          <div className="size-1 bg-muted-foreground/20 rounded-full" />
          <span className="text-sm font-black tracking-tight text-foreground uppercase tracking-widest">{currentPath}</span>
        </div>

        {/* Global Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-md relative" ref={searchRef}>
          <button
            id="global-search-trigger"
            onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            className={cn(
              "w-full h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 px-5 flex items-center justify-between group hover:bg-zinc-100 transition-all border",
              searchOpen ? "border-brand-navy/20 bg-white shadow-md" : "border-transparent hover:border-brand-navy/10"
            )}
          >
            <div className="flex items-center gap-4">
              <Search className="size-4 text-muted-foreground group-hover:text-brand-navy transition-colors" />
              <span className="text-xs font-bold text-muted-foreground/60">Search products, orders, curators...</span>
            </div>
            <kbd className="h-6 px-2 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 font-black text-[10px] flex items-center gap-1 text-muted-foreground/40">
              <Command className="size-3" /> K
            </kbd>
          </button>

          {/* Search Dropdown Panel */}
          {searchOpen && (
            <div className="absolute top-14 left-0 right-0 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-border/30 overflow-hidden z-50">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/20">
                <Search className="size-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search products, orders..."
                  className="flex-1 text-sm font-medium bg-transparent outline-none placeholder:text-muted-foreground/50"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setSearchResults(null); }} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="size-4" />
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {searchPending && (
                  <div className="px-4 py-6 text-center text-xs font-bold text-muted-foreground animate-pulse">Searching...</div>
                )}
                {!searchPending && searchQuery.length >= 2 && totalSearchResults === 0 && (
                  <div className="px-4 py-6 text-center text-xs font-bold text-muted-foreground">No results found for "{searchQuery}"</div>
                )}
                {!searchPending && searchResults && (
                  <div className="p-2 space-y-1">
                    {searchResults.products?.length > 0 && (
                      <>
                        <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Products</p>
                        {searchResults.products.map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => { router.push(`/dashboard/products`); setSearchOpen(false); setSearchQuery(""); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-navy/5 text-left transition-colors"
                          >
                            <div className="size-8 bg-orange-500/10 rounded-lg flex items-center justify-center shrink-0">
                              <Package className="size-4 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black truncate">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{p.Category?.name || "Product"}</p>
                            </div>
                            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                          </button>
                        ))}
                      </>
                    )}
                    {searchResults.orders?.length > 0 && (
                      <>
                        <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Orders</p>
                        {searchResults.orders.map((o: any) => (
                          <button
                            key={o.id}
                            onClick={() => { router.push(`/dashboard/orders`); setSearchOpen(false); setSearchQuery(""); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-navy/5 text-left transition-colors"
                          >
                            <div className="size-8 bg-brand-navy/5 rounded-lg flex items-center justify-center shrink-0">
                              <ShoppingBag className="size-4 text-brand-navy" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black truncate">#{o.orderNumber}</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{o.Customer?.name || "Guest"} · ₦{Number(o.totalAmount).toLocaleString()}</p>
                            </div>
                            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
                {!searchQuery && (
                  <div className="px-4 py-6 text-center text-xs font-bold text-muted-foreground/50">Start typing to search across your store</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Bell / Notifications */}
        <DropdownMenu open={notifOpen} onOpenChange={handleBellOpen}>
          <DropdownMenuTrigger render={
            <Button
              id="notification-bell"
              variant="ghost"
              size="icon"
              className="size-11 rounded-xl relative hover:bg-brand-navy/5 hover:text-brand-navy transition-all"
            />
          }>
            <Bell className="h-5 w-5" />
            {notifCount > 0 && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500/50 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-white text-[9px] font-black items-center justify-center">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              </span>
            )}
            {notifCount === 0 && (
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-navy/50 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-navy" />
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 glass-card border border-border/20 shadow-2xl p-0 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/20 bg-brand-navy/3">
              <div>
                <p className="text-sm font-black tracking-tight">Notifications</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Last 7 days activity</p>
              </div>
              {notifCount > 0 && (
                <span className="bg-rose-500/10 text-rose-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
                  {notifCount} new
                </span>
              )}
            </div>
            {/* List */}
            <div className="max-h-[420px] overflow-y-auto">
              {notifLoading ? (
                <div className="py-8 text-center text-xs font-bold text-muted-foreground animate-pulse">Loading activity...</div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-3">
                  <Bell className="size-8 text-muted-foreground/20" />
                  <p className="text-xs font-bold text-muted-foreground">No recent notifications</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => setNotifOpen(false)}
                      className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-brand-navy/5 transition-colors group"
                    >
                      <div className={cn(
                        "size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        n.type === "email" ? "bg-indigo-500/10 text-indigo-600" : "bg-emerald-500/10 text-emerald-600"
                      )}>
                        {n.type === "email" ? <Mail className="size-4" /> : <ShoppingBag className="size-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black truncate">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">{n.subtitle}</p>
                        <p className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      <ExternalLink className="size-3.5 text-muted-foreground/30 group-hover:text-brand-navy shrink-0 mt-1 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="border-t border-border/20 px-4 py-3 bg-muted/20">
              <Link href="/dashboard/mailroom" onClick={() => setNotifOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-brand-navy hover:opacity-70 transition-opacity">
                View all in mailroom →
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-8 w-px bg-border/30 mx-2 hidden sm:block" />

        {/* User Menu */}
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
                onClick={() => signOut({ callbackUrl: getSignOutRedirectUrl("/auth/login") })}
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

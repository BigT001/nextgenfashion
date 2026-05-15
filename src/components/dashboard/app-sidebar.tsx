"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  ShoppingBag,
  PackagePlus,
  Zap,
  ChevronRight,
  LogOut,
  Sparkles,
  ShieldCheck,
  User
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import Image from "next/image";

const data = {
  navMain: [
    {
      title: "Core",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
          roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
        },
        {
          title: "Point of Sale",
          url: "/dashboard/pos",
          icon: ShoppingCart,
          roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          title: "Products",
          url: "/dashboard/products",
          icon: PackagePlus,
          roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
        },
        {
          title: "Inventory",
          url: "/dashboard/inventory",
          icon: Package,
          roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
        },
        {
          title: "Orders",
          url: "/dashboard/orders",
          icon: ShoppingBag,
          roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
        },
      ],
    },
    {
      title: "Business",
      items: [
        {
          title: "Customers",
          url: "/dashboard/customers",
          icon: Users,
          roles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
          icon: BarChart3,
          roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as UserRole || UserRole.STAFF;

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/staff" });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/10 bg-zinc-950/[0.01]" {...props}>
      {/* High-Fidelity Header - Compact */}
      <SidebarHeader className="h-20 flex items-center justify-center">
        <div className="flex items-center gap-3 px-4 w-full group">
          <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-white shadow-lg shadow-brand-navy/5 group-hover:scale-105 transition-transform duration-500 ring-1 ring-border/50 p-1.5 shrink-0">
            <Image 
                src="/images/logonextgen.png" 
                alt="NextGen Logo" 
                width={32} 
                height={32} 
                className="object-contain"
            />
          </div>
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden text-left">
            <span className="font-black text-base tracking-tighter text-brand-navy">Business</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 font-black">Suite</span>
          </div>
        </div>
      </SidebarHeader>
      
      {/* Navigation Content - Optimized Spacing */}
      <SidebarContent className="px-3 pt-2">
        {data.navMain.map((group) => {
          const visibleItems = group.items.filter(item => item.roles.includes(userRole));
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.title} className="py-2">
              <SidebarGroupLabel className="px-5 text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 group-data-[collapsible=icon]:hidden mb-2">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {visibleItems.map((item) => {
                    // Strict matching for Dashboard, startsWith for others
                    const isActive = item.url === "/dashboard" 
                      ? pathname === "/dashboard"
                      : pathname === item.url || pathname.startsWith(item.url + "/");

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.title}
                          render={<Link href={item.url} />}
                          className={cn(
                            "h-11 px-5 rounded-xl transition-all duration-300 group/item relative overflow-hidden flex items-center gap-3 w-full",
                            isActive 
                              ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/10" 
                              : "text-muted-foreground/50 hover:bg-brand-navy/[0.03] hover:text-brand-navy"
                          )}
                        >
                            <item.icon className={cn(
                              "size-4.5 transition-colors",
                              isActive ? "text-white" : "group-hover/item:text-brand-navy"
                            )} />
                            <span className="text-sm font-bold tracking-tight">{item.title}</span>
                            {isActive && (
                                <div className="absolute right-0 top-2 bottom-2 w-1 bg-white/20 rounded-l-full" />
                            )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* High-Fidelity Footer */}
      <SidebarFooter className="p-6 mt-auto border-t border-border/30 bg-white/30 dark:bg-zinc-950/30 backdrop-blur-xl">
        <div className="space-y-6">
          {session?.user && (
            <div className="flex items-center gap-4 px-2 group-data-[collapsible=icon]:hidden animate-slow-fade">
              <div className="size-11 rounded-[1.25rem] bg-brand-navy/10 flex items-center justify-center font-black text-brand-navy border border-brand-navy/20 shadow-inner group-hover:rotate-12 transition-transform">
                <User className="size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black truncate">{session.user.name || "Executive"}</span>
                <span className="text-[9px] text-muted-foreground truncate uppercase tracking-[0.2em] font-black opacity-60">
                  {userRole} NODE
                </span>
              </div>
            </div>
          )}
          
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-12 px-5 rounded-[1.25rem] text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-all duration-500 group/logout"
                onClick={handleSignOut}
              >
                <LogOut className="size-5 group-hover/logout:-translate-x-1 transition-transform" />
                <span className="text-sm font-black tracking-tight">Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          
          <div className="flex items-center justify-center gap-2 group-data-[collapsible=icon]:hidden opacity-20">
              <ShieldCheck className="size-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">v1.2.0-STABLE</span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

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
  ChevronDown,
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
import { UserRole } from "@/modules/auth/constants";
import Image from "next/image";
import { useSidebar } from "@/components/ui/sidebar";

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
          title: "Staff",
          url: "/dashboard/staff",
          icon: User,
          roles: [UserRole.SUPERADMIN, UserRole.ADMIN],
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
  const { isMobile, openMobile, setOpen, setOpenMobile } = useSidebar();
  const userRole = (session?.user as any)?.role as UserRole || UserRole.STAFF;

  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    Core: true,
    Management: true,
    Business: true,
  });

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleMenuItemClick = () => {
    // Only close the sidebar when on mobile
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-brand-navy" {...props}>
      {/* High-Fidelity Header - Compact */}
      <SidebarHeader className="h-20 flex items-center justify-center border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 px-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center w-full group cursor-pointer">
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
            <span className="font-black text-base tracking-tighter text-white">Business</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-black">Suite</span>
          </div>
        </Link>
      </SidebarHeader>
      
      {/* Navigation Content - Optimized Spacing */}
      <SidebarContent className="px-3 group-data-[collapsible=icon]:px-2 pt-2">
        {data.navMain.map((group) => {
          const rawPermissions = (session?.user as any)?.permissions;
          const userPermissions = Array.isArray(rawPermissions) && rawPermissions.length > 0
            ? rawPermissions
            : userRole === UserRole.STAFF
              ? ["POS", "PRODUCTS", "INVENTORY", "ORDERS", "CUSTOMERS", "STAFF", "ANALYTICS"]
              : [];

          const visibleItems = group.items.filter(item => {
            if (!item.roles.includes(userRole)) return false;
            if (userRole === "SUPERADMIN" || userRole === "ADMIN") return true;
            
            // Map item url to permission key
            let permKey: string | null = null;
            if (item.url.includes("/pos")) permKey = "POS";
            else if (item.url.includes("/products")) permKey = "PRODUCTS";
            else if (item.url.includes("/inventory")) permKey = "INVENTORY";
            else if (item.url.includes("/orders")) permKey = "ORDERS";
            else if (item.url.includes("/customers")) permKey = "CUSTOMERS";
            else if (item.url.includes("/staff")) permKey = "STAFF";
            else if (item.url.includes("/analytics")) permKey = "ANALYTICS";
            
            if (!permKey) return true; // general paths (like dashboard) have no restrictions
            return userPermissions.includes(permKey);
          });
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.title} className="py-0 mt-4">
              <SidebarGroupLabel 
                className="px-5 text-[9px] font-black uppercase tracking-[0.4em] text-white/50 hover:text-white cursor-pointer group-data-[collapsible=icon]:hidden mb-1 flex items-center justify-between transition-colors"
                onClick={() => toggleGroup(group.title)}
              >
                {group.title}
                {expandedGroups[group.title] ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              </SidebarGroupLabel>
              {expandedGroups[group.title] && (
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0">
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
                          onClick={handleMenuItemClick}
                          className={cn(
                            "h-10 px-5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:mx-auto rounded-xl transition-all duration-300 group/item relative overflow-hidden flex items-center gap-3 w-full",
                            isActive 
                              ? "bg-white text-brand-navy font-black shadow-md group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:text-white" 
                              : "text-white/60 hover:bg-white/10 hover:text-white group-data-[collapsible=icon]:text-white/40"
                          )}
                        >
                            <item.icon className={cn(
                              "size-4.5 group-data-[collapsible=icon]:size-6 transition-colors",
                              isActive ? "text-brand-navy group-data-[collapsible=icon]:text-white" : "group-hover/item:text-white"
                            )} />
                            <span className="text-sm tracking-tight group-data-[collapsible=icon]:hidden">{item.title}</span>
                            {isActive && (
                                <div className="absolute right-0 top-2 bottom-2 w-1 bg-brand-navy rounded-l-full group-data-[collapsible=icon]:hidden" />
                            )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* High-Fidelity Footer */}
      <SidebarFooter className="p-4 mt-auto border-t border-white/10 bg-brand-navy">
        <div className="space-y-4">
          {session?.user && (
            <div className="flex items-center gap-4 px-2 group-data-[collapsible=icon]:hidden animate-slow-fade">
              <div className="size-11 rounded-[1.25rem] bg-white/10 flex items-center justify-center font-black text-white border border-white/20 shadow-inner group-hover:rotate-12 transition-transform">
                <User className="size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-white truncate">{session.user.name || "Executive"}</span>
                <span className="text-[9px] text-white/60 truncate uppercase tracking-[0.2em] font-black">
                  {userRole} NODE
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 group-data-[collapsible=icon]:hidden opacity-30 text-white">
              <ShieldCheck className="size-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">v1.2.0-STABLE</span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

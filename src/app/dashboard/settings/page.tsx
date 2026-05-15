"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  Mail, 
  Shield, 
  UserCircle, 
  TrendingUp,
  Settings as SettingsIcon,
  Users,
  ShieldCheck,
  MoreVertical,
  Key,
  Database,
  Palette,
  Cloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/dashboard/metric-card";
import { getStaffDashboardAction } from "@/modules/users/actions/user.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const result = await getStaffDashboardAction();
      if (result.success) {
        setData(result.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Security Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-slow-fade">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-gradient">Platform Control</h2>
          <p className="text-muted-foreground font-medium">Manage personnel, security roles, and global system integrity.</p>
        </div>
        <Button className="bg-brand-navy hover:bg-brand-navy/90 text-white h-12 px-6 font-black rounded-xl shadow-xl shadow-brand-navy/20 transition-all active:scale-95">
          <Plus className="mr-2 h-5 w-5" />
          INVITE TEAM MEMBER
        </Button>
      </div>

      <Tabs defaultValue="staff" className="space-y-10">
        <TabsList className="bg-muted/30 p-1 rounded-2xl h-14 glass-card border-none">
          <TabsTrigger value="staff" className="rounded-xl h-12 px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-lg">
            <Users className="size-4 mr-2" />
            TEAM ARCHITECTURE
          </TabsTrigger>
          <TabsTrigger value="system" className="rounded-xl h-12 px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-lg">
            <SettingsIcon className="size-4 mr-2" />
            OS CONFIGURATIONS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-10">
          {/* Staff KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Global Team Size"
              value={data.kpis.totalStaff}
              icon={Users}
              description="Verified OS identities"
              variant="slate"
            />
            <MetricCard
              title="Admin Overseers"
              value={data.kpis.adminCount}
              icon={ShieldCheck}
              description="Full system privileges"
              variant="pink"
            />
            <MetricCard
              title="Active Operators"
              value={data.kpis.staffCount}
              icon={UserCircle}
              description="Standard staff roles"
              variant="blue"
            />
          </div>

          {/* Staff Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.staff.map((member: any) => (
              <Card key={member.id} className="group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border-none shadow-sm glass-card overflow-hidden">
                <CardHeader className="pb-6 flex flex-row items-start justify-between border-b border-border/30">
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-3xl bg-brand-navy/10 flex items-center justify-center text-brand-navy font-black text-2xl shadow-inner group-hover:bg-brand-navy group-hover:text-white transition-all duration-500">
                      {member.name?.charAt(0) || "U"}
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-black tracking-tight group-hover:text-brand-navy transition-colors">{member.name || "Anonymous User"}</CardTitle>
                      <Badge className={cn(
                          "border-none font-black text-[10px] px-3 uppercase tracking-widest",
                          member.role === "ADMIN" ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/20" : "bg-brand-silver/10 text-brand-silver"
                      )}>
                          {member.role}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="size-10 rounded-xl inline-flex items-center justify-center hover:bg-brand-navy/5 hover:text-brand-navy transition-colors">
                        <MoreVertical className="h-5 w-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card border-none rounded-2xl shadow-2xl p-2 min-w-[200px]">
                      <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">Privileges</DropdownMenuLabel>
                      <DropdownMenuItem className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy">
                          <Shield className="size-4" /> Modify Role
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy">
                          <Key className="size-4" /> Reset Security Key
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/30" />
                      <DropdownMenuItem className="rounded-xl h-10 font-bold gap-3 text-destructive focus:bg-destructive/5">
                          Revoke Access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                      <div className="size-8 rounded-xl bg-muted/30 flex items-center justify-center">
                          <Mail className="size-4" />
                      </div>
                      {member.email}
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-border/30 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Revenue Impact</p>
                      <p className="text-xl font-black text-brand-navy tracking-tighter">₦{member.revenueGenerated.toLocaleString()}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Sale Volume</p>
                      <div className="flex items-center gap-2 text-xs font-black justify-end">
                        <TrendingUp className="h-4 w-4 text-brand-navy" />
                        {member.saleCount} Transactions
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {[
                    { icon: Database, title: "Operational Database", desc: "Configure PostgreSQL synchronization and automated backups.", status: "OPTIMIZED" },
                    { icon: Palette, title: "Brand Identity DNA", desc: "Manage global glassmorphic design tokens and brand-mesh palettes.", status: "LOCKED" },
                    { icon: Cloud, title: "Asset Architecture", desc: "Fulfillment and product image orchestration via Cloudinary.", status: "CONNECTED" },
                    { icon: Shield, title: "Security Protocols", desc: "Manage NextAuth v5 session expiration and JWT encryption.", status: "MILITARY-GRADE" }
                ].map((item, i) => (
                    <Card key={i} className="glass-card border-none shadow-sm hover:shadow-xl transition-all p-10 rounded-[2.5rem] group">
                        <div className="flex items-start justify-between mb-8">
                            <div className="size-16 rounded-3xl bg-brand-navy/10 flex items-center justify-center text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-all duration-500">
                                <item.icon className="size-8" />
                            </div>
                            <Badge className="bg-muted/30 text-muted-foreground border-none font-black text-[9px] px-3 uppercase tracking-widest">
                                {item.status}
                            </Badge>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-2xl font-black tracking-tight">{item.title}</h4>
                            <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                            <Button variant="ghost" className="h-12 rounded-xl font-black text-xs uppercase tracking-widest gap-2 hover:bg-brand-navy/5 hover:text-brand-navy px-0">
                                ORCHESTRATE CONFIG <Plus className="size-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

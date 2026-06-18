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
  Cloud,
  Percent,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  getProductPriceRequirementSetting, 
  setProductPriceRequirementSetting,
  getAutoVatSetting,
  setAutoVatSetting
} from "@/modules/settings/actions/settings.actions";
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
import { deleteStaffAction, adminResetPasswordAction } from "@/modules/staff/actions/staff.actions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StaffDialog } from "@/modules/staff/components/staff-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Rules and Configuration States
  const [priceFieldsRequired, setPriceFieldsRequired] = useState(true);
  const [autoVatEnabled, setAutoVatEnabled] = useState(false);
  
  // Interactive Team Directory States
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  // Security Credentials Reset States
  const [resetPasswordMember, setResetPasswordMember] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Workspace Revocation States
  const [revokeAccessMember, setRevokeAccessMember] = useState<any>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  async function loadData() {
    const result = await getStaffDashboardAction();
    if (result.success) {
      setData(result.data);
    }
  }

  useEffect(() => {
    async function initPage() {
      setIsLoading(true);
      await loadData();
      
      const [priceRequired, vatActive] = await Promise.all([
        getProductPriceRequirementSetting(),
        getAutoVatSetting()
      ]);
      
      setPriceFieldsRequired(priceRequired);
      setAutoVatEnabled(vatActive);
      setIsLoading(false);
    }
    initPage();
  }, []);

  const handlePriceToggle = async () => {
    const nextValue = !priceFieldsRequired;
    setPriceFieldsRequired(nextValue);
    
    try {
      const result = await setProductPriceRequirementSetting(nextValue);
      if (result.success) {
        setPriceFieldsRequired(result.value);
        toast.success(
          result.value
            ? "Cost and Selling price are now mandatory for product uploads."
            : "Product price requirement set to optional."
        );
      } else {
        setPriceFieldsRequired(!nextValue);
        toast.error("Failed to update pricing rules.");
      }
    } catch (err) {
      setPriceFieldsRequired(!nextValue);
      toast.error("An unexpected connection error occurred.");
    }
  };

  const handleVatToggle = async () => {
    const nextValue = !autoVatEnabled;
    setAutoVatEnabled(nextValue);
    
    try {
      const result = await setAutoVatSetting(nextValue);
      if (result.success) {
        setAutoVatEnabled(result.value);
        toast.success(
          result.value
            ? "Nigerian Auto-VAT (7.5%) configured and active storefront-wide."
            : "Dynamic Auto-VAT calculation deactivated."
        );
      } else {
        setAutoVatEnabled(!nextValue);
        toast.error("Failed to update tax configuration.");
      }
    } catch (err) {
      setAutoVatEnabled(!nextValue);
      toast.error("An unexpected connection error occurred.");
    }
  };

  const handleInviteClick = () => {
    setEditingStaff(null);
    setIsInviteOpen(true);
  };

  const handleModifyRoleClick = (member: any) => {
    setEditingStaff(member);
    setIsInviteOpen(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      toast.error("Please provide a valid password security key.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Security credentials must consist of at least 6 characters.");
      return;
    }

    setIsResetting(true);
    try {
      const result = await adminResetPasswordAction(resetPasswordMember.id, newPassword);
      if (result.success) {
        toast.success(`Credentials securely updated for ${resetPasswordMember.name}.`);
        setResetPasswordMember(null);
        setNewPassword("");
      } else {
        toast.error(result.error || "Failed to update security credentials.");
      }
    } catch (error: any) {
      toast.error(error.message || "Credential override error.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokeAccessMember) return;
    setIsRevoking(true);
    
    try {
      const result = await deleteStaffAction(revokeAccessMember.id);
      if (result.success) {
        toast.success(`Identity and permissions revoked for ${revokeAccessMember.name}.`);
        setRevokeAccessMember(null);
        await loadData();
      } else {
        toast.error(result.error || "Workspace identity revocation failed.");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected database error occurred.");
    } finally {
      setIsRevoking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground animate-pulse">
          Synchronizing Workspace Data...
        </p>
      </div>
    );
  }

  // Filter staff based on the search query
  const filteredStaff = data?.staff?.filter((member: any) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      member.name?.toLowerCase().includes(term) ||
      member.email?.toLowerCase().includes(term)
    );
  }) || [];

  return (
    <div className="space-y-10 animate-slow-fade">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-gradient">Platform Control</h2>
          <p className="text-muted-foreground font-medium">Manage personnel, security roles, and global system integrity.</p>
        </div>
        <Button 
          onClick={handleInviteClick}
          className="bg-brand-navy hover:bg-brand-navy/90 text-white h-12 px-6 font-black rounded-xl shadow-xl shadow-brand-navy/20 transition-all active:scale-95 flex items-center gap-2 shrink-0"
        >
          <Plus className="h-5 w-5" />
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

        {/* Team Architecture Tab */}
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

          {/* Directory Filters */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search team by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-white/50 backdrop-blur-md border border-border/30 rounded-2xl focus-visible:ring-brand-navy focus-visible:ring-offset-0 focus-visible:border-brand-navy font-medium shadow-inner transition-all text-sm"
            />
          </div>

          {/* Staff Grid */}
          {filteredStaff.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredStaff.map((member: any) => (
                <Card key={member.id} className="group hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border-none shadow-sm glass-card overflow-hidden">
                  <CardHeader className="pb-6 flex flex-row items-start justify-between border-b border-border/30">
                    <div className="flex items-center gap-4">
                      <div className="size-16 rounded-3xl bg-brand-navy/10 flex items-center justify-center text-brand-navy font-black text-2xl shadow-inner group-hover:bg-brand-navy group-hover:text-white transition-all duration-500">
                        {member.name?.charAt(0) || "U"}
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-black tracking-tight group-hover:text-brand-navy transition-colors">{member.name || "Anonymous User"}</CardTitle>
                        <Badge className={cn(
                            "border-none font-black text-[10px] px-3 uppercase tracking-widest",
                            member.role === "ADMIN" || member.role === "SUPERADMIN" 
                              ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/20" 
                              : "bg-brand-silver/10 text-brand-silver"
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
                        <DropdownMenuItem 
                          onClick={() => handleModifyRoleClick(member)}
                          className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy cursor-pointer"
                        >
                            <Shield className="size-4" /> Modify Role
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setResetPasswordMember(member)}
                          className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy cursor-pointer"
                        >
                            <Key className="size-4" /> Reset Security Key
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/30" />
                        <DropdownMenuItem 
                          onClick={() => setRevokeAccessMember(member)}
                          className="rounded-xl h-10 font-bold gap-3 text-destructive focus:bg-destructive/5 cursor-pointer"
                        >
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
                        <p className="text-xl font-black text-brand-navy tracking-tighter">₦{member.revenueGenerated?.toLocaleString() || 0}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Sale Volume</p>
                        <div className="flex items-center gap-2 text-xs font-black justify-end">
                          <TrendingUp className="h-4 w-4 text-brand-navy" />
                          {member.saleCount || 0} Transactions
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center rounded-[2.5rem] bg-zinc-50/50 border border-dashed border-zinc-200">
              <div className="size-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4 text-muted-foreground shadow-inner">
                <Search className="size-6" />
              </div>
              <h3 className="font-black text-lg text-zinc-900">No identities matched</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs leading-relaxed">Verify your search query or invite a new team member to this workspace.</p>
            </div>
          )}
        </TabsContent>

        {/* OS Configurations Tab */}
        <TabsContent value="system" className="space-y-12">
          {/* Core System Infrastructure Section */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase tracking-[0.25em] text-brand-navy/80">System Infrastructure</h3>
              <p className="text-xs text-muted-foreground">Core operational, database, and security configurations.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Database, title: "Operational Database", desc: "Configure PostgreSQL synchronization and automated backups.", status: "OPTIMIZED" },
                { icon: Cloud, title: "Asset Architecture", desc: "Fulfillment and product image orchestration via Cloudinary.", status: "CONNECTED" },
                { icon: Shield, title: "Security Protocols", desc: "Manage NextAuth v5 session expiration and JWT encryption.", status: "MILITARY-GRADE" }
              ].map((item, i) => (
                <Card key={i} className="glass-card border border-white/10 hover:border-brand-navy/10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-8 rounded-[2rem] group flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-6">
                      <div className="size-14 rounded-2xl bg-brand-navy/10 flex items-center justify-center text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-all duration-500 shadow-inner">
                        <item.icon className="size-6" />
                      </div>
                      <Badge className="bg-muted/30 text-muted-foreground border-none font-black text-[9px] px-3 py-1 uppercase tracking-widest">
                        {item.status}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xl font-black tracking-tight">{item.title}</h4>
                      <p className="text-muted-foreground text-sm font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button variant="ghost" className="h-10 rounded-xl font-black text-xs uppercase tracking-widest gap-2 hover:bg-brand-navy/5 hover:text-brand-navy px-0 transition-colors">
                      ORCHESTRATE CONFIG <Plus className="size-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Business & Sales Regulations Section */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase tracking-[0.25em] text-brand-navy/80">Business Rules & Financials</h3>
              <p className="text-xs text-muted-foreground">Define catalog policies, custom storefront taxes, and visual identity tokens.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Dynamic Auto-VAT Configuration Card */}
              <Card className="glass-card border border-white/10 hover:border-brand-navy/10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-8 rounded-[2rem] flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="size-14 rounded-2xl bg-brand-navy/10 flex items-center justify-center text-brand-navy shadow-inner">
                      <Percent className="size-6" />
                    </div>
                    <Badge className={cn(
                      "border-none font-black text-[9px] px-3 py-1 uppercase tracking-widest",
                      autoVatEnabled ? "bg-emerald-500/10 text-emerald-600 animate-pulse" : "bg-zinc-400/10 text-zinc-600"
                    )}>
                      {autoVatEnabled ? "VAT INCLUSIVE" : "VAT EXCLUSIVE"}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xl font-black tracking-tight font-heading">Global Tax Configuration</h4>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                      Automatically calculate and append 7.5% Nigerian VAT to all customer-facing prices. Storefront users see a unified price, while admin logs and POS details track the tax itemization.
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-brand-navy/5 border border-border/30">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-brand-navy">Apply 7.5% Auto-VAT</p>
                    <p className="text-[10px] text-muted-foreground">Adjust storefront pricing dynamically.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleVatToggle}
                    className={cn(
                      "relative inline-flex h-10 w-16 rounded-full transition-colors duration-300 focus:outline-none shrink-0 shadow-inner",
                      autoVatEnabled ? "bg-emerald-500" : "bg-zinc-300"
                    )}
                  >
                    <span className={cn(
                      "absolute left-1 top-1 h-8 w-8 rounded-full bg-white shadow-sm transition-transform duration-300",
                      autoVatEnabled ? "translate-x-6" : "translate-x-0"
                    )} />
                    <span className="sr-only">Toggle Nigerian Auto-VAT</span>
                  </button>
                </div>
              </Card>

              {/* Price Requirement Rules Card */}
              <Card className="glass-card border border-white/10 hover:border-brand-navy/10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-8 rounded-[2rem] flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="size-14 rounded-2xl bg-brand-navy/10 flex items-center justify-center text-brand-navy shadow-inner">
                      <Lock className="size-6" />
                    </div>
                    <Badge className={cn(
                      "border-none font-black text-[9px] px-3 py-1 uppercase tracking-widest",
                      priceFieldsRequired ? "bg-emerald-500/10 text-emerald-600" : "bg-zinc-400/10 text-zinc-600"
                    )}>
                      {priceFieldsRequired ? "MANDATORY" : "OPTIONAL"}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xl font-black tracking-tight font-heading">Product Upload Price Rules</h4>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                      Toggle whether product upload must include Cost Price and Selling Price. This persists across sessions and keeps existing product data intact.
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-brand-navy/5 border border-border/30">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-brand-navy">Require Price Fields</p>
                    <p className="text-[10px] text-muted-foreground">Make prices mandatory during creation.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePriceToggle}
                    className={cn(
                      "relative inline-flex h-10 w-16 rounded-full transition-colors duration-300 focus:outline-none shrink-0 shadow-inner",
                      priceFieldsRequired ? "bg-emerald-500" : "bg-zinc-300"
                    )}
                  >
                    <span className={cn(
                      "absolute left-1 top-1 h-8 w-8 rounded-full bg-white shadow-sm transition-transform duration-300",
                      priceFieldsRequired ? "translate-x-6" : "translate-x-0"
                    )} />
                    <span className="sr-only">Toggle product price requirement</span>
                  </button>
                </div>
              </Card>

              {/* Brand Identity Card */}
              <Card className="glass-card border border-white/10 hover:border-brand-navy/10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-8 rounded-[2rem] group flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="size-14 rounded-2xl bg-brand-navy/10 flex items-center justify-center text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-all duration-500 shadow-inner">
                      <Palette className="size-6" />
                    </div>
                    <Badge className="bg-muted/30 text-muted-foreground border-none font-black text-[9px] px-3 py-1 uppercase tracking-widest">
                      LOCKED
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xl font-black tracking-tight">Brand Identity DNA</h4>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                      Manage global glassmorphic design tokens and brand-mesh palettes. (Locked by configuration policy).
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Button variant="ghost" className="h-10 rounded-xl font-black text-xs uppercase tracking-widest gap-2 hover:bg-brand-navy/5 hover:text-brand-navy px-0 transition-colors">
                    ORCHESTRATE CONFIG <Plus className="size-4" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reusable Staff Dialog (Invite & Modification) */}
      <StaffDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        staff={editingStaff}
        onSuccess={async () => {
          await loadData();
        }}
      />

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordMember} onOpenChange={(open) => !open && setResetPasswordMember(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-6 bg-white shadow-2xl border border-zinc-100">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black text-brand-navy">Reset Security Credentials</DialogTitle>
            <DialogDescription className="text-xs">
              Specify a new login password / security key for <span className="font-bold text-zinc-900">{resetPasswordMember?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">New Security Key</label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 bg-zinc-50 border border-zinc-200 rounded-2xl focus-visible:ring-brand-navy text-sm font-medium shadow-inner"
                required
              />
            </div>
            
            <DialogFooter className="pt-4 flex gap-3 -mx-6 -mb-6 bg-zinc-50/50 p-4 border-t border-zinc-100 rounded-b-3xl">
              <Button type="button" variant="outline" onClick={() => setResetPasswordMember(null)} className="h-11 rounded-xl font-bold flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isResetting} className="h-11 rounded-xl bg-brand-navy hover:bg-brand-navy/90 text-white font-black uppercase tracking-wider text-xs flex-1">
                {isResetting && <LoadingSpinner size="sm" className="mr-2" />}
                Reset Key
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revoke Access Confirmation Dialog */}
      <Dialog open={!!revokeAccessMember} onOpenChange={(open) => !open && setRevokeAccessMember(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-6 bg-white shadow-2xl border border-zinc-100">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black text-rose-600">Revoke Workspace Identity</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to permanently revoke system privileges for <span className="font-bold text-zinc-900">{revokeAccessMember?.name}</span> ({revokeAccessMember?.email})?
            </DialogDescription>
          </DialogHeader>
          
          <div className="pt-4 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              This operation deletes their login credentials and invalidates active sessions instantly. Their past transactions and POS ledger entries remain preserved under historical logs.
            </p>
            
            <div className="flex gap-3 pt-4 -mx-6 -mb-6 bg-rose-50/30 p-4 border-t border-rose-100/30 rounded-b-3xl">
              <Button type="button" variant="outline" onClick={() => setRevokeAccessMember(null)} className="h-11 rounded-xl font-bold flex-1">
                Abort
              </Button>
              <Button 
                type="button" 
                onClick={handleRevokeConfirm} 
                disabled={isRevoking} 
                className="h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider text-xs flex-1"
              >
                {isRevoking && <LoadingSpinner size="sm" className="mr-2 animate-spin" />}
                Confirm Revocation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  Lock,
  Truck,
  LayoutGrid,
  Scale,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  getProductPriceRequirementSetting, 
  setProductPriceRequirementSetting,
  getAutoVatSetting,
  setAutoVatSetting
} from "@/modules/settings/actions/settings.actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { SpeedafSettingsDialog } from "@/modules/delivery/components/speedaf-settings-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getCategoriesAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/modules/products/actions/product.actions";
import { invalidateCache } from "@/lib/client-cache";

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
  const [isSpeedafOpen, setIsSpeedafOpen] = useState(false);

  // Category Management States
  const [categories, setCategories] = useState<any[]>([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catName, setCatName] = useState("");
  const [catWeight, setCatWeight] = useState("");
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);

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

  const loadCategories = async () => {
    const res = await getCategoriesAction();
    if (res.success) {
      setCategories(res.data || []);
    }
  };

  useEffect(() => {
    async function initPage() {
      setIsLoading(true);
      await Promise.all([
        loadData(),
        loadCategories()
      ]);
      
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

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setIsSubmittingCat(true);
    try {
      const weightVal = catWeight.trim() === "" ? null : Number(catWeight);
      let res;
      if (editingCategory) {
        res = await updateCategoryAction(editingCategory.id, catName.trim(), weightVal);
      } else {
        res = await createCategoryAction(catName.trim(), weightVal);
      }

      if (res.success) {
        toast.success(editingCategory ? "Category updated successfully" : "Category created successfully");
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        setCatName("");
        setCatWeight("");
        invalidateCache("categories");
        await loadCategories();
      } else {
        toast.error(res.error || "Failed to save category");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setIsDeletingCat(true);
    try {
      const res = await deleteCategoryAction(deletingCategory.id);
      if (res.success) {
        toast.success("Category deleted successfully");
        setDeletingCategory(null);
        invalidateCache("categories");
        await loadCategories();
      } else {
        toast.error(res.error || "Failed to delete category");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsDeletingCat(false);
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
          <TabsTrigger value="categories" className="rounded-xl h-12 px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-lg">
            <LayoutGrid className="size-4 mr-2" />
            PRODUCT CATEGORIES
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

          {/* Staff Table */}
          {filteredStaff.length > 0 ? (
            <div className="rounded-[2rem] border border-border/30 bg-white/50 backdrop-blur-md shadow-sm overflow-hidden glass-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/30">
                      <TableHead className="font-black text-xs uppercase tracking-widest text-brand-navy/70 px-6 py-4">Team Member</TableHead>
                      <TableHead className="font-black text-xs uppercase tracking-widest text-brand-navy/70 px-6 py-4">Email Address</TableHead>
                      <TableHead className="font-black text-xs uppercase tracking-widest text-brand-navy/70 px-6 py-4">Role</TableHead>
                      <TableHead className="font-black text-xs uppercase tracking-widest text-brand-navy/70 px-6 py-4 text-right">Revenue Impact</TableHead>
                      <TableHead className="font-black text-xs uppercase tracking-widest text-brand-navy/70 px-6 py-4 text-right">Sale Volume</TableHead>
                      <TableHead className="font-black text-xs uppercase tracking-widest text-brand-navy/70 px-6 py-4 text-center w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((member: any) => (
                      <TableRow key={member.id} className="hover:bg-brand-navy/5 transition-colors border-b border-border/30 last:border-b-0 group">
                        <TableCell className="px-6 py-4 font-bold text-foreground">
                          <div className="flex items-center gap-4">
                            <div className="size-11 rounded-2xl bg-brand-navy/10 flex items-center justify-center text-brand-navy font-black text-lg shadow-inner group-hover:bg-brand-navy group-hover:text-white transition-all duration-300">
                              {member.name?.charAt(0) || "U"}
                            </div>
                            <span className="font-black tracking-tight">{member.name || "Anonymous User"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 font-medium text-muted-foreground">{member.email}</TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge className={cn(
                              "border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest",
                              member.role === "ADMIN" || member.role === "SUPERADMIN" 
                                ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/20" 
                                : "bg-brand-silver/10 text-brand-silver"
                          )}>
                              {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right font-black text-brand-navy">
                          ₦{member.revenueGenerated?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right font-black text-muted-foreground group-hover:text-brand-navy transition-colors">
                          <div className="flex items-center gap-2 justify-end">
                            <TrendingUp className="h-4 w-4 text-brand-navy/60 group-hover:text-brand-navy" />
                            <span>{member.saleCount || 0} Transactions</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="size-9 rounded-xl inline-flex items-center justify-center hover:bg-brand-navy/10 hover:text-brand-navy transition-colors">
                                <MoreVertical className="h-5 w-5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-card border-none rounded-2xl shadow-2xl p-2 min-w-[200px]">
                              <DropdownMenuGroup>
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
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
        <TabsContent value="system" className="space-y-10">
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase tracking-[0.25em] text-brand-navy/80">Operational Configurations</h3>
              <p className="text-xs text-muted-foreground">Manage active logistics integration, storefront tax rates, and product catalog regulations.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Speedaf Logistics Card */}
              <Card className="glass-card border border-white/10 hover:border-brand-navy/10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-8 rounded-[2rem] flex flex-col justify-between group">
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="size-14 rounded-2xl bg-brand-navy/10 flex items-center justify-center text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-all duration-500 shadow-inner">
                      <Truck className="size-6" />
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[9px] px-3 py-1 uppercase tracking-widest">
                      INTEGRATED
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xl font-black tracking-tight">Speedaf Logistics</h4>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                      Orchestrate shipping regions, mock tariff lookup matrices, waybill creation, and default fallback calculation rules.
                    </p>
                  </div>
                </div>
                <div className="mt-8">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsSpeedafOpen(true)}
                    className="h-10 rounded-xl font-black text-xs uppercase tracking-widest gap-2 hover:bg-brand-navy/5 hover:text-brand-navy px-0 transition-colors"
                  >
                    ORCHESTRATE CONFIG <Plus className="size-4" />
                  </Button>
                </div>
              </Card>

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
                      Automatically calculate and append 7.5% Nigerian VAT to storefront checkout prices and record tax itemization details.
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
                    <h4 className="text-xl font-black tracking-tight font-heading">Upload Price Rules</h4>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                      Toggle whether new catalog product uploads must specify Cost Price and Selling Price fields before saving.
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
            </div>
          </div>
        </TabsContent>

        {/* Product Categories Tab */}
        <TabsContent value="categories" className="space-y-10">
          {/* Categories KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Categories"
              value={categories.length}
              icon={LayoutGrid}
              description="Active catalog categories"
              variant="slate"
            />
            <MetricCard
              title="Weighted Categories"
              value={categories.filter(c => c.weight !== null && c.weight !== undefined).length}
              icon={Scale}
              description="Fallback shipping weights configured"
              variant="pink"
            />
            <MetricCard
              title="Associated Products"
              value={categories.reduce((acc, c) => acc + (c._count?.Product || 0), 0)}
              icon={ShoppingBag}
              description="Total products linked to categories"
              variant="blue"
            />
          </div>

          {/* Directory Filters & Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search categories by name..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                className="pl-11 h-12 bg-white/50 backdrop-blur-md border border-border/30 rounded-2xl focus-visible:ring-brand-navy focus-visible:ring-offset-0 focus-visible:border-brand-navy font-medium shadow-inner transition-all text-sm"
              />
            </div>
            <Button 
              onClick={() => {
                setEditingCategory(null);
                setCatName("");
                setCatWeight("");
                setIsCategoryModalOpen(true);
              }}
              className="bg-brand-navy hover:bg-brand-navy/90 text-white h-12 px-6 font-black rounded-xl shadow-xl shadow-brand-navy/20 transition-all active:scale-95 flex items-center gap-2 shrink-0 self-end sm:self-auto"
            >
              <Plus className="h-5 w-5" />
              ADD NEW CATEGORY
            </Button>
          </div>

          {/* Categories Table */}
          {categories.filter(c => c.name?.toLowerCase().includes(categorySearchQuery.toLowerCase().trim())).length > 0 ? (
            <div className="rounded-[2rem] border border-border/30 bg-white/50 backdrop-blur-md shadow-sm overflow-hidden glass-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/30">
                      <TableHead className="font-black text-xs uppercase tracking-widest text-brand-navy/70 px-6 py-4">Category Name</TableHead>
                      <TableHead className="font-black text-xs uppercase tracking-widest text-brand-navy/70 px-6 py-4">Default Fallback Weight</TableHead>
                      <TableHead className="font-black text-xs uppercase tracking-widest text-brand-navy/70 px-6 py-4 text-right">Linked Products</TableHead>
                      <TableHead className="font-black text-xs uppercase tracking-widest text-brand-navy/70 px-6 py-4 text-center w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories
                      .filter(c => c.name?.toLowerCase().includes(categorySearchQuery.toLowerCase().trim()))
                      .map((category) => (
                        <TableRow key={category.id} className="hover:bg-brand-navy/5 transition-colors border-b border-border/30 last:border-b-0 group">
                          <TableCell className="px-6 py-4 font-bold text-foreground">
                            <div className="flex items-center gap-4">
                              <div className="size-11 rounded-2xl bg-brand-navy/10 flex items-center justify-center text-brand-navy font-black text-lg shadow-inner group-hover:bg-brand-navy group-hover:text-white transition-all duration-300">
                                {category.name?.charAt(0) || "C"}
                              </div>
                              <span className="font-black tracking-tight">{category.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {category.weight !== null && category.weight !== undefined ? (
                              <Badge className="border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest bg-emerald-500/10 text-emerald-600">
                                {category.weight} kg
                              </Badge>
                            ) : (
                              <span className="text-xs font-semibold text-muted-foreground/60 italic">Not Set</span>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right font-black text-brand-navy">
                            <div className="flex items-center gap-2 justify-end">
                              <TrendingUp className="h-4 w-4 text-brand-navy/60 group-hover:text-brand-navy" />
                              <span>{category._count?.Product ?? 0} Products</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="size-9 rounded-xl inline-flex items-center justify-center hover:bg-brand-navy/10 hover:text-brand-navy transition-colors">
                                <MoreVertical className="h-5 w-5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass-card border-none rounded-2xl shadow-2xl p-2 min-w-[150px]">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">Options</DropdownMenuLabel>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setEditingCategory(category);
                                      setCatName(category.name);
                                      setCatWeight(category.weight !== null && category.weight !== undefined ? String(category.weight) : "");
                                      setIsCategoryModalOpen(true);
                                    }}
                                    className="rounded-xl h-10 font-bold gap-3 focus:bg-brand-navy/5 focus:text-brand-navy cursor-pointer"
                                  >
                                    Modify Category
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-border/30" />
                                  <DropdownMenuItem 
                                    onClick={() => setDeletingCategory(category)}
                                    className="rounded-xl h-10 font-bold gap-3 text-destructive focus:bg-destructive/5 cursor-pointer"
                                  >
                                    Delete Category
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center rounded-[2.5rem] bg-zinc-50/50 border border-dashed border-zinc-200">
              <div className="size-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4 text-muted-foreground shadow-inner">
                <Search className="size-6" />
              </div>
              <h3 className="font-black text-lg text-zinc-900">No categories matched</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs leading-relaxed font-semibold">Verify your search filter or add a new category to get started.</p>
            </div>
          )}
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

      <SpeedafSettingsDialog
        open={isSpeedafOpen}
        onOpenChange={setIsSpeedafOpen}
      />

      {/* Category Create/Edit Dialog */}
      <Dialog open={isCategoryModalOpen} onOpenChange={(open) => !open && setIsCategoryModalOpen(false)}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-6 bg-white shadow-2xl border border-zinc-100">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black text-brand-navy">
              {editingCategory ? "Edit Product Category" : "Add Product Category"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingCategory 
                ? "Update this category's name and default fallback weight configuration." 
                : "Create a new product category with an optional default fallback shipping weight."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCategorySubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Category Name</label>
              <Input
                placeholder="e.g. Jeans Trousers, Toys"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="h-12 bg-zinc-50 border border-zinc-200 rounded-2xl focus-visible:ring-brand-navy text-sm font-medium shadow-inner"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Default Fallback Weight (kg)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 0.50"
                value={catWeight}
                onChange={(e) => setCatWeight(e.target.value)}
                className="h-12 bg-zinc-50 border border-zinc-200 rounded-2xl focus-visible:ring-brand-navy text-sm font-medium shadow-inner"
              />
              <p className="text-[10px] text-muted-foreground/60 leading-normal font-semibold">
                This weight serves as a fallback for calculating shipping fees if products in this category do not specify their individual weights.
              </p>
            </div>

            <DialogFooter className="pt-4 flex gap-3 -mx-6 -mb-6 bg-zinc-50/50 p-4 border-t border-zinc-100 rounded-b-3xl mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)} className="h-11 rounded-xl font-bold flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingCat} className="h-11 rounded-xl bg-brand-navy hover:bg-brand-navy/90 text-white font-black uppercase tracking-wider text-xs flex-1">
                {isSubmittingCat ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog with Deletion Guard Warning */}
      <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-6 bg-white shadow-2xl border border-zinc-100">
          <DialogHeader className="space-y-2">
            <DialogTitle className={cn(
              "text-xl font-black",
              deletingCategory?._count?.Product > 0 ? "text-amber-600" : "text-rose-600"
            )}>
              {deletingCategory?._count?.Product > 0 ? "Category Link Blocked" : "Delete Product Category"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {deletingCategory?._count?.Product > 0 
                ? "This category has active product associations and cannot be removed."
                : `Are you sure you want to permanently delete the category '${deletingCategory?.name}'?`}
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4 space-y-4">
            {deletingCategory?._count?.Product > 0 ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed font-semibold">
                  ⚠️ This category is currently linked to <span className="font-black text-amber-900">{deletingCategory._count.Product} products</span>. 
                  Deleting a category that has products attached is restricted to maintain database integrity.
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Please reassign these products to a different category or delete them from the catalog before attempting to delete this category.
                </p>
                <div className="flex gap-3 pt-4 -mx-6 -mb-6 bg-zinc-50/50 p-4 border-t border-zinc-100 rounded-b-3xl mt-4">
                  <Button type="button" onClick={() => setDeletingCategory(null)} className="h-11 rounded-xl bg-brand-navy hover:bg-brand-navy/90 text-white font-black uppercase tracking-wider text-xs flex-1">
                    Close Window
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                  This operation will permanently delete the category <span className="font-black text-zinc-900">{deletingCategory?.name}</span>. This action cannot be undone.
                </p>
                <div className="flex gap-3 pt-4 -mx-6 -mb-6 bg-rose-50/30 p-4 border-t border-rose-100/30 rounded-b-3xl mt-4">
                  <Button type="button" variant="outline" onClick={() => setDeletingCategory(null)} className="h-11 rounded-xl font-bold flex-1">
                    Abort
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleDeleteCategory} 
                    disabled={isDeletingCat} 
                    className="h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider text-xs flex-1"
                  >
                    {isDeletingCat ? "Deleting..." : "Confirm Delete"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

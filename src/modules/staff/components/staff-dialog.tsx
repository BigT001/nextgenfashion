"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { UserRole } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStaffAction, updateStaffAction } from "../actions/staff.actions";
import { toast } from "sonner";

const PERMISSIONS_LIST = [
  { id: "POS", label: "Point of Sale (POS)", description: "Can execute sales, scan barcodes, and accept payments." },
  { id: "PRODUCTS", label: "Product Management", description: "Can create, update, or delete products and categories." },
  { id: "INVENTORY", label: "Inventory Management", description: "Can adjust stock quantities and view warehouse capacities." },
  { id: "ORDERS", label: "Order Management", description: "Can view transaction logs, process refunds, and print receipts." },
  { id: "CUSTOMERS", label: "Customer Relations", description: "Can view patron profiles and update VIP status." },
  { id: "STAFF", label: "Staff Management", description: "Can manage team members, change roles, and suspend users." },
  { id: "ANALYTICS", label: "Analytics & Audit", description: "Can view financial charts, audit logs, and transaction reports." },
];

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum([UserRole.STAFF, UserRole.ADMIN, UserRole.SUPERADMIN]),
  category: z.string().min(1, "Category is required"),
  permissions: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: any | null;
  onSuccess?: () => void;
}

export function StaffDialog({ open, onOpenChange, staff, onSuccess }: StaffDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: staff?.name || "",
      email: staff?.email || "",
      password: "",
      role: staff?.role || UserRole.STAFF,
      category: staff?.category || "Cashier",
      permissions: staff?.permissions || [],
    },
  });

  async function onSubmit(data: any) {
    setIsLoading(true);
    try {
      if (staff) {
        // Update
        const payload: any = { 
          name: data.name, 
          email: data.email, 
          role: data.role,
          category: data.category,
          permissions: data.permissions
        };
        if (data.password) {
          payload.password = data.password;
        }
        
        const res = await updateStaffAction(staff.id, payload);
        if (res.success) {
          toast.success("Staff updated successfully");
          onSuccess?.();
          onOpenChange(false);
        } else {
          toast.error(res.error || "Failed to update staff");
        }
      } else {
        // Create
        if (!data.password) {
          toast.error("Password is required for new staff");
          setIsLoading(false);
          return;
        }
        const res = await createStaffAction({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          category: data.category,
          permissions: data.permissions,
        });
        if (res.success) {
          toast.success("Staff created successfully");
          onSuccess?.();
          onOpenChange(false);
        } else {
          toast.error(res.error || "Failed to create staff");
        }
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{staff ? "Edit Staff" : "Add Staff"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{staff ? "New Password (Optional)" : "Password"}</FormLabel>
                  <FormControl>
                    <Input placeholder="******" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                        <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                        <SelectItem value={UserRole.SUPERADMIN}>Superadmin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cashier">Cashier</SelectItem>
                        <SelectItem value="Accountant">Accountant</SelectItem>
                        <SelectItem value="Store Manager">Store Manager</SelectItem>
                        <SelectItem value="Sales Associate">Sales Associate</SelectItem>
                        <SelectItem value="Inventory Specialist">Inventory Specialist</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Permissions</FormLabel>
              <div className="border rounded-xl p-4 bg-zinc-50/50 space-y-2.5 max-h-[200px] overflow-y-auto">
                {PERMISSIONS_LIST.map((perm) => (
                  <label key={perm.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.watch("permissions")?.includes(perm.id)}
                      onChange={(e) => {
                        const current = form.getValues("permissions") || [];
                        if (e.target.checked) {
                          form.setValue("permissions", [...current, perm.id]);
                        } else {
                          form.setValue("permissions", current.filter(x => x !== perm.id));
                        }
                      }}
                      className="mt-1 rounded border-zinc-300 text-brand-navy focus:ring-brand-navy"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-900">{perm.label}</span>
                      <p className="text-[10px] text-zinc-500 leading-normal">{perm.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {staff ? "Save Changes" : "Create Staff"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

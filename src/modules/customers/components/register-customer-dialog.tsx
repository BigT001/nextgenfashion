"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Loader2, CheckCircle, User, Mail, Phone, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerCustomerAction } from "../actions/customer.actions";

const schema = z.object({
  name:     z.string().min(2, "Full name is required"),
  email:    z.string().email("Enter a valid email address"),
  phone:    z.string().min(7, "Enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

interface RegisterCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegisterCustomerDialog({ open, onClose, onSuccess }: RegisterCustomerDialogProps) {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    setServerError(null);
    const result = await registerCustomerAction(values);
    if (!result.success) {
      setServerError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      reset();
      onSuccess();
      onClose();
    }, 1500);
  }

  function handleClose() {
    reset();
    setServerError(null);
    setSuccess(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[95vw] p-0 border-none overflow-hidden rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="px-8 py-7" style={{ background: "linear-gradient(160deg, #0f2352 0%, #1a3a8a 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="size-10 bg-white/15 rounded-2xl flex items-center justify-center">
              <UserPlus className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white font-black text-lg tracking-tight">Register Customer</DialogTitle>
              <p className="text-white/50 text-[11px] font-semibold mt-0.5">Add a new customer to the system</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white px-8 py-7">
          {success ? (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <CheckCircle className="size-12 text-emerald-500" />
              <p className="font-black text-lg text-zinc-800">Customer Registered!</p>
              <p className="text-sm text-zinc-400">The new customer has been added successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <User className="size-3" /> Full Name
                </Label>
                <Input
                  {...register("name")}
                  placeholder="e.g. Amaka Johnson"
                  className="h-12 rounded-2xl border-zinc-200 focus-visible:ring-[#0f2352]/20 focus-visible:border-[#0f2352]/40 bg-zinc-50 font-semibold"
                />
                {errors.name && <p className="text-xs text-red-500 font-semibold">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <Mail className="size-3" /> Email Address
                </Label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="amaka@example.com"
                  className="h-12 rounded-2xl border-zinc-200 focus-visible:ring-[#0f2352]/20 focus-visible:border-[#0f2352]/40 bg-zinc-50 font-semibold"
                />
                {errors.email && <p className="text-xs text-red-500 font-semibold">{errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <Phone className="size-3" /> Phone Number
                </Label>
                <Input
                  {...register("phone")}
                  placeholder="e.g. 08012345678"
                  className="h-12 rounded-2xl border-zinc-200 focus-visible:ring-[#0f2352]/20 focus-visible:border-[#0f2352]/40 bg-zinc-50 font-semibold"
                />
                {errors.phone && <p className="text-xs text-red-500 font-semibold">{errors.phone.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <Lock className="size-3" /> Default Password
                </Label>
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="Min. 6 characters"
                  className="h-12 rounded-2xl border-zinc-200 focus-visible:ring-[#0f2352]/20 focus-visible:border-[#0f2352]/40 bg-zinc-50 font-semibold"
                />
                {errors.password && <p className="text-xs text-red-500 font-semibold">{errors.password.message}</p>}
              </div>

              {/* Server Error */}
              {serverError && (
                <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-xs font-bold text-red-600">{serverError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest border-zinc-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg"
                  style={{ background: "linear-gradient(135deg, #0f2352, #1a3a8a)" }}
                >
                  {isSubmitting ? (
                    <><Loader2 className="size-4 mr-2 animate-spin" /> Registering...</>
                  ) : (
                    <><UserPlus className="size-4 mr-2" /> Register</>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
